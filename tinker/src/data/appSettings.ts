import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { AppSetting, AppSettingInsert, AppSettingUpdate } from "@/types";
import { getTable, insertRow, updateRow } from "@/lib/browserStore";
import { withDataFallback } from "./backend";

export async function getAllAppSettings(): Promise<AppSetting[]> {
  return withDataFallback(
    () => getTable<AppSetting>("appSettings").sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    ),
    () => db.select().from(appSettings).orderBy(desc(appSettings.updatedAt))
  );
}

export async function getAppSettingByKey(key: string): Promise<AppSetting | null> {
  return withDataFallback(
    () => getTable<AppSetting>("appSettings").find((setting) => setting.key === key) ?? null,
    async () => {
      const result = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
      return result[0] ?? null;
    }
  );
}

export async function upsertAppSetting(data: AppSettingInsert): Promise<AppSetting> {
  const existing = await getAppSettingByKey(data.key);

  if (!existing) {
    return withDataFallback(
      () => insertRow("appSettings", data as AppSetting),
      async () => {
        const result = await db.insert(appSettings).values(data).returning();
        return result[0];
      }
    );
  }

  return updateAppSetting(existing.id, { value: data.value });
}

export async function updateAppSetting(id: string, data: AppSettingUpdate): Promise<AppSetting> {
  return withDataFallback(
    () => updateRow<AppSetting>("appSettings", id, (setting) => ({
      ...setting,
      ...data,
      updatedAt: new Date(),
    })),
    async () => {
      const result = await db
        .update(appSettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(appSettings.id, id))
        .returning();

      return result[0];
    }
  );
}
