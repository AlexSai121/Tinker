import { z } from "zod";
import {
  SHOP_BACKGROUNDS,
  ITEM_TYPES,
  MEDIA_TYPES,
  SCAR_FAILURE_TYPES,
  SCAR_SEVERITIES,
  SKILL_STATUSES,
  LOCKER_ITEM_TYPES,
} from "./constants";
import { decodeStructuredItemContent } from "./itemContent";

// Helper for dates
const dateSchema = z.union([z.date(), z.string(), z.number()]).transform((val) => new Date(val));

// --- Shops ---
export const shopInsertSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  backgroundTexture: z.enum(SHOP_BACKGROUNDS).optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export const shopUpdateSchema = shopInsertSchema.omit({ id: true, createdAt: true }).partial();

// --- Workbenches ---
export const workbenchInsertSchema = z.object({
  id: z.string().min(1),
  shopId: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  posX: z.number().optional(),
  posY: z.number().optional(),
  posZ: z.number().optional(),
  description: z.string().nullable().optional(),
  templateQuestions: z.string().nullable().optional(),
  width: z.number().min(100).optional(),
  height: z.number().min(100).optional(),
  lastOpenedAt: dateSchema.nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export const workbenchUpdateSchema = workbenchInsertSchema.omit({ id: true, createdAt: true }).partial();

// --- Items ---
const itemBaseSchema = z.object({
  id: z.string().min(1),
  workbenchId: z.string().min(1),
  type: z.enum(ITEM_TYPES),
  content: z.string(),
  posX: z.number().optional(),
  posY: z.number().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

export const itemInsertSchema = itemBaseSchema.superRefine((item, ctx) => {
    if (item.type !== "sticky" && item.content.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["content"],
        message: "Content cannot be empty",
      });
    }

    const structured = decodeStructuredItemContent({ content: item.content });

    if (item.type === "reference") {
      if (!structured?.whyThisMatters || structured.whyThisMatters.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["content"],
          message: "Reference items need a Why This Matters note of at least 10 characters.",
        });
      }
    }

    if (item.type === "attempt") {
      if (!structured?.attemptWhat?.trim() || !structured.attemptResult?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["content"],
          message: "Attempt items need both what you tried and the result.",
        });
      }
    }
  });
export const itemUpdateSchema = itemBaseSchema.omit({ id: true, createdAt: true }).partial();

// --- Item Media ---
export const itemMediaInsertSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
  type: z.enum(MEDIA_TYPES),
  path: z.string().min(1, "Path cannot be empty"),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export const itemMediaUpdateSchema = itemMediaInsertSchema.omit({ id: true, createdAt: true }).partial();

// --- Scars ---
export const scarInsertSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
  failureType: z.enum(SCAR_FAILURE_TYPES),
  severity: z.enum(SCAR_SEVERITIES),
  costTime: z.string().nullable().optional(),
  costMaterials: z.string().nullable().optional(),
  costMoney: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export const scarUpdateSchema = scarInsertSchema.omit({ id: true, createdAt: true }).partial();

// --- Skills ---
export const skillInsertSchema = z.object({
  id: z.string().min(1),
  workbenchId: z.string().min(1).nullable().optional(),
  name: z.string().min(1, "Name cannot be empty"),
  status: z.enum(SKILL_STATUSES),
  evidence: z.string().nullable().optional(),
  evidenceMediaPath: z.string().nullable().optional(),
  evidenceWorkbenchId: z.string().nullable().optional(),
  lastEvidenceAt: dateSchema.nullable().optional(),
  reviewDueAt: dateSchema.nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export const skillUpdateSchema = skillInsertSchema.omit({ id: true, createdAt: true }).partial();

// --- Bridges ---
export const bridgeInsertSchema = z.object({
  id: z.string().min(1),
  sourceItemId: z.string().min(1),
  targetItemId: z.string().min(1),
  note: z.string().min(50, "Bridge note must be at least 50 characters"),
  strength: z.number().min(1).max(5).optional(),
  lastReinforcedAt: dateSchema.nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export const bridgeUpdateSchema = bridgeInsertSchema.omit({ id: true, createdAt: true }).partial();

// --- Skill Bridges ---
export const skillBridgeInsertSchema = z.object({
  id: z.string().min(1),
  skillId: z.string().min(1),
  itemId: z.string().min(1),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export const skillBridgeUpdateSchema = skillBridgeInsertSchema.omit({ id: true, createdAt: true }).partial();

// --- Locker Items ---
export const lockerItemInsertSchema = z.object({
  id: z.string().min(1),
  type: z.enum(LOCKER_ITEM_TYPES),
  title: z.string().min(1, "Title is required"),
  url: z.string().nullable().optional(),
  whyThisMatters: z.string().nullable().optional(),
  staleDate: dateSchema,
  isArchived: z.boolean().optional(),
  archivedAt: dateSchema.nullable().optional(),
  rescuedItemId: z.string().nullable().optional(),
  rescuedWorkbenchId: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export const lockerItemUpdateSchema = lockerItemInsertSchema.omit({ id: true, createdAt: true }).partial();

// --- Camera States ---
export const cameraStateInsertSchema = z.object({
  id: z.string().min(1),
  workbenchId: z.string().min(1),
  posX: z.number().optional(),
  posY: z.number().optional(),
  zoom: z.number().min(0.01).optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export const cameraStateUpdateSchema = cameraStateInsertSchema.omit({ id: true, createdAt: true }).partial();

// --- App Settings ---
export const appSettingInsertSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  value: z.string(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export const appSettingUpdateSchema = appSettingInsertSchema.omit({ id: true, createdAt: true }).partial();
