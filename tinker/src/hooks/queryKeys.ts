export const queryKeys = {
  shops: ["shops"] as const,
  shop: (id: string) => ["shops", id] as const,
  workbenches: (shopId?: string) =>
    shopId ? (["workbenches", shopId] as const) : (["workbenches"] as const),
  workbench: (id: string) => ["workbenches", id] as const,
  items: (workbenchId: string) => ["items", workbenchId] as const,
  item: (id: string) => ["items", id] as const,
  itemMedia: (itemId: string) => ["itemMedia", itemId] as const,
  scars: (itemId: string) => ["scars", itemId] as const,
  skills: (workbenchId?: string) =>
    workbenchId ? (["skills", workbenchId] as const) : (["skills"] as const),
  skill: (id: string) => ["skills", id] as const,
  skillsDue: ["skills", "due"] as const,
  bridges: (itemId?: string) =>
    itemId ? (["bridges", itemId] as const) : (["bridges"] as const),
  bridgesDecaying: ["bridges", "decaying"] as const,
  locker: ["locker"] as const,
  lockerStale: ["locker", "stale"] as const,
  camera: (shopId: string) => ["camera", shopId] as const,
  scarMap: (type: string) => ["scarMap", type] as const,
  appSettings: ["appSettings"] as const,
  appSetting: (key: string) => ["appSettings", key] as const,
} as const;
