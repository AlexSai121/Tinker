import { beforeEach, describe, expect, it } from "vitest";
import { replaceBrowserStoreSnapshot } from "@/lib/browserStore";
import {
  bridgeFactory,
  itemFactory,
  lockerItemFactory,
  mediaFactory,
  scarFactory,
  shopFactory,
  skillBridgeFactory,
  skillFactory,
  workbenchFactory,
} from "../../helpers/factories";
import {
  createSkill,
  deleteSkill,
  getAllSkills,
  getSkillById,
  getSkillsByWorkbench,
  getSkillsDueForReview,
  saveSkillEvidence,
  updateSkill,
  updateSkillStatus,
} from "@/data/skills";
import {
  createBridge,
  deleteBridge,
  getAllBridges,
  getBridgeById,
  getBridgeFreshness,
  getBridgesByItem,
  getDecayingBridges,
  getEffectiveBridgeStrength,
  reinforceBridge,
  updateBridge,
} from "@/data/bridges";
import {
  archiveLockerItem,
  createLockerItem,
  deleteLockerItem,
  getAllLockerItems,
  getLockerItemById,
  getStaleLockerItems,
  rescueLockerItem,
  restoreLockerItem,
  updateLockerItem,
} from "@/data/locker";
import { buildExportPayload, importExportPayload } from "@/data/export";

describe("advanced data layer", () => {
  beforeEach(() => {
    replaceBrowserStoreSnapshot({});
  });

  describe("skills", () => {
    it("creates, filters, transitions, and deletes skills", async () => {
      await createSkill(skillFactory({ id: "skill-1", status: "exposed" }));
      await createSkill(skillFactory({ id: "skill-2", workbenchId: "workbench-2", status: "practiced", reviewDueAt: new Date("2026-04-01T12:00:00.000Z") }));

      expect(await getAllSkills()).toHaveLength(2);
      expect(await getSkillsByWorkbench("workbench-1")).toHaveLength(1);
      expect(await getSkillsDueForReview()).toHaveLength(1);

      await saveSkillEvidence({
        id: "skill-1",
        status: "attempted",
        evidence: "Tried a first pass with a marking gauge.",
        evidenceMediaPath: null,
        evidenceWorkbenchId: "workbench-1",
      });

      const practiced = await saveSkillEvidence({
        id: "skill-1",
        status: "practiced",
        evidence: "Second pass held the line much better.",
        evidenceMediaPath: "/tmp/practice.png",
        evidenceWorkbenchId: "workbench-1",
      });
      expect(practiced.reviewDueAt).not.toBeNull();

      const updated = await updateSkill("skill-1", { name: "Cutting cleaner dovetails" });
      expect(updated.name).toContain("cleaner");

      const statusUpdated = await updateSkillStatus("skill-1", "practiced");
      expect(statusUpdated.status).toBe("practiced");

      await deleteSkill("skill-2");
      expect(await getSkillById("skill-2")).toBeUndefined();
    });

    it("rejects invalid skill transitions", async () => {
      await createSkill(skillFactory({ id: "skill-1", status: "attempted", evidenceWorkbenchId: "workbench-1" }));

      await expect(
        saveSkillEvidence({
          id: "skill-1",
          status: "owned",
          evidence: "This should fail",
          evidenceMediaPath: "/tmp/proof.png",
          evidenceWorkbenchId: "workbench-2",
        })
      ).rejects.toThrow(/one step at a time/i);
    });
  });

  describe("bridges", () => {
    it("creates, reinforces, updates, filters, and deletes bridges", async () => {
      const oldBridgeDate = new Date("2025-12-01T12:00:00.000Z");
      await createBridge(bridgeFactory({ id: "bridge-1", createdAt: oldBridgeDate, updatedAt: oldBridgeDate, lastReinforcedAt: null, strength: 2 }));
      await createBridge(bridgeFactory({ id: "bridge-2", sourceItemId: "item-2", targetItemId: "item-3", strength: 1 }));

      expect(await getAllBridges()).toHaveLength(2);
      expect(await getBridgesByItem("item-1")).toHaveLength(1);

      const bridge = await getBridgeById("bridge-1");
      expect(bridge).toBeDefined();
      expect(getBridgeFreshness(bridge!, new Date("2026-04-25T12:00:00.000Z"))).toBe("dormant");
      expect(getEffectiveBridgeStrength(bridge!, new Date("2026-04-25T12:00:00.000Z"))).toBeGreaterThanOrEqual(0.75);
      expect(await getDecayingBridges()).toEqual(expect.arrayContaining([expect.objectContaining({ id: "bridge-1" })]));

      const reinforced = await reinforceBridge("bridge-1");
      expect(reinforced.strength).toBeGreaterThan(2);

      const updated = await updateBridge("bridge-2", { note: "This bridge note is still easily past fifty characters after editing." });
      expect(updated.note).toContain("fifty");

      await deleteBridge("bridge-2");
      expect(await getBridgeById("bridge-2")).toBeUndefined();
    });
  });

  describe("locker", () => {
    it("creates, archives, restores, rescues, and deletes locker items", async () => {
      replaceBrowserStoreSnapshot({
        workbenches: [workbenchFactory({ id: "workbench-1", shopId: "shop-1" })],
      });

      await createLockerItem(lockerItemFactory({ id: "locker-1" }));
      await createLockerItem(lockerItemFactory({ id: "locker-2", staleDate: new Date("2026-04-20T12:00:00.000Z") }));

      expect(await getAllLockerItems()).toHaveLength(2);
      expect(await getStaleLockerItems(new Date("2026-04-25T12:00:00.000Z"))).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: "locker-2" })])
      );

      const archived = await archiveLockerItem("locker-1");
      expect(archived.isArchived).toBe(true);

      const restored = await restoreLockerItem("locker-1", 10);
      expect(restored.isArchived).toBe(false);

      const rescueResult = await rescueLockerItem({
        lockerItemId: "locker-1",
        workbenchId: "workbench-1",
        whyThisMatters: "This article explains the fix I want to test on the live project.",
      });
      expect(rescueResult.rescuedItem.type).toBe("reference");

      const updated = await updateLockerItem("locker-2", { title: "Updated locker title" });
      expect(updated.title).toContain("Updated");

      await deleteLockerItem("locker-2");
      expect(await getLockerItemById("locker-2")).toBeUndefined();
    });
  });

  describe("export and import", () => {
    it("exports full data and imports via merge and replace", async () => {
      replaceBrowserStoreSnapshot({
        shops: [shopFactory()],
        workbenches: [workbenchFactory()],
        items: [itemFactory(), itemFactory({ id: "item-2", content: "Second item" })],
        itemMedia: [mediaFactory()],
        scars: [scarFactory()],
        skills: [skillFactory()],
        bridges: [bridgeFactory()],
        skillBridges: [skillBridgeFactory()],
        lockerItems: [lockerItemFactory()],
        cameraStates: [],
        appSettings: [],
      });

      const payload = await buildExportPayload({ scope: "full" });
      expect(payload.summary.items).toBe(2);
      expect(payload.mediaManifest).toHaveLength(1);

      const replaceResult = await importExportPayload({
        mode: "replace",
        json: JSON.stringify(payload),
      });
      expect(replaceResult.counts.skills).toBe(1);

      const mergeResult = await importExportPayload({
        mode: "merge",
        json: JSON.stringify({
          ...payload,
          data: {
            ...payload.data,
            lockerItems: [lockerItemFactory({ id: "locker-2", title: "Merged locker item" })],
          },
        }),
      });
      expect(mergeResult.counts.lockerItems).toBe(2);
      expect(mergeResult.warnings.join(" ")).toMatch(/media path reference/i);
    });

    it("exports a shop-scoped payload", async () => {
      replaceBrowserStoreSnapshot({
        shops: [shopFactory({ id: "shop-1" }), shopFactory({ id: "shop-2", name: "Other Shop" })],
        workbenches: [
          workbenchFactory({ id: "workbench-1", shopId: "shop-1" }),
          workbenchFactory({ id: "workbench-2", shopId: "shop-2" }),
        ],
        items: [
          itemFactory({ id: "item-1", workbenchId: "workbench-1" }),
          itemFactory({ id: "item-2", workbenchId: "workbench-2" }),
        ],
        itemMedia: [mediaFactory({ id: "media-1", itemId: "item-1" })],
        scars: [scarFactory({ id: "scar-1", itemId: "item-1" })],
        skills: [skillFactory({ id: "skill-1", workbenchId: "workbench-1" })],
        bridges: [bridgeFactory({ id: "bridge-1", sourceItemId: "item-1", targetItemId: "item-2" })],
        skillBridges: [skillBridgeFactory({ id: "skill-bridge-1", itemId: "item-1", skillId: "skill-1" })],
        lockerItems: [lockerItemFactory()],
        cameraStates: [],
        appSettings: [],
      });

      const scoped = await buildExportPayload({ scope: "shop", shopId: "shop-1" });
      expect(scoped.data.shops).toHaveLength(1);
      expect(scoped.data.items).toHaveLength(1);
      expect(scoped.data.lockerItems).toHaveLength(0);
    });

    it("rejects invalid import payloads", async () => {
      await expect(
        importExportPayload({
          mode: "merge",
          json: JSON.stringify({ version: 1, data: { shops: [] } }),
        })
      ).rejects.toThrow();
    });
  });
});
