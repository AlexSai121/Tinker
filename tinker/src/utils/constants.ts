export const BENCH_MAX_ITEMS = 50;
export const LOCKER_STALE_DAYS = 14;
export const DUST_THRESHOLD_DAYS = 30;
export const BRIDGE_DECAY_DAYS = 90;

export const SHOP_BACKGROUNDS = ["pegboard", "concrete", "butcher_block", "grid_paper"] as const;
export const ITEM_TYPES = ["observation", "reference", "attempt", "question", "breakthrough", "sticky"] as const;
export const CREATABLE_ITEM_TYPES = ["observation", "reference", "attempt", "question", "breakthrough"] as const;
export const MEDIA_TYPES = ["photo", "video", "file"] as const;
export const SCAR_FAILURE_TYPES = [
  "misunderstood",
  "wrong_tool",
  "impatience",
  "overconfidence",
  "environmental",
  "conceptual",
  "execution",
  "unknown",
] as const;
export const SCAR_SEVERITIES = ["minor", "delay", "restart", "injury"] as const;
export const SKILL_STATUSES = ["exposed", "attempted", "practiced", "owned"] as const;
export const LOCKER_ITEM_TYPES = ["book", "video", "article", "course"] as const;
