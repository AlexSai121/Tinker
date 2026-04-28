import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import * as schema from "../db/schema";

// Shops
export type Shop = InferSelectModel<typeof schema.shops>;
export type ShopInsert = InferInsertModel<typeof schema.shops>;
export type ShopUpdate = Partial<Omit<ShopInsert, "id" | "createdAt">>;

// Workbenches
export type Workbench = InferSelectModel<typeof schema.workbenches>;
export type WorkbenchInsert = InferInsertModel<typeof schema.workbenches>;
export type WorkbenchUpdate = Partial<Omit<WorkbenchInsert, "id" | "createdAt">>;

// Items
export type Item = InferSelectModel<typeof schema.items>;
export type ItemInsert = InferInsertModel<typeof schema.items>;
export type ItemUpdate = Partial<Omit<ItemInsert, "id" | "createdAt">>;

// Item Media
export type ItemMedia = InferSelectModel<typeof schema.itemMedia>;
export type ItemMediaInsert = InferInsertModel<typeof schema.itemMedia>;
export type ItemMediaUpdate = Partial<Omit<ItemMediaInsert, "id" | "createdAt">>;

// Scars
export type Scar = InferSelectModel<typeof schema.scars>;
export type ScarInsert = InferInsertModel<typeof schema.scars>;
export type ScarUpdate = Partial<Omit<ScarInsert, "id" | "createdAt">>;

// Skills
export type Skill = InferSelectModel<typeof schema.skills>;
export type SkillInsert = InferInsertModel<typeof schema.skills>;
export type SkillUpdate = Partial<Omit<SkillInsert, "id" | "createdAt">>;

// Bridges
export type Bridge = InferSelectModel<typeof schema.bridges>;
export type BridgeInsert = InferInsertModel<typeof schema.bridges>;
export type BridgeUpdate = Partial<Omit<BridgeInsert, "id" | "createdAt">>;

// Skill Bridges
export type SkillBridge = InferSelectModel<typeof schema.skillBridges>;
export type SkillBridgeInsert = InferInsertModel<typeof schema.skillBridges>;
export type SkillBridgeUpdate = Partial<Omit<SkillBridgeInsert, "id" | "createdAt">>;

// Locker Items
export type LockerItem = InferSelectModel<typeof schema.lockerItems>;
export type LockerItemInsert = InferInsertModel<typeof schema.lockerItems>;
export type LockerItemUpdate = Partial<Omit<LockerItemInsert, "id" | "createdAt">>;

// Camera States
export type CameraState = InferSelectModel<typeof schema.cameraStates>;
export type CameraStateInsert = InferInsertModel<typeof schema.cameraStates>;
export type CameraStateUpdate = Partial<Omit<CameraStateInsert, "id" | "createdAt">>;

// App Settings
export type AppSetting = InferSelectModel<typeof schema.appSettings>;
export type AppSettingInsert = InferInsertModel<typeof schema.appSettings>;
export type AppSettingUpdate = Partial<Omit<AppSettingInsert, "id" | "createdAt">>;
