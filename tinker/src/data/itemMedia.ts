import { db } from "@/db";
import { itemMedia } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import type { ItemMedia, ItemMediaInsert } from "@/types";
import { deleteRow, getTable, insertRow } from "@/lib/browserStore";
import { withDataFallback } from "./backend";

export async function getMediaByItem(itemId: string): Promise<ItemMedia[]> {
  return withDataFallback(
    () => getTable<ItemMedia>("itemMedia")
      .filter((media) => media.itemId === itemId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    () =>
      db
        .select()
        .from(itemMedia)
        .where(eq(itemMedia.itemId, itemId))
        .orderBy(desc(itemMedia.createdAt))
  );
}

export async function createItemMedia(data: ItemMediaInsert): Promise<ItemMedia> {
  return withDataFallback(
    () => insertRow("itemMedia", data as ItemMedia),
    async () => {
      const result = await db.insert(itemMedia).values(data).returning();
      return result[0];
    }
  );
}

export async function deleteItemMedia(id: string): Promise<void> {
  return withDataFallback(
    () => {
      deleteRow("itemMedia", id);
    },
    async () => {
      await db.delete(itemMedia).where(eq(itemMedia.id, id));
    }
  );
}
