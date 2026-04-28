import { db } from "@/db";
import { appSettings, bridges, cameraStates, itemMedia, lockerItems, scars, shops, skillBridges, skills, workbenches, items } from "@/db/schema";
import { getBrowserStoreSnapshot, replaceBrowserStoreSnapshot } from "@/lib/browserStore";
import { isElectronRuntime } from "@/lib/runtime";
import type { AppSetting, Bridge, CameraState, Item, ItemMedia, LockerItem, Scar, Shop, Skill, SkillBridge, Workbench } from "@/types";
import { z } from "zod";
import {
  appSettingInsertSchema,
  bridgeInsertSchema,
  cameraStateInsertSchema,
  itemInsertSchema,
  itemMediaInsertSchema,
  lockerItemInsertSchema,
  scarInsertSchema,
  shopInsertSchema,
  skillBridgeInsertSchema,
  skillInsertSchema,
  workbenchInsertSchema,
} from "@/utils/validators";

export type ExportScope = "full" | "shop";
export type ImportMode = "merge" | "replace";

export interface ExportOptions {
  scope: ExportScope;
  shopId?: string;
  from?: Date | null;
  to?: Date | null;
}

export interface ImportOptions {
  json: string;
  mode: ImportMode;
}

interface ExportTables {
  shops: Shop[];
  workbenches: Workbench[];
  items: Item[];
  itemMedia: ItemMedia[];
  scars: Scar[];
  skills: Skill[];
  bridges: Bridge[];
  skillBridges: SkillBridge[];
  lockerItems: LockerItem[];
  cameraStates: CameraState[];
  appSettings: AppSetting[];
}

const exportTablesSchema = z.object({
  shops: z.array(shopInsertSchema),
  workbenches: z.array(workbenchInsertSchema),
  items: z.array(itemInsertSchema),
  itemMedia: z.array(itemMediaInsertSchema),
  scars: z.array(scarInsertSchema),
  skills: z.array(skillInsertSchema),
  bridges: z.array(bridgeInsertSchema),
  skillBridges: z.array(skillBridgeInsertSchema),
  lockerItems: z.array(lockerItemInsertSchema),
  cameraStates: z.array(cameraStateInsertSchema),
  appSettings: z.array(appSettingInsertSchema),
});

const importPayloadSchema = z.object({
  version: z.number(),
  generatedAt: z.string().optional(),
  scope: z.enum(["full", "shop"]).optional(),
  shopId: z.string().optional(),
  dateRange: z.object({
    from: z.string().nullable().optional(),
    to: z.string().nullable().optional(),
  }).optional(),
  summary: z.record(z.string(), z.number()).optional(),
  mediaManifest: z.array(z.object({
    id: z.string(),
    itemId: z.string(),
    type: z.string(),
    path: z.string(),
  })).optional(),
  data: exportTablesSchema,
});

function normalizeImportedTables(data: z.infer<typeof exportTablesSchema>): ExportTables {
  return {
    shops: data.shops.map((shop) => ({
      ...shop,
      backgroundTexture: shop.backgroundTexture ?? "pegboard",
    })),
    workbenches: data.workbenches.map((workbench) => ({
      ...workbench,
      posX: workbench.posX ?? 0,
      posY: workbench.posY ?? 0,
      posZ: workbench.posZ ?? 0,
      width: workbench.width ?? 1000,
      height: workbench.height ?? 1000,
      description: workbench.description ?? null,
      templateQuestions: workbench.templateQuestions ?? null,
      lastOpenedAt: workbench.lastOpenedAt ?? null,
    })),
    items: data.items.map((item) => ({
      ...item,
      posX: item.posX ?? 0,
      posY: item.posY ?? 0,
    })),
    itemMedia: data.itemMedia.map((media) => ({
      ...media,
    })),
    scars: data.scars.map((scar) => ({
      ...scar,
      costTime: scar.costTime ?? null,
      costMaterials: scar.costMaterials ?? null,
      costMoney: scar.costMoney ?? null,
      notes: scar.notes ?? null,
    })),
    skills: data.skills.map((skill) => ({
      ...skill,
      workbenchId: skill.workbenchId ?? null,
      evidence: skill.evidence ?? null,
      evidenceMediaPath: skill.evidenceMediaPath ?? null,
      evidenceWorkbenchId: skill.evidenceWorkbenchId ?? null,
      lastEvidenceAt: skill.lastEvidenceAt ?? null,
      reviewDueAt: skill.reviewDueAt ?? null,
    })),
    bridges: data.bridges.map((bridge) => ({
      ...bridge,
      strength: bridge.strength ?? 1,
      lastReinforcedAt: bridge.lastReinforcedAt ?? null,
    })),
    skillBridges: data.skillBridges.map((skillBridge) => ({
      ...skillBridge,
    })),
    lockerItems: data.lockerItems.map((lockerItem) => ({
      ...lockerItem,
      url: lockerItem.url ?? null,
      whyThisMatters: lockerItem.whyThisMatters ?? null,
      isArchived: lockerItem.isArchived ?? false,
      archivedAt: lockerItem.archivedAt ?? null,
      rescuedItemId: lockerItem.rescuedItemId ?? null,
      rescuedWorkbenchId: lockerItem.rescuedWorkbenchId ?? null,
    })),
    cameraStates: data.cameraStates.map((cameraState) => ({
      ...cameraState,
      posX: cameraState.posX ?? 0,
      posY: cameraState.posY ?? 0,
      zoom: cameraState.zoom ?? 1,
    })),
    appSettings: data.appSettings.map((setting) => ({
      ...setting,
    })),
  };
}

function summarizeTables(tables: ExportTables) {
  return {
    shops: tables.shops.length,
    workbenches: tables.workbenches.length,
    items: tables.items.length,
    itemMedia: tables.itemMedia.length,
    scars: tables.scars.length,
    skills: tables.skills.length,
    bridges: tables.bridges.length,
    skillBridges: tables.skillBridges.length,
    lockerItems: tables.lockerItems.length,
    cameraStates: tables.cameraStates.length,
    appSettings: tables.appSettings.length,
  };
}

function buildMediaManifest(rows: ItemMedia[]) {
  return rows.map((row) => ({
    id: row.id,
    itemId: row.itemId,
    type: row.type,
    path: row.path,
  }));
}

function mergeRowsById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const merged = new Map(current.map((row) => [row.id, row]));
  for (const row of incoming) {
    merged.set(row.id, row);
  }
  return [...merged.values()];
}

function mergeAppSettings(current: AppSetting[], incoming: AppSetting[]): AppSetting[] {
  const merged = new Map(current.map((setting) => [setting.key, setting]));
  for (const setting of incoming) {
    merged.set(setting.key, setting);
  }
  return [...merged.values()];
}

function mergeExportTables(current: ExportTables, incoming: ExportTables): ExportTables {
  return {
    shops: mergeRowsById(current.shops, incoming.shops),
    workbenches: mergeRowsById(current.workbenches, incoming.workbenches),
    items: mergeRowsById(current.items, incoming.items),
    itemMedia: mergeRowsById(current.itemMedia, incoming.itemMedia),
    scars: mergeRowsById(current.scars, incoming.scars),
    skills: mergeRowsById(current.skills, incoming.skills),
    bridges: mergeRowsById(current.bridges, incoming.bridges),
    skillBridges: mergeRowsById(current.skillBridges, incoming.skillBridges),
    lockerItems: mergeRowsById(current.lockerItems, incoming.lockerItems),
    cameraStates: mergeRowsById(current.cameraStates, incoming.cameraStates),
    appSettings: mergeAppSettings(current.appSettings, incoming.appSettings),
  };
}

function buildImportWarnings(payloadScope: ExportScope | undefined, mode: ImportMode, tables: ExportTables): string[] {
  const warnings: string[] = [];

  if (payloadScope === "shop" && mode === "replace") {
    warnings.push("This import replaced the workspace with a shop-scoped export.");
  }

  const localMediaCount = tables.itemMedia.filter((media) => !/^(data:|blob:|https?:\/\/)/i.test(media.path)).length;
  if (localMediaCount > 0 && !isElectronRuntime) {
    warnings.push(`Imported ${localMediaCount} media path reference${localMediaCount === 1 ? "" : "s"} that cannot be verified in the browser preview.`);
  }

  return warnings;
}

function inDateRange(date: Date, from?: Date | null, to?: Date | null) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function filterByCreatedAt<T extends { createdAt: Date }>(rows: T[], from?: Date | null, to?: Date | null) {
  return rows.filter((row) => inDateRange(row.createdAt, from, to));
}

async function getAllTables(): Promise<ExportTables> {
  if (!isElectronRuntime) {
    const snapshot = getBrowserStoreSnapshot();
    return snapshot as unknown as ExportTables;
  }

  const [
    allShops,
    allWorkbenches,
    allItems,
    allItemMedia,
    allScars,
    allSkills,
    allBridges,
    allSkillBridges,
    allLockerItems,
    allCameraStates,
    allAppSettings,
  ] = await Promise.all([
    db.select().from(shops),
    db.select().from(workbenches),
    db.select().from(items),
    db.select().from(itemMedia),
    db.select().from(scars),
    db.select().from(skills),
    db.select().from(bridges),
    db.select().from(skillBridges),
    db.select().from(lockerItems),
    db.select().from(cameraStates),
    db.select().from(appSettings),
  ]);

  return {
    shops: allShops,
    workbenches: allWorkbenches,
    items: allItems,
    itemMedia: allItemMedia,
    scars: allScars,
    skills: allSkills,
    bridges: allBridges,
    skillBridges: allSkillBridges,
    lockerItems: allLockerItems,
    cameraStates: allCameraStates,
    appSettings: allAppSettings,
  };
}

export async function buildExportPayload(options: ExportOptions) {
  const tables = await getAllTables();
  const from = options.from ?? null;
  const to = options.to ?? null;

  const dateFiltered = {
    shops: filterByCreatedAt(tables.shops, from, to),
    workbenches: filterByCreatedAt(tables.workbenches, from, to),
    items: filterByCreatedAt(tables.items, from, to),
    itemMedia: filterByCreatedAt(tables.itemMedia, from, to),
    scars: filterByCreatedAt(tables.scars, from, to),
    skills: filterByCreatedAt(tables.skills, from, to),
    bridges: filterByCreatedAt(tables.bridges, from, to),
    skillBridges: filterByCreatedAt(tables.skillBridges, from, to),
    lockerItems: filterByCreatedAt(tables.lockerItems, from, to),
    cameraStates: filterByCreatedAt(tables.cameraStates, from, to),
    appSettings: filterByCreatedAt(tables.appSettings, from, to),
  };

  if (options.scope === "shop" && options.shopId) {
    const scopedShops = dateFiltered.shops.filter((shop) => shop.id === options.shopId);
    const scopedWorkbenchIds = new Set(
      dateFiltered.workbenches
        .filter((workbench) => workbench.shopId === options.shopId)
        .map((workbench) => workbench.id)
    );
    const scopedItemIds = new Set(
      dateFiltered.items
        .filter((item) => scopedWorkbenchIds.has(item.workbenchId))
        .map((item) => item.id)
    );
    const scopedSkillIds = new Set(
      dateFiltered.skills
        .filter((skill) => skill.workbenchId && scopedWorkbenchIds.has(skill.workbenchId))
        .map((skill) => skill.id)
    );

    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      scope: options.scope,
      shopId: options.shopId,
      dateRange: {
        from: from?.toISOString() ?? null,
        to: to?.toISOString() ?? null,
      },
      data: {
        shops: scopedShops,
        workbenches: dateFiltered.workbenches.filter((workbench) => scopedWorkbenchIds.has(workbench.id)),
        items: dateFiltered.items.filter((item) => scopedItemIds.has(item.id)),
        itemMedia: dateFiltered.itemMedia.filter((media) => scopedItemIds.has(media.itemId)),
        scars: dateFiltered.scars.filter((scar) => scopedItemIds.has(scar.itemId)),
        skills: dateFiltered.skills.filter((skill) => skill.workbenchId && scopedWorkbenchIds.has(skill.workbenchId)),
        bridges: dateFiltered.bridges.filter(
          (bridge) => scopedItemIds.has(bridge.sourceItemId) || scopedItemIds.has(bridge.targetItemId)
        ),
        skillBridges: dateFiltered.skillBridges.filter(
          (skillBridge) => scopedSkillIds.has(skillBridge.skillId) || scopedItemIds.has(skillBridge.itemId)
        ),
        lockerItems: [],
        cameraStates: dateFiltered.cameraStates.filter((camera) => scopedWorkbenchIds.has(camera.workbenchId)),
        appSettings: dateFiltered.appSettings,
      },
      summary: summarizeTables({
        shops: scopedShops,
        workbenches: dateFiltered.workbenches.filter((workbench) => scopedWorkbenchIds.has(workbench.id)),
        items: dateFiltered.items.filter((item) => scopedItemIds.has(item.id)),
        itemMedia: dateFiltered.itemMedia.filter((media) => scopedItemIds.has(media.itemId)),
        scars: dateFiltered.scars.filter((scar) => scopedItemIds.has(scar.itemId)),
        skills: dateFiltered.skills.filter((skill) => skill.workbenchId && scopedWorkbenchIds.has(skill.workbenchId)),
        bridges: dateFiltered.bridges.filter(
          (bridge) => scopedItemIds.has(bridge.sourceItemId) || scopedItemIds.has(bridge.targetItemId)
        ),
        skillBridges: dateFiltered.skillBridges.filter(
          (skillBridge) => scopedSkillIds.has(skillBridge.skillId) || scopedItemIds.has(skillBridge.itemId)
        ),
        lockerItems: [],
        cameraStates: dateFiltered.cameraStates.filter((camera) => scopedWorkbenchIds.has(camera.workbenchId)),
        appSettings: dateFiltered.appSettings,
      }),
      mediaManifest: buildMediaManifest(dateFiltered.itemMedia.filter((media) => scopedItemIds.has(media.itemId))),
    };
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    scope: options.scope,
    dateRange: {
      from: from?.toISOString() ?? null,
      to: to?.toISOString() ?? null,
    },
    data: dateFiltered,
    summary: summarizeTables(dateFiltered),
    mediaManifest: buildMediaManifest(dateFiltered.itemMedia),
  };
}

export async function importExportPayload(options: ImportOptions) {
  const payload = importPayloadSchema.parse(JSON.parse(options.json));
  const incomingTables = normalizeImportedTables(payload.data);
  const nextTables = options.mode === "merge"
    ? mergeExportTables(await getAllTables(), incomingTables)
    : incomingTables;

  if (!isElectronRuntime) {
    replaceBrowserStoreSnapshot(nextTables);
  } else {
    await db.delete(skillBridges);
    await db.delete(bridges);
    await db.delete(itemMedia);
    await db.delete(scars);
    await db.delete(skills);
    await db.delete(items);
    await db.delete(cameraStates);
    await db.delete(lockerItems);
    await db.delete(workbenches);
    await db.delete(shops);
    await db.delete(appSettings);

    if (nextTables.shops.length > 0) await db.insert(shops).values(nextTables.shops);
    if (nextTables.workbenches.length > 0) await db.insert(workbenches).values(nextTables.workbenches);
    if (nextTables.items.length > 0) await db.insert(items).values(nextTables.items);
    if (nextTables.itemMedia.length > 0) await db.insert(itemMedia).values(nextTables.itemMedia);
    if (nextTables.scars.length > 0) await db.insert(scars).values(nextTables.scars);
    if (nextTables.skills.length > 0) await db.insert(skills).values(nextTables.skills);
    if (nextTables.bridges.length > 0) await db.insert(bridges).values(nextTables.bridges);
    if (nextTables.skillBridges.length > 0) await db.insert(skillBridges).values(nextTables.skillBridges);
    if (nextTables.lockerItems.length > 0) await db.insert(lockerItems).values(nextTables.lockerItems);
    if (nextTables.cameraStates.length > 0) await db.insert(cameraStates).values(nextTables.cameraStates);
    if (nextTables.appSettings.length > 0) await db.insert(appSettings).values(nextTables.appSettings);
  }

  return {
    mode: options.mode,
    counts: summarizeTables(nextTables),
    warnings: buildImportWarnings(payload.scope, options.mode, nextTables),
  };
}
