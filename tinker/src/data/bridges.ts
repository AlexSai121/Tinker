import { db } from "@/db";
import { bridges } from "@/db/schema";
import { eq, desc, and, lt, or, isNull } from "drizzle-orm";
import type { Bridge, BridgeInsert, BridgeUpdate } from "@/types";
import { deleteRow, getTable, insertRow, updateRow } from "@/lib/browserStore";
import { BRIDGE_DECAY_DAYS } from "@/utils/constants";
import { withDataFallback } from "./backend";

const BRIDGE_FRESH_DAYS = 30;

export type BridgeFreshness = "fresh" | "established" | "dormant";

export function getBridgeActivityDate(bridge: Pick<Bridge, "createdAt" | "lastReinforcedAt">): Date {
  return bridge.lastReinforcedAt ?? bridge.createdAt;
}

export function getBridgeAgeInDays(
  bridge: Pick<Bridge, "createdAt" | "lastReinforcedAt">,
  referenceDate: Date = new Date()
): number {
  const ageMs = referenceDate.getTime() - getBridgeActivityDate(bridge).getTime();
  return Math.max(0, ageMs / (1000 * 60 * 60 * 24));
}

export function getEffectiveBridgeStrength(
  bridge: Pick<Bridge, "strength" | "createdAt" | "lastReinforcedAt">,
  referenceDate: Date = new Date()
): number {
  const decayedStrength = bridge.strength - getBridgeAgeInDays(bridge, referenceDate) / BRIDGE_DECAY_DAYS;
  return Math.max(0.75, Number(decayedStrength.toFixed(2)));
}

export function getBridgeFreshness(
  bridge: Pick<Bridge, "createdAt" | "lastReinforcedAt">,
  referenceDate: Date = new Date()
): BridgeFreshness {
  const ageDays = getBridgeAgeInDays(bridge, referenceDate);
  if (ageDays < BRIDGE_FRESH_DAYS) {
    return "fresh";
  }
  if (ageDays < BRIDGE_DECAY_DAYS) {
    return "established";
  }
  return "dormant";
}

export function isBridgeDecaying(
  bridge: Pick<Bridge, "createdAt" | "lastReinforcedAt">,
  referenceDate: Date = new Date()
): boolean {
  return getBridgeAgeInDays(bridge, referenceDate) >= BRIDGE_DECAY_DAYS;
}

export function getBridgeFreshnessColor(freshness: BridgeFreshness): string {
  if (freshness === "fresh") {
    return "#CC785C";
  }
  if (freshness === "established") {
    return "#A09D96";
  }
  return "#6C6A64";
}

export async function getAllBridges(): Promise<Bridge[]> {
  return withDataFallback(
    () => getTable<Bridge>("bridges").sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    () => db.select().from(bridges).orderBy(desc(bridges.createdAt))
  );
}

export async function getBridgeById(id: string): Promise<Bridge | undefined> {
  return withDataFallback(
    () => getTable<Bridge>("bridges").find((bridge) => bridge.id === id),
    async () => {
      const result = await db.select().from(bridges).where(eq(bridges.id, id)).limit(1);
      return result[0];
    }
  );
}

export async function getBridgesByItem(itemId: string): Promise<Bridge[]> {
  return withDataFallback(
    () => getTable<Bridge>("bridges")
      .filter((bridge) => bridge.sourceItemId === itemId || bridge.targetItemId === itemId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    () =>
      db
        .select()
        .from(bridges)
        .where(or(eq(bridges.sourceItemId, itemId), eq(bridges.targetItemId, itemId)))
        .orderBy(desc(bridges.createdAt))
  );
}

export async function createBridge(data: BridgeInsert): Promise<Bridge> {
  return withDataFallback(
    () =>
      insertRow("bridges", {
        ...data,
        strength: data.strength ?? 1,
        lastReinforcedAt: data.lastReinforcedAt ?? null,
      } as Bridge),
    async () => {
      const result = await db.insert(bridges).values(data).returning();
      return result[0];
    }
  );
}

export async function updateBridge(id: string, data: BridgeUpdate): Promise<Bridge> {
  return withDataFallback(
    () => updateRow<Bridge>("bridges", id, (bridge) => ({
      ...bridge,
      ...data,
      updatedAt: new Date(),
    })),
    async () => {
      const result = await db
        .update(bridges)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(bridges.id, id))
        .returning();
      return result[0];
    }
  );
}

export async function deleteBridge(id: string): Promise<void> {
  return withDataFallback(
    () => {
      deleteRow("bridges", id);
    },
    async () => {
      await db.delete(bridges).where(eq(bridges.id, id));
    }
  );
}

export async function reinforceBridge(id: string): Promise<Bridge> {
  const bridge = await getBridgeById(id);
  if (!bridge) throw new Error("Bridge not found");

  return withDataFallback(
    () => updateRow<Bridge>("bridges", id, (current) => ({
      ...current,
      strength: Math.min(current.strength + 1, 5),
      lastReinforcedAt: new Date(),
      updatedAt: new Date(),
    })),
    async () => {
      const result = await db
        .update(bridges)
        .set({
          strength: Math.min(bridge.strength + 1, 5),
          lastReinforcedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(bridges.id, id))
        .returning();
      return result[0];
    }
  );
}

export async function getDecayingBridges(): Promise<Bridge[]> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - BRIDGE_DECAY_DAYS);

  return withDataFallback(
    () => getTable<Bridge>("bridges")
      .filter((bridge) => isBridgeDecaying(bridge))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    () =>
      db
        .select()
        .from(bridges)
        .where(
          or(
            and(isNull(bridges.lastReinforcedAt), lt(bridges.createdAt, ninetyDaysAgo)),
            lt(bridges.lastReinforcedAt, ninetyDaysAgo)
          )
        )
        .orderBy(desc(bridges.createdAt))
  );
}
