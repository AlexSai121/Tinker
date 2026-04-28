import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import {
  SHOP_BACKGROUNDS,
  ITEM_TYPES,
  MEDIA_TYPES,
  SCAR_FAILURE_TYPES,
  SCAR_SEVERITIES,
  SKILL_STATUSES,
  LOCKER_ITEM_TYPES,
} from "../utils/constants";

export const shops = sqliteTable(
  "shops",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    backgroundTexture: text("background_texture", { enum: SHOP_BACKGROUNDS })
      .notNull()
      .default("pegboard"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("shop_created_idx").on(table.createdAt),
  ]
);

export const shopsRelations = relations(shops, ({ many }) => ({
  workbenches: many(workbenches),
}));

export const workbenches = sqliteTable(
  "workbenches",
  {
    id: text("id").primaryKey(),
    shopId: text("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    posX: real("pos_x").notNull().default(0),
    posY: real("pos_y").notNull().default(0),
    posZ: real("pos_z").notNull().default(0),
    description: text("description"),
    templateQuestions: text("template_questions"),
    width: real("width").notNull().default(1000),
    height: real("height").notNull().default(1000),
    lastOpenedAt: integer("last_opened_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("workbench_shop_idx").on(table.shopId),
    index("workbench_created_idx").on(table.createdAt),
    index("workbench_last_opened_idx").on(table.lastOpenedAt),
  ]
);

export const workbenchesRelations = relations(workbenches, ({ one, many }) => ({
  shop: one(shops, {
    fields: [workbenches.shopId],
    references: [shops.id],
  }),
  items: many(items),
  cameraState: one(cameraStates, {
    fields: [workbenches.id],
    references: [cameraStates.workbenchId],
  }),
}));

export const items = sqliteTable(
  "items",
  {
    id: text("id").primaryKey(),
    workbenchId: text("workbench_id")
      .notNull()
      .references(() => workbenches.id, { onDelete: "cascade" }),
    type: text("type", { enum: ITEM_TYPES }).notNull(),
    content: text("content").notNull(),
    posX: real("pos_x").notNull().default(0),
    posY: real("pos_y").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("item_workbench_idx").on(table.workbenchId),
    index("item_type_idx").on(table.type),
  ]
);

export const itemsRelations = relations(items, ({ one, many }) => ({
  workbench: one(workbenches, {
    fields: [items.workbenchId],
    references: [workbenches.id],
  }),
  media: many(itemMedia),
  scars: many(scars),
  bridgesAsSource: many(bridges, { relationName: "sourceBridge" }),
  bridgesAsTarget: many(bridges, { relationName: "targetBridge" }),
  skillBridges: many(skillBridges),
}));

export const itemMedia = sqliteTable(
  "item_media",
  {
    id: text("id").primaryKey(),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    type: text("type", { enum: MEDIA_TYPES }).notNull(),
    path: text("path").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("media_item_idx").on(table.itemId),
  ]
);

export const itemMediaRelations = relations(itemMedia, ({ one }) => ({
  item: one(items, {
    fields: [itemMedia.itemId],
    references: [items.id],
  }),
}));

export const scars = sqliteTable(
  "scars",
  {
    id: text("id").primaryKey(),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    failureType: text("failure_type", { enum: SCAR_FAILURE_TYPES }).notNull(),
    severity: text("severity", { enum: SCAR_SEVERITIES }).notNull(),
    costTime: text("cost_time"),
    costMaterials: text("cost_materials"),
    costMoney: text("cost_money"),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("scar_item_idx").on(table.itemId),
    index("scar_failure_type_idx").on(table.failureType),
  ]
);

export const scarsRelations = relations(scars, ({ one }) => ({
  item: one(items, {
    fields: [scars.itemId],
    references: [items.id],
  }),
}));

export const skills = sqliteTable(
  "skills",
  {
    id: text("id").primaryKey(),
    workbenchId: text("workbench_id").references(() => workbenches.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    status: text("status", { enum: SKILL_STATUSES }).notNull(),
    evidence: text("evidence"),
    evidenceMediaPath: text("evidence_media_path"),
    evidenceWorkbenchId: text("evidence_workbench_id"),
    lastEvidenceAt: integer("last_evidence_at", { mode: "timestamp" }),
    reviewDueAt: integer("review_due_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("skill_workbench_idx").on(table.workbenchId),
    index("skill_status_idx").on(table.status),
  ]
);

export const skillsRelations = relations(skills, ({ one, many }) => ({
  workbench: one(workbenches, {
    fields: [skills.workbenchId],
    references: [workbenches.id],
  }),
  skillBridges: many(skillBridges),
}));

export const bridges = sqliteTable(
  "bridges",
  {
    id: text("id").primaryKey(),
    sourceItemId: text("source_item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    targetItemId: text("target_item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    note: text("note").notNull(),
    strength: integer("strength").notNull().default(1),
    lastReinforcedAt: integer("last_reinforced_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("bridge_source_idx").on(table.sourceItemId),
    index("bridge_target_idx").on(table.targetItemId),
  ]
);

export const bridgesRelations = relations(bridges, ({ one }) => ({
  sourceItem: one(items, {
    fields: [bridges.sourceItemId],
    references: [items.id],
    relationName: "sourceBridge",
  }),
  targetItem: one(items, {
    fields: [bridges.targetItemId],
    references: [items.id],
    relationName: "targetBridge",
  }),
}));

export const skillBridges = sqliteTable(
  "skill_bridges",
  {
    id: text("id").primaryKey(),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    itemId: text("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("skill_bridge_skill_idx").on(table.skillId),
    index("skill_bridge_item_idx").on(table.itemId),
  ]
);

export const skillBridgesRelations = relations(skillBridges, ({ one }) => ({
  skill: one(skills, {
    fields: [skillBridges.skillId],
    references: [skills.id],
  }),
  item: one(items, {
    fields: [skillBridges.itemId],
    references: [items.id],
  }),
}));

export const lockerItems = sqliteTable(
  "locker_items",
  {
    id: text("id").primaryKey(),
    type: text("type", { enum: LOCKER_ITEM_TYPES }).notNull(),
    title: text("title").notNull(),
    url: text("url"),
    whyThisMatters: text("why_this_matters"),
    staleDate: integer("stale_date", { mode: "timestamp" }).notNull(),
    isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
    archivedAt: integer("archived_at", { mode: "timestamp" }),
    rescuedItemId: text("rescued_item_id"),
    rescuedWorkbenchId: text("rescued_workbench_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("locker_stale_date_idx").on(table.staleDate),
    index("locker_archived_idx").on(table.isArchived),
  ]
);

export const cameraStates = sqliteTable(
  "camera_states",
  {
    id: text("id").primaryKey(),
    workbenchId: text("workbench_id")
      .notNull()
      .references(() => workbenches.id, { onDelete: "cascade" }),
    posX: real("pos_x").notNull().default(0),
    posY: real("pos_y").notNull().default(0),
    zoom: real("zoom").notNull().default(1),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("camera_state_workbench_idx").on(table.workbenchId),
  ]
);

export const cameraStatesRelations = relations(cameraStates, ({ one }) => ({
  workbench: one(workbenches, {
    fields: [cameraStates.workbenchId],
    references: [workbenches.id],
  }),
}));

export const appSettings = sqliteTable(
  "app_settings",
  {
    id: text("id").primaryKey(),
    key: text("key").notNull().unique(),
    value: text("value").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  }
);
