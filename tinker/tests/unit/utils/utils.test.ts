import { describe, expect, it } from "vitest";
import { itemInsertSchema, shopInsertSchema } from "@/utils/validators";
import { screenToWorld, worldToScreen, zoomToward } from "@/utils/canvasMath";
import { generateId } from "@/utils/id";
import { encodeStructuredItemContent } from "@/utils/itemContent";
import { getNextReviewDate, getSkillReviewCountdown } from "@/utils/skillLifecycle";
import {
  getLatestScheduledReviewDate,
  getNextScheduledReviewDate,
  isWeeklyReviewDue,
  parseWeeklyReviewMeta,
} from "@/utils/review";
import { defaultPreferences, parsePreferences } from "@/utils/preferences";
import { skillFactory } from "../../helpers/factories";

describe("utility functions", () => {
  it("validates shops and references with why-this-matters", () => {
    expect(() =>
      shopInsertSchema.parse({
        id: "shop-1",
        name: "Wood Shop",
        backgroundTexture: "pegboard",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ).not.toThrow();

    expect(() =>
      itemInsertSchema.parse({
        id: "item-1",
        workbenchId: "workbench-1",
        type: "reference",
        content: encodeStructuredItemContent({
          version: 1,
          content: "Router setup note",
          whyThisMatters: "This explains why the fence setup keeps drifting on me.",
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ).not.toThrow();

    expect(() =>
      itemInsertSchema.parse({
        id: "item-2",
        workbenchId: "workbench-1",
        type: "reference",
        content: encodeStructuredItemContent({
          version: 1,
          content: "Router setup note",
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    ).toThrow(/why this matters/i);
  });

  it("maps coordinates and zooms toward a point", () => {
    const camera = { x: 100, y: 50, scale: 2 };
    const world = screenToWorld({ x: 140, y: 90 }, camera);
    expect(world).toEqual({ x: 20, y: 20 });
    expect(worldToScreen(world, camera)).toEqual({ x: 140, y: 90 });

    const zoomed = zoomToward(camera, 1.5, { x: 140, y: 90 });
    expect(zoomed.scale).toBe(3);
    expect(screenToWorld({ x: 140, y: 90 }, zoomed)).toEqual(world);
  });

  it("generates unique ids", () => {
    const first = generateId();
    const second = generateId();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThan(5);
  });

  it("calculates review countdowns and schedules", () => {
    const nextReview = getNextReviewDate(new Date("2026-04-25T12:00:00.000Z"));
    expect(nextReview.toISOString()).toBe("2026-05-25T12:00:00.000Z");

    const countdown = getSkillReviewCountdown(
      skillFactory({
        status: "practiced",
        reviewDueAt: new Date("2026-04-25T00:00:00.000Z"),
      }),
      new Date("2026-04-25T12:00:00.000Z")
    );
    expect(countdown?.isDue).toBe(true);

    const latest = getLatestScheduledReviewDate("saturday", new Date("2026-04-25T12:00:00.000Z"));
    expect(latest.getDay()).toBe(6);
    expect(getNextScheduledReviewDate("saturday", new Date("2026-04-25T12:00:00.000Z")).getDate()).toBe(2);
    expect(isWeeklyReviewDue("saturday", null, new Date("2026-04-25T12:00:00.000Z"))).toBe(true);
    expect(parseWeeklyReviewMeta("{\"lastCompletedAt\":\"2026-04-18T00:00:00.000Z\"}").lastCompletedAt).toContain("2026-04-18");
  });

  it("parses preferences with bounds and defaults", () => {
    expect(parsePreferences(null)).toEqual(defaultPreferences);
    expect(
      parsePreferences(
        JSON.stringify({
          behavior: {
            lockerStaleDays: 200,
            dustThresholdDays: -10,
          },
        })
      )
    ).toMatchObject({
      behavior: {
        lockerStaleDays: 60,
        dustThresholdDays: 1,
      },
    });
  });
});
