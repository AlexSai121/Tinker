import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { Shop, ShopInsert, ShopUpdate } from "@/types";
import { deleteRow, getTable, insertRow, setTable, updateRow } from "@/lib/browserStore";
import { withDataFallback } from "./backend";

export async function getAllShops(): Promise<Shop[]> {
  return withDataFallback(
    () => getTable<Shop>("shops").sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    ),
    () => db.select().from(shops).orderBy(desc(shops.createdAt))
  );
}

export async function getShopById(id: string): Promise<Shop | undefined> {
  return withDataFallback(
    () => getTable<Shop>("shops").find((shop) => shop.id === id),
    async () => {
      const result = await db.select().from(shops).where(eq(shops.id, id)).limit(1);
      return result[0];
    }
  );
}

export async function createShop(data: ShopInsert): Promise<Shop> {
  return withDataFallback(
    () => insertRow("shops", data as Shop),
    async () => {
      const result = await db.insert(shops).values(data).returning();
      return result[0];
    }
  );
}

export async function updateShop(id: string, data: ShopUpdate): Promise<Shop> {
  return withDataFallback(
    () => updateRow<Shop>("shops", id, (shop) => ({
      ...shop,
      ...data,
      updatedAt: new Date(),
    })),
    async () => {
      const result = await db
        .update(shops)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(shops.id, id))
        .returning();
      return result[0];
    }
  );
}

export async function deleteShop(id: string): Promise<void> {
  return withDataFallback(
    () => {
      const workbenchIds = getTable<{ id: string; shopId: string }>("workbenches")
        .filter((workbench) => workbench.shopId === id)
        .map((workbench) => workbench.id);
      const itemIds = getTable<{ id: string; workbenchId: string }>("items")
        .filter((item) => workbenchIds.includes(item.workbenchId))
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
          .filter((item) => !workbenchIds.includes(item.workbenchId))
      );
      setTable(
        "skills",
        getTable<{ id: string; workbenchId: string | null; evidenceWorkbenchId: string | null }>("skills")
          .filter((skill) => !workbenchIds.includes(skill.workbenchId ?? ""))
          .map((skill) => ({
            ...skill,
            evidenceWorkbenchId: workbenchIds.includes(skill.evidenceWorkbenchId ?? "") ? null : skill.evidenceWorkbenchId,
          }))
      );
      setTable(
        "cameraStates",
        getTable<{ id: string; workbenchId: string }>("cameraStates")
          .filter((entry) => !workbenchIds.includes(entry.workbenchId))
      );
      setTable(
        "workbenches",
        getTable<{ id: string; shopId: string }>("workbenches")
          .filter((workbench) => workbench.shopId !== id)
      );
      deleteRow("shops", id);
    },
    async () => {
      await db.delete(shops).where(eq(shops.id, id));
    }
  );
}
