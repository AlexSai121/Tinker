import type { Item } from "../types";

export interface StructuredItemContent {
  version: 1;
  title?: string;
  content: string;
  sourceUrl?: string;
  whyThisMatters?: string;
  attemptWhat?: string;
  attemptResult?: string;
  attemptTools?: string[];
}

export function encodeStructuredItemContent(content: StructuredItemContent): string {
  return JSON.stringify(content);
}

export function decodeStructuredItemContent(item: Pick<Item, "content">): StructuredItemContent | null {
  try {
    const parsed = JSON.parse(item.content) as StructuredItemContent;
    if (parsed && typeof parsed === "object" && "content" in parsed) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
