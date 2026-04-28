import { db } from "@/db";
import { scars } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import type { Scar, ScarInsert, ScarUpdate } from "@/types";
import { deleteRow, getTable, insertRow, updateRow } from "@/lib/browserStore";
import { withDataFallback } from "./backend";

export async function getAllScars(): Promise<Scar[]> {
  return withDataFallback(
    () => getTable<Scar>("scars").sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    () => db.select().from(scars).orderBy(desc(scars.createdAt))
  );
}

export async function getScarById(id: string): Promise<Scar | undefined> {
  return withDataFallback(
    () => getTable<Scar>("scars").find((scar) => scar.id === id),
    async () => {
      const result = await db.select().from(scars).where(eq(scars.id, id)).limit(1);
      return result[0];
    }
  );
}

export async function getScarsByItem(itemId: string): Promise<Scar[]> {
  return withDataFallback(
    () => getTable<Scar>("scars")
      .filter((scar) => scar.itemId === itemId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    () => db.select().from(scars).where(eq(scars.itemId, itemId)).orderBy(desc(scars.createdAt))
  );
}

export async function createScar(data: ScarInsert): Promise<Scar> {
  return withDataFallback(
    () => insertRow("scars", data as Scar),
    async () => {
      const result = await db.insert(scars).values(data).returning();
      return result[0];
    }
  );
}

export async function updateScar(id: string, data: ScarUpdate): Promise<Scar> {
  return withDataFallback(
    () => updateRow<Scar>("scars", id, (scar) => ({
      ...scar,
      ...data,
      updatedAt: new Date(),
    })),
    async () => {
      const result = await db
        .update(scars)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(scars.id, id))
        .returning();
      return result[0];
    }
  );
}

export async function deleteScar(id: string): Promise<void> {
  return withDataFallback(
    () => {
      deleteRow("scars", id);
    },
    async () => {
      await db.delete(scars).where(eq(scars.id, id));
    }
  );
}

// aggregate: simple count by failureType
export async function aggregateScarsByType(): Promise<{ failureType: string; count: number }[]> {
  return withDataFallback(
    () => {
      const counts = new Map<string, number>();
      for (const scar of getTable<Scar>("scars")) {
        counts.set(scar.failureType, (counts.get(scar.failureType) ?? 0) + 1);
      }

      return [...counts.entries()].map(([failureType, count]) => ({ failureType, count }));
    },
    async () => {
      const result = await db
        .select({
          failureType: scars.failureType,
          count: sql<number>`count(*)`.mapWith(Number),
        })
        .from(scars)
        .groupBy(scars.failureType);
      return result;
    }
  );
}
