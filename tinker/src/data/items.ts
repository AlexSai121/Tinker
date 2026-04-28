import { db } from "@/db";
import { items } from "@/db/schema";
import { eq, desc, like, or } from "drizzle-orm";
import type { Item, ItemInsert, ItemUpdate } from "@/types";
import { deleteRow, getTable, insertRow, setTable, updateRow } from "@/lib/browserStore";
import { withDataFallback } from "./backend";

export async function getAllItems(): Promise<Item[]> {
  return withDataFallback(
    () => getTable<Item>("items").sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    () => db.select().from(items).orderBy(desc(items.createdAt))
  );
}

export async function getItemById(id: string): Promise<Item | undefined> {
  return withDataFallback(
    () => getTable<Item>("items").find((item) => item.id === id),
    async () => {
      const result = await db.select().from(items).where(eq(items.id, id)).limit(1);
      return result[0];
    }
  );
}

export async function getItemsByWorkbench(workbenchId: string): Promise<Item[]> {
  return withDataFallback(
    () => getTable<Item>("items")
      .filter((item) => item.workbenchId === workbenchId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    () => db.select().from(items).where(eq(items.workbenchId, workbenchId)).orderBy(desc(items.createdAt))
  );
}

export async function getItemsByType(type: Item["type"]): Promise<Item[]> {
  return withDataFallback(
    () => getTable<Item>("items")
      .filter((item) => item.type === type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    () => db.select().from(items).where(eq(items.type, type)).orderBy(desc(items.createdAt))
  );
}

export async function searchItems(query: string): Promise<Item[]> {
  return withDataFallback(
    () => {
      const lowerQuery = query.toLowerCase();
      return getTable<Item>("items")
        .filter((item) => item.content.toLowerCase().includes(lowerQuery))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
    () =>
      db
        .select()
        .from(items)
        .where(or(like(items.content, `%${query}%`)))
        .orderBy(desc(items.createdAt))
  );
}

export async function createItem(data: ItemInsert): Promise<Item> {
  return withDataFallback(
    () => insertRow("items", data as Item),
    async () => {
      const result = await db.insert(items).values(data).returning();
      return result[0];
    }
  );
}

export async function updateItem(id: string, data: ItemUpdate): Promise<Item> {
  return withDataFallback(
    () => updateRow<Item>("items", id, (item) => ({
      ...item,
      ...data,
      updatedAt: new Date(),
    })),
    async () => {
      const result = await db
        .update(items)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(items.id, id))
        .returning();
      return result[0];
    }
  );
}

export async function deleteItem(id: string): Promise<void> {
  return withDataFallback(
    () => {
      const bridges = getTable<{ id: string; sourceItemId: string; targetItemId: string }>("bridges")
        .filter((bridge) => bridge.sourceItemId !== id && bridge.targetItemId !== id);
      const skillBridges = getTable<{ id: string; itemId: string }>("skillBridges")
        .filter((bridge) => bridge.itemId !== id);
      const media = getTable<{ id: string; itemId: string }>("itemMedia")
        .filter((entry) => entry.itemId !== id);
      const scars = getTable<{ id: string; itemId: string }>("scars")
        .filter((entry) => entry.itemId !== id);

      setTable("bridges", bridges);
      setTable("skillBridges", skillBridges);
      setTable("itemMedia", media);
      setTable("scars", scars);
      deleteRow("items", id);
    },
    async () => {
      await db.delete(items).where(eq(items.id, id));
    }
  );
}
