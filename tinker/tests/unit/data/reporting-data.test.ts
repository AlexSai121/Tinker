import { beforeEach, describe, expect, it } from "vitest";
import { replaceBrowserStoreSnapshot } from "@/lib/browserStore";
import { buildScarSharePayload, getScarMapData } from "@/data/scarMap";
import {
  getBridgeActivityDate,
  getBridgeAgeInDays,
  getBridgeFreshness,
  getBridgeFreshnessColor,
  getEffectiveBridgeStrength,
  isBridgeDecaying,
  reinforceBridge,
} from "@/data/bridges";
import { createSkill, saveSkillEvidence } from "@/data/skills";
import { createLockerItem, getAllLockerItems, getLockerItemById, rescueLockerItem, restoreLockerItem } from "@/data/locker";
import {
  bridgeFactory,
  itemFactory,
  lockerItemFactory,
  scarFactory,
  shopFactory,
  skillFactory,
  workbenchFactory,
} from "../../helpers/factories";

describe("reporting and rules data", () => {
  beforeEach(() => {
    replaceBrowserStoreSnapshot({});
  });

  describe("scar map", () => {
    it("aggregates timeline, distribution, heatmap, trend, and summary data", async () => {
      replaceBrowserStoreSnapshot({
        shops: [shopFactory({ id: "shop-1" })],
        workbenches: [
          workbenchFactory({ id: "wb-1", shopId: "shop-1", name: "Alpha Bench" }),
          workbenchFactory({ id: "wb-2", shopId: "shop-1", name: "Beta Bench" }),
        ],
        items: [
          itemFactory({
            id: "attempt-1",
            workbenchId: "wb-1",
            type: "attempt",
            content: "First attempt",
            createdAt: new Date("2026-04-01T12:00:00.000Z"),
          }),
          itemFactory({
            id: "attempt-2",
            workbenchId: "wb-1",
            type: "attempt",
            content: "Second attempt",
            createdAt: new Date("2026-04-08T12:00:00.000Z"),
          }),
          itemFactory({
            id: "attempt-3",
            workbenchId: "wb-2",
            type: "attempt",
            content: "Third attempt",
            createdAt: new Date("2026-04-08T13:00:00.000Z"),
          }),
          itemFactory({
            id: "obs-1",
            workbenchId: "wb-2",
            type: "observation",
            content: "Support item",
            createdAt: new Date("2026-04-02T12:00:00.000Z"),
          }),
        ],
        scars: [
          scarFactory({
            id: "scar-1",
            itemId: "attempt-1",
            failureType: "execution",
            createdAt: new Date("2026-04-01T18:00:00.000Z"),
          }),
          scarFactory({
            id: "scar-2",
            itemId: "attempt-2",
            failureType: "wrong_tool",
            createdAt: new Date("2026-04-08T18:00:00.000Z"),
          }),
          scarFactory({
            id: "scar-3",
            itemId: "attempt-3",
            failureType: "execution",
            createdAt: new Date("2026-04-08T19:00:00.000Z"),
          }),
        ],
      });

      const data = await getScarMapData();

      expect(data.rows).toHaveLength(3);
      expect(data.timeline).toEqual([
        { period: "2026-04-01", count: 1 },
        { period: "2026-04-08", count: 2 },
      ]);
      expect(data.distribution).toEqual([
        { failureType: "execution", count: 2 },
        { failureType: "wrong_tool", count: 1 },
      ]);
      expect(data.heatmap).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ workbenchId: "wb-1", total: 2 }),
          expect.objectContaining({ workbenchId: "wb-2", total: 1 }),
        ])
      );
      expect(data.trend).toEqual([
        { period: "2026-03-30", attempts: 1, scars: 1 },
        { period: "2026-04-06", attempts: 2, scars: 2 },
      ]);
      expect(data.workbenches).toEqual(
        expect.arrayContaining([
          { id: "wb-1", name: "Alpha Bench" },
          { id: "wb-2", name: "Beta Bench" },
        ])
      );
      expect(data.summary).toEqual({
        totalScars: 3,
        totalAttempts: 3,
        failureRate: 1,
      });
    });

    it("filters scar map data and builds anonymized share payloads", async () => {
      replaceBrowserStoreSnapshot({
        shops: [shopFactory({ id: "shop-1" })],
        workbenches: [
          workbenchFactory({ id: "wb-1", shopId: "shop-1", name: "Alpha Bench" }),
          workbenchFactory({ id: "wb-2", shopId: "shop-1", name: "Beta Bench" }),
        ],
        items: [
          itemFactory({
            id: "attempt-1",
            workbenchId: "wb-1",
            type: "attempt",
            content: "Alpha attempt",
            createdAt: new Date("2026-04-01T12:00:00.000Z"),
          }),
          itemFactory({
            id: "attempt-2",
            workbenchId: "wb-2",
            type: "attempt",
            content: "Beta attempt",
            createdAt: new Date("2026-04-11T12:00:00.000Z"),
          }),
        ],
        scars: [
          scarFactory({
            id: "scar-1",
            itemId: "attempt-1",
            failureType: "execution",
            notes: "Alpha failure",
            createdAt: new Date("2026-04-02T12:00:00.000Z"),
          }),
          scarFactory({
            id: "scar-2",
            itemId: "attempt-2",
            failureType: "wrong_tool",
            notes: "Beta failure",
            createdAt: new Date("2026-04-12T12:00:00.000Z"),
          }),
        ],
      });

      const filtered = await getScarMapData({
        workbenchId: "wb-2",
        failureType: "wrong_tool",
        from: new Date("2026-04-10T00:00:00.000Z"),
        to: new Date("2026-04-20T00:00:00.000Z"),
      });
      expect(filtered.rows).toHaveLength(1);
      expect(filtered.summary).toEqual({
        totalScars: 1,
        totalAttempts: 1,
        failureRate: 1,
      });

      const share = await buildScarSharePayload({
        workbenchId: "wb-2",
        failureType: "wrong_tool",
      });
      expect(share.filters.workbenchId).toBe("wb-2");
      expect(share.filters.failureType).toBe("wrong_tool");
      expect(share.heatmap[0]?.projectAlias).toBe("project-1");
      expect(share.scars[0]).toEqual(
        expect.objectContaining({
          projectAlias: "project-1",
          failureType: "wrong_tool",
          notes: "Beta failure",
        })
      );
    });
  });

  describe("bridge helpers", () => {
    it("computes bridge age, freshness, decay, colors, and reinforcement caps", async () => {
      replaceBrowserStoreSnapshot({
        bridges: [
          bridgeFactory({
            id: "bridge-1",
            strength: 5,
            createdAt: new Date("2026-01-01T12:00:00.000Z"),
            lastReinforcedAt: new Date("2026-04-10T12:00:00.000Z"),
          }),
        ],
      });

      const bridge = bridgeFactory({
        strength: 1.2,
        createdAt: new Date("2026-04-20T12:00:00.000Z"),
        lastReinforcedAt: null,
      });
      const referenceDate = new Date("2026-04-25T12:00:00.000Z");

      expect(getBridgeActivityDate(bridge).toISOString()).toBe("2026-04-20T12:00:00.000Z");
      expect(getBridgeAgeInDays(bridge, referenceDate)).toBe(5);
      expect(getBridgeFreshness(bridge, referenceDate)).toBe("fresh");
      expect(getBridgeFreshness(bridgeFactory({
        createdAt: new Date("2026-02-15T12:00:00.000Z"),
        lastReinforcedAt: null,
      }), referenceDate)).toBe("established");
      expect(getBridgeFreshnessColor("fresh")).toBe("#CC785C");
      expect(getBridgeFreshnessColor("established")).toBe("#A09D96");
      expect(getBridgeFreshnessColor("dormant")).toBe("#6C6A64");
      expect(isBridgeDecaying(bridge, referenceDate)).toBe(false);
      expect(getEffectiveBridgeStrength(bridgeFactory({
        strength: 1,
        createdAt: new Date("2025-01-01T12:00:00.000Z"),
      }), referenceDate)).toBe(0.75);

      const reinforced = await reinforceBridge("bridge-1");
      expect(reinforced.strength).toBe(5);
    });
  });

  describe("skill evidence rules", () => {
    it("enforces note, evidence, timing, and project requirements across transitions", async () => {
      await createSkill(skillFactory({ id: "skill-a", status: "exposed" }));
      await expect(
        saveSkillEvidence({
          id: "skill-a",
          status: "attempted",
          evidence: "too short",
          evidenceMediaPath: null,
          evidenceWorkbenchId: "workbench-1",
        })
      ).rejects.toThrow(/what you tried/i);

      await createSkill(skillFactory({ id: "skill-b", status: "attempted", evidenceWorkbenchId: "workbench-1" }));
      await expect(
        saveSkillEvidence({
          id: "skill-b",
          status: "practiced",
          evidence: "A valid note but no upload yet.",
          evidenceMediaPath: null,
          evidenceWorkbenchId: "workbench-1",
        })
      ).rejects.toThrow(/evidence upload/i);

      await createSkill(
        skillFactory({
          id: "skill-c",
          status: "practiced",
          evidence: "Initial proof",
          evidenceMediaPath: "/tmp/first.png",
          evidenceWorkbenchId: "workbench-1",
          reviewDueAt: new Date("2026-05-20T12:00:00.000Z"),
        })
      );
      await expect(
        saveSkillEvidence({
          id: "skill-c",
          status: "owned",
          evidence: "Fresh proof on another project.",
          evidenceMediaPath: "/tmp/second.png",
          evidenceWorkbenchId: "workbench-2",
        })
      ).rejects.toThrow(/not ready/i);

      await createSkill(
        skillFactory({
          id: "skill-d",
          status: "practiced",
          evidence: "Initial proof",
          evidenceMediaPath: "/tmp/first.png",
          evidenceWorkbenchId: "workbench-1",
          reviewDueAt: new Date("2026-04-01T12:00:00.000Z"),
        })
      );
      await expect(
        saveSkillEvidence({
          id: "skill-d",
          status: "owned",
          evidence: "Fresh proof on the same project.",
          evidenceMediaPath: "/tmp/second.png",
          evidenceWorkbenchId: "workbench-1",
        })
      ).rejects.toThrow(/different project/i);

      const owned = await saveSkillEvidence({
        id: "skill-d",
        status: "owned",
        evidence: "Fresh proof from a different project with the full workflow intact.",
        evidenceMediaPath: "/tmp/second.png",
        evidenceWorkbenchId: "workbench-2",
      });
      expect(owned.status).toBe("owned");
      expect(owned.reviewDueAt).toBeNull();
      expect(owned.evidenceWorkbenchId).toBe("workbench-2");
    });
  });

  describe("locker lifecycle edge cases", () => {
    it("auto-archives stale items, restores with a minimum of one day, and validates rescue paths", async () => {
      await createLockerItem(
        lockerItemFactory({
          id: "locker-stale",
          staleDate: new Date("2026-04-01T12:00:00.000Z"),
          isArchived: false,
        })
      );

      const stale = await getLockerItemById("locker-stale");
      expect(stale?.isArchived).toBe(true);
      expect(stale?.archivedAt).not.toBeNull();

      const restored = await restoreLockerItem("locker-stale", -5);
      expect(restored.isArchived).toBe(false);
      expect(new Date(restored.staleDate).getTime()).toBeGreaterThan(new Date().getTime());

      const allLockerItems = await getAllLockerItems();
      expect(allLockerItems[0]?.id).toBe("locker-stale");

      await expect(
        rescueLockerItem({
          lockerItemId: "missing-locker",
          workbenchId: "workbench-1",
          whyThisMatters: "A valid rescue note for a missing locker item.",
        })
      ).rejects.toThrow(/not found/i);

      await createLockerItem(lockerItemFactory({ id: "locker-short", whyThisMatters: null }));
      await expect(
        rescueLockerItem({
          lockerItemId: "locker-short",
          workbenchId: "workbench-1",
          whyThisMatters: "short",
        })
      ).rejects.toThrow(/at least 10 characters/i);
    });
  });
});
