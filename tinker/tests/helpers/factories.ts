import type {
  AppSetting,
  Bridge,
  CameraState,
  Item,
  ItemMedia,
  LockerItem,
  Scar,
  Shop,
  Skill,
  SkillBridge,
  Workbench,
} from "@/types";

const now = new Date("2026-04-25T12:00:00.000Z");

export function shopFactory(overrides: Partial<Shop> = {}): Shop {
  return {
    id: "shop-1",
    name: "Test Shop",
    backgroundTexture: "pegboard",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function workbenchFactory(overrides: Partial<Workbench> = {}): Workbench {
  return {
    id: "workbench-1",
    shopId: "shop-1",
    name: "Test Project",
    description: "A project for tests",
    templateQuestions: null,
    posX: 120,
    posY: 180,
    posZ: 0,
    width: 800,
    height: 600,
    lastOpenedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function itemFactory(overrides: Partial<Item> = {}): Item {
  return {
    id: "item-1",
    workbenchId: "workbench-1",
    type: "observation",
    content: "Observed a thing",
    posX: 0,
    posY: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function mediaFactory(overrides: Partial<ItemMedia> = {}): ItemMedia {
  return {
    id: "media-1",
    itemId: "item-1",
    type: "photo",
    path: "/tmp/evidence.png",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function scarFactory(overrides: Partial<Scar> = {}): Scar {
  return {
    id: "scar-1",
    itemId: "item-1",
    failureType: "execution",
    severity: "minor",
    costTime: null,
    costMaterials: null,
    costMoney: null,
    notes: "A short note about what went wrong.",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function skillFactory(overrides: Partial<Skill> = {}): Skill {
  return {
    id: "skill-1",
    workbenchId: "workbench-1",
    name: "Cutting dovetails",
    status: "exposed",
    evidence: null,
    evidenceMediaPath: null,
    evidenceWorkbenchId: "workbench-1",
    lastEvidenceAt: null,
    reviewDueAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function bridgeFactory(overrides: Partial<Bridge> = {}): Bridge {
  return {
    id: "bridge-1",
    sourceItemId: "item-1",
    targetItemId: "item-2",
    note: "This bridge note is definitely long enough to satisfy the fifty character rule.",
    strength: 2,
    lastReinforcedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function skillBridgeFactory(overrides: Partial<SkillBridge> = {}): SkillBridge {
  return {
    id: "skill-bridge-1",
    skillId: "skill-1",
    itemId: "item-1",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function lockerItemFactory(overrides: Partial<LockerItem> = {}): LockerItem {
  return {
    id: "locker-1",
    type: "article",
    title: "Useful reference",
    url: "https://example.com/reference",
    whyThisMatters: "It explains the joinery detail I keep missing.",
    staleDate: new Date("2026-05-09T12:00:00.000Z"),
    isArchived: false,
    archivedAt: null,
    rescuedItemId: null,
    rescuedWorkbenchId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function cameraStateFactory(overrides: Partial<CameraState> = {}): CameraState {
  return {
    id: "camera-1",
    workbenchId: "workbench-1",
    posX: 0,
    posY: 0,
    zoom: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function appSettingFactory(overrides: Partial<AppSetting> = {}): AppSetting {
  return {
    id: "setting-1",
    key: "preferences",
    value: "{}",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
