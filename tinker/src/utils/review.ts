import { REVIEW_DAY_OPTIONS } from "./preferences";

export interface WeeklyReviewMeta {
  lastCompletedAt: string | null;
}

export const defaultWeeklyReviewMeta: WeeklyReviewMeta = {
  lastCompletedAt: null,
};

export function parseWeeklyReviewMeta(raw?: string | null): WeeklyReviewMeta {
  if (!raw) {
    return defaultWeeklyReviewMeta;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WeeklyReviewMeta>;
    return {
      lastCompletedAt: parsed.lastCompletedAt ?? null,
    };
  } catch {
    return defaultWeeklyReviewMeta;
  }
}

export function getReviewDayIndex(day: (typeof REVIEW_DAY_OPTIONS)[number]): number {
  return REVIEW_DAY_OPTIONS.indexOf(day);
}

export function getLatestScheduledReviewDate(
  reviewDay: (typeof REVIEW_DAY_OPTIONS)[number],
  referenceDate: Date = new Date()
): Date {
  const scheduledDate = new Date(referenceDate);
  const diff = (scheduledDate.getDay() - getReviewDayIndex(reviewDay) + 7) % 7;
  scheduledDate.setHours(0, 0, 0, 0);
  scheduledDate.setDate(scheduledDate.getDate() - diff);
  return scheduledDate;
}

export function getNextScheduledReviewDate(
  reviewDay: (typeof REVIEW_DAY_OPTIONS)[number],
  referenceDate: Date = new Date()
): Date {
  const latest = getLatestScheduledReviewDate(reviewDay, referenceDate);
  if (latest > referenceDate) {
    return latest;
  }

  const next = new Date(latest);
  next.setDate(next.getDate() + 7);
  return next;
}

export function isWeeklyReviewDue(
  reviewDay: (typeof REVIEW_DAY_OPTIONS)[number],
  lastCompletedAt?: string | null,
  referenceDate: Date = new Date()
): boolean {
  const latestScheduledDate = getLatestScheduledReviewDate(reviewDay, referenceDate);
  const completedAt = lastCompletedAt ? new Date(lastCompletedAt) : null;
  return !completedAt || completedAt < latestScheduledDate;
}
