import { db } from "@/db";
import { workbenches } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { Workbench, WorkbenchInsert, WorkbenchUpdate } from "@/types";
import { deleteRow, getTable, insertRow, setTable, updateRow } from "@/lib/browserStore";
import { DUST_THRESHOLD_DAYS } from "@/utils/constants";
import { withDataFallback } from "./backend";

const WORKBENCH_ARCHIVE_MARKER = "[ARCHIVED]";

export function isWorkbenchArchived(workbench: Pick<Workbench, "name">): boolean {
  return workbench.name.includes(WORKBENCH_ARCHIVE_MARKER);
}

export function getWorkbenchDisplayName(name: string): string {
  return name
    .replaceAll(WORKBENCH_ARCHIVE_MARKER, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function calculateDustLevel(
  workbench: Pick<Workbench, "createdAt" | "updatedAt" | "lastOpenedAt">,
  referenceDate: Date = new Date(),
  thresholdDays: number = DUST_THRESHOLD_DAYS
) {
  const lastActivity = new Date(
    Math.max(
      new Date(workbench.lastOpenedAt ?? 0).getTime(),
      new Date(workbench.updatedAt).getTime(),
      new Date(workbench.createdAt).getTime()
    )
  );
  const daysInactive = (referenceDate.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.min(1, daysInactive / Math.max(1, thresholdDays)));
}

export async function getAllWorkbenches(): Promise<Workbench[]> {
  return withDataFallback(
    () => getTable<Workbench>("workbenches").sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    ),
    () => db.select().from(workbenches).orderBy(desc(workbenches.createdAt))
  );
}

export async function getWorkbenchById(id: string): Promise<Workbench | undefined> {
  return withDataFallback(
    () => getTable<Workbench>("workbenches").find((workbench) => workbench.id === id),
    async () => {
      const result = await db.select().from(workbenches).where(eq(workbenches.id, id)).limit(1);
      return result[0];
    }
  );
}

export async function getWorkbenchesByShop(shopId: string): Promise<Workbench[]> {
  return withDataFallback(
    () => getTable<Workbench>("workbenches")
      .filter((workbench) => workbench.shopId === shopId && !isWorkbenchArchived(workbench))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    async () => {
      const rows = await db.select().from(workbenches).where(eq(workbenches.shopId, shopId)).orderBy(desc(workbenches.createdAt));
      return rows.filter((workbench) => !isWorkbenchArchived(workbench));
    }
  );
}

export async function createWorkbench(data: WorkbenchInsert): Promise<Workbench> {
  return withDataFallback(
    () => insertRow("workbenches", data as Workbench),
    async () => {
      const result = await db.insert(workbenches).values(data).returning();
      return result[0];
    }
  );
}

export async function updateWorkbench(id: string, data: WorkbenchUpdate): Promise<Workbench> {
  return withDataFallback(
    () => updateRow<Workbench>("workbenches", id, (workbench) => ({
      ...workbench,
      ...data,
      updatedAt: new Date(),
    })),
    async () => {
      const result = await db
        .update(workbenches)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(workbenches.id, id))
        .returning();
      return result[0];
    }
  );
}

export async function deleteWorkbench(id: string): Promise<void> {
  return withDataFallback(
    () => {
      const itemIds = getTable<{ id: string; workbenchId: string }>("items")
        .filter((item) => item.workbenchId === id)
        .map((item) => item.id);

      setTable(
        "bridges",
        getTable<{ id: string; sourceItemId: string; targetItemId: string }>("bridges")
          .filter((bridge) => !itemIds.includes(bridge.sourceItemId) && !itemIds.includes(bridge.targetItemId))
      );
      setTable(
        "skillBridges",
        getTable<{ id: string; itemId: string }>("skillBridges")
          .filter((bridge) => !itemIds.includes(bridge.itemId))
      );
      setTable(
        "itemMedia",
        getTable<{ id: string; itemId: string }>("itemMedia")
          .filter((entry) => !itemIds.includes(entry.itemId))
      );
      setTable(
        "scars",
        getTable<{ id: string; itemId: string }>("scars")
          .filter((entry) => !itemIds.includes(entry.itemId))
      );
      setTable(
        "items",
        getTable<{ id: string; workbenchId: string }>("items")
          .filter((item) => item.workbenchId !== id)
      );
      setTable(
        "skills",
        getTable<{ id: string; workbenchId: string | null; evidenceWorkbenchId: string | null }>("skills")
          .filter((skill) => skill.workbenchId !== id)
          .map((skill) => ({
            ...skill,
            evidenceWorkbenchId: skill.evidenceWorkbenchId === id ? null : skill.evidenceWorkbenchId,
          }))
      );
      setTable(
        "cameraStates",
        getTable<{ id: string; workbenchId: string }>("cameraStates")
          .filter((entry) => entry.workbenchId !== id)
      );
      deleteRow("workbenches", id);
    },
    async () => {
      await db.delete(workbenches).where(eq(workbenches.id, id));
    }
  );
}

export async function archiveWorkbench(id: string): Promise<Workbench> {
  // Since schema doesn't have an isArchived flag for workbenches, 
  // we append [ARCHIVED] to the name to differentiate it.
  const wb = await getWorkbenchById(id);
  if (!wb) throw new Error("Workbench not found");

  return withDataFallback(
    () => updateRow<Workbench>("workbenches", id, (workbench) => ({
      ...workbench,
      name: isWorkbenchArchived(workbench) ? workbench.name : `${workbench.name} ${WORKBENCH_ARCHIVE_MARKER}`,
      updatedAt: new Date(),
    })),
    async () => {
      const result = await db
        .update(workbenches)
        .set({
          name: isWorkbenchArchived(wb) ? wb.name : `${wb.name} ${WORKBENCH_ARCHIVE_MARKER}`,
          updatedAt: new Date(),
        })
        .where(eq(workbenches.id, id))
        .returning();
      return result[0];
    }
  );
}

export async function restoreWorkbench(id: string): Promise<Workbench> {
  const wb = await getWorkbenchById(id);
  if (!wb) throw new Error("Workbench not found");

  return withDataFallback(
    () => updateRow<Workbench>("workbenches", id, (workbench) => ({
      ...workbench,
      name: getWorkbenchDisplayName(workbench.name) || "Untitled Project",
      updatedAt: new Date(),
    })),
    async () => {
      const result = await db
        .update(workbenches)
        .set({
          name: getWorkbenchDisplayName(wb.name) || "Untitled Project",
          updatedAt: new Date(),
        })
        .where(eq(workbenches.id, id))
        .returning();
      return result[0];
    }
  );
}

export async function updateDust(id: string, date: Date): Promise<Workbench> {
  return withDataFallback(
    () => updateRow<Workbench>("workbenches", id, (workbench) => ({
      ...workbench,
      lastOpenedAt: date,
      updatedAt: new Date(),
    })),
    async () => {
      const result = await db
        .update(workbenches)
        .set({ lastOpenedAt: date, updatedAt: new Date() })
        .where(eq(workbenches.id, id))
        .returning();
      return result[0];
    }
  );
}
