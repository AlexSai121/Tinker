import { nanoid } from "nanoid";
import { and, desc, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { lockerItems } from "@/db/schema";
import type { Item, LockerItem, LockerItemInsert, LockerItemUpdate } from "@/types";
import { createItem } from "@/data/items";
import { deleteRow, getTable, insertRow, setTable, updateRow } from "@/lib/browserStore";
import { LOCKER_STALE_DAYS } from "@/utils/constants";
import { encodeStructuredItemContent } from "@/utils/itemContent";
import { withDataFallback } from "./backend";

export interface RescueLockerItemInput {
  lockerItemId: string;
  workbenchId: string;
  whyThisMatters: string;
}

export interface RescueLockerItemResult {
  lockerItem: LockerItem;
  rescuedItem: Item;
}

function getDefaultStaleDate(referenceDate: Date = new Date()): Date {
  return getConfiguredStaleDate(LOCKER_STALE_DAYS, referenceDate);
}

function getConfiguredStaleDate(staleDays: number, referenceDate: Date = new Date()): Date {
  const staleDate = new Date(referenceDate);
  staleDate.setDate(staleDate.getDate() + Math.max(1, staleDays));
  return staleDate;
}

async function syncAutoArchiveLockerItems(referenceDate: Date = new Date()): Promise<void> {
  await withDataFallback(
    () => {
      const rows = getTable<LockerItem>("lockerItems");
      let changed = false;
      const nextRows = rows.map((item) => {
        if (!item.isArchived && item.staleDate <= referenceDate) {
          changed = true;
          return {
            ...item,
            isArchived: true,
            archivedAt: item.archivedAt ?? referenceDate,
            updatedAt: referenceDate,
          };
        }

        return item;
      });

      if (changed) {
        setTable("lockerItems", nextRows);
      }
    },
    async () => {
      await db
        .update(lockerItems)
        .set({
          isArchived: true,
          archivedAt: referenceDate,
          updatedAt: referenceDate,
        })
        .where(and(eq(lockerItems.isArchived, false), lte(lockerItems.staleDate, referenceDate)));
    }
  );
}

export async function getAllLockerItems(): Promise<LockerItem[]> {
  await syncAutoArchiveLockerItems();

  return withDataFallback(
    () =>
      getTable<LockerItem>("lockerItems").sort((left, right) => {
        if (left.isArchived !== right.isArchived) {
          return left.isArchived ? 1 : -1;
        }

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }),
    () => db.select().from(lockerItems).orderBy(desc(lockerItems.createdAt))
  );
}

export async function getLockerItemById(id: string): Promise<LockerItem | undefined> {
  await syncAutoArchiveLockerItems();

  return withDataFallback(
    () => getTable<LockerItem>("lockerItems").find((item) => item.id === id),
    async () => {
      const result = await db.select().from(lockerItems).where(eq(lockerItems.id, id)).limit(1);
      return result[0];
    }
  );
}

export async function createLockerItem(data: LockerItemInsert): Promise<LockerItem> {
  const lockerItem: LockerItem = {
    ...data,
    url: data.url ?? null,
    whyThisMatters: data.whyThisMatters ?? null,
    staleDate: data.staleDate ?? getDefaultStaleDate(),
    isArchived: data.isArchived ?? false,
    archivedAt: data.archivedAt ?? null,
    rescuedItemId: data.rescuedItemId ?? null,
    rescuedWorkbenchId: data.rescuedWorkbenchId ?? null,
  };

  return withDataFallback(
    () => insertRow("lockerItems", lockerItem),
    async () => {
      const result = await db.insert(lockerItems).values(lockerItem).returning();
      return result[0];
    }
  );
}

export async function updateLockerItem(id: string, data: LockerItemUpdate): Promise<LockerItem> {
  return withDataFallback(
    () => updateRow<LockerItem>("lockerItems", id, (item) => ({
      ...item,
      ...data,
      updatedAt: new Date(),
    })),
    async () => {
      const result = await db
        .update(lockerItems)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(lockerItems.id, id))
        .returning();
      return result[0];
    }
  );
}

export async function deleteLockerItem(id: string): Promise<void> {
  return withDataFallback(
    () => {
      deleteRow("lockerItems", id);
    },
    async () => {
      await db.delete(lockerItems).where(eq(lockerItems.id, id));
    }
  );
}

export async function getStaleLockerItems(referenceDate: Date = new Date()): Promise<LockerItem[]> {
  await syncAutoArchiveLockerItems(referenceDate);

  return withDataFallback(
    () => getTable<LockerItem>("lockerItems")
      .filter((item) => item.staleDate <= referenceDate)
      .sort((left, right) => new Date(left.staleDate).getTime() - new Date(right.staleDate).getTime()),
    () =>
      db
        .select()
        .from(lockerItems)
        .where(lte(lockerItems.staleDate, referenceDate))
        .orderBy(desc(lockerItems.staleDate))
  );
}

export async function archiveLockerItem(id: string): Promise<LockerItem> {
  const archiveDate = new Date();

  return withDataFallback(
    () => updateRow<LockerItem>("lockerItems", id, (item) => ({
      ...item,
      isArchived: true,
      archivedAt: archiveDate,
      updatedAt: archiveDate,
    })),
    async () => {
      const result = await db
        .update(lockerItems)
        .set({ isArchived: true, archivedAt: archiveDate, updatedAt: archiveDate })
        .where(eq(lockerItems.id, id))
        .returning();
      return result[0];
    }
  );
}

export async function restoreLockerItem(id: string, staleDays: number = LOCKER_STALE_DAYS): Promise<LockerItem> {
  const restoredAt = new Date();
  const staleDate = getConfiguredStaleDate(staleDays, restoredAt);

  return withDataFallback(
    () => updateRow<LockerItem>("lockerItems", id, (item) => ({
      ...item,
      isArchived: false,
      archivedAt: null,
      staleDate,
      rescuedItemId: null,
      rescuedWorkbenchId: null,
      updatedAt: restoredAt,
    })),
    async () => {
      const result = await db
        .update(lockerItems)
        .set({
          isArchived: false,
          archivedAt: null,
          staleDate,
          rescuedItemId: null,
          rescuedWorkbenchId: null,
          updatedAt: restoredAt,
        })
        .where(eq(lockerItems.id, id))
        .returning();
      return result[0];
    }
  );
}

export async function rescueLockerItem(input: RescueLockerItemInput): Promise<RescueLockerItemResult> {
  const lockerItem = await getLockerItemById(input.lockerItemId);

  if (!lockerItem) {
    throw new Error("Locker item not found");
  }

  const whyThisMatters = input.whyThisMatters.trim() || lockerItem.whyThisMatters?.trim() || "";
  if (whyThisMatters.length < 10) {
    throw new Error("Rescuing a locker item needs a Why This Matters note of at least 10 characters.");
  }

  const now = new Date();
  const rescuedItem = await createItem({
    id: nanoid(),
    workbenchId: input.workbenchId,
    type: "reference",
    content: encodeStructuredItemContent({
      version: 1,
      content: lockerItem.title,
      sourceUrl: lockerItem.url ?? undefined,
      whyThisMatters,
    }),
    createdAt: now,
    updatedAt: now,
  });

  const archivedLockerItem = await updateLockerItem(lockerItem.id, {
    whyThisMatters,
    isArchived: true,
    archivedAt: now,
    rescuedItemId: rescuedItem.id,
    rescuedWorkbenchId: input.workbenchId,
  });

  return {
    lockerItem: archivedLockerItem,
    rescuedItem,
  };
}
