import { nanoid } from "nanoid";
import { useMutation } from "@tanstack/react-query";
import { useAppSetting, useUpsertAppSetting } from "./useAppSettings";
import { parsePreferences } from "../utils/preferences";
import {
  getLatestScheduledReviewDate,
  getNextScheduledReviewDate,
  isWeeklyReviewDue,
  parseWeeklyReviewMeta,
} from "../utils/review";

export function useWeeklyReviewMeta() {
  const { data: reviewSetting } = useAppSetting("review.meta");
  const { data: preferencesSetting } = useAppSetting("preferences");
  const preferences = parsePreferences(preferencesSetting?.value);
  const meta = parseWeeklyReviewMeta(reviewSetting?.value);
  const due = isWeeklyReviewDue(preferences.behavior.reviewDayOfWeek, meta.lastCompletedAt);

  return {
    reviewSetting,
    preferences,
    meta,
    due,
    latestScheduledDate: getLatestScheduledReviewDate(preferences.behavior.reviewDayOfWeek),
    nextScheduledDate: getNextScheduledReviewDate(preferences.behavior.reviewDayOfWeek),
  };
}

export function useCompleteWeeklyReview() {
  const upsertAppSetting = useUpsertAppSetting();
  const { reviewSetting } = useWeeklyReviewMeta();

  return useMutation({
    mutationFn: async () => {
      const now = new Date();
      return upsertAppSetting.mutateAsync({
        id: reviewSetting?.id ?? nanoid(),
        key: "review.meta",
        value: JSON.stringify({ lastCompletedAt: now.toISOString() }),
        createdAt: reviewSetting?.createdAt ?? now,
        updatedAt: now,
      });
    },
  });
}
