import { addDays, differenceInCalendarDays, formatDistanceToNowStrict } from "date-fns";
import type { Skill } from "../types";

export const THIRTY_DAY_REVIEW_WINDOW = 30;

export function getNextReviewDate(referenceDate: Date = new Date()) {
  return addDays(referenceDate, THIRTY_DAY_REVIEW_WINDOW);
}

export function getSkillReviewCountdown(skill: Skill, now: Date = new Date()) {
  if (!skill.reviewDueAt || skill.status !== "practiced") {
    return null;
  }

  const dueDate = new Date(skill.reviewDueAt);
  const daysRemaining = differenceInCalendarDays(dueDate, now);

  if (daysRemaining < 0) {
    return {
      isDue: true,
      daysRemaining,
      label: `Review overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? "" : "s"}`,
      shortLabel: "Overdue",
    };
  }

  if (daysRemaining === 0) {
    return {
      isDue: true,
      daysRemaining,
      label: "Review due today",
      shortLabel: "Due today",
    };
  }

  return {
    isDue: false,
    daysRemaining,
    label: `Review due in ${formatDistanceToNowStrict(dueDate)}`,
    shortLabel: `${daysRemaining}d left`,
  };
}
