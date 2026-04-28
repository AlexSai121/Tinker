import { describe, expect, it, beforeEach } from "vitest";
import { getBrowserStoreSnapshot, replaceBrowserStoreSnapshot } from "@/lib/browserStore";
import { getAllShops, getShopById, createShop, updateShop, deleteShop } from "@/data/shops";
import {
  archiveWorkbench,
  calculateDustLevel,
  createWorkbench,
  deleteWorkbench,
  getAllWorkbenches,
  getWorkbenchById,
  getWorkbenchesByShop,
  updateDust,
  updateWorkbench,
} from "@/data/workbenches";
import {
  createItem,
  deleteItem,
  getAllItems,
  getItemById,
  getItemsByType,
  getItemsByWorkbench,
  searchItems,
  updateItem,
} from "@/data/items";
import { createItemMedia, deleteItemMedia, getMediaByItem } from "@/data/itemMedia";
import {
  aggregateScarsByType,
  createScar,
  deleteScar,
  getAllScars,
  getScarById,
  getScarsByItem,
  updateScar,
} from "@/data/scars";
import { getAllAppSettings, getAppSettingByKey, updateAppSetting, upsertAppSetting } from "@/data/appSettings";
import { deleteCameraState, getCameraByWorkbench, getCamerasByShop, saveCameraState } from "@/data/camera";
import {
  appSettingFactory,
  cameraStateFactory,
  itemFactory,
  mediaFactory,
  scarFactory,
  shopFactory,
  workbenchFactory,
} from "../../helpers/factories";

describe("core data layer", () => {
  beforeEach(() => {
    replaceBrowserStoreSnapshot({});
  });

  describe("shops", () => {
    it("creates, reads, updates, and deletes a shop", async () => {
      const created = await createShop(shopFactory());
      expect(created.name).toBe("Test Shop");

      const fetched = await getShopById(created.id);
      expect(fetched?.backgroundTexture).toBe("pegboard");

      const updated = await updateShop(created.id, { name: "Metal Shop" });
      expect(updated.name).toBe("Metal Shop");

      expect(await getAllShops()).toHaveLength(1);

      await deleteShop(created.id);
      expect(await getShopById(created.id)).toBeUndefined();
    });

    it("deletes nested browser-preview records when a shop is removed", async () => {
      replaceBrowserStoreSnapshot({
        shops: [shopFactory({ id: "shop-deep" })],
        workbenches: [workbenchFactory({ id: "bench-deep", shopId: "shop-deep" })],
        items: [itemFactory({ id: "item-deep", workbenchId: "bench-deep" })],
        itemMedia: [mediaFactory({ id: "media-deep", itemId: "item-deep" })],
        scars: [scarFactory({ id: "scar-deep", itemId: "item-deep" })],
      });

      await deleteShop("shop-deep");

      const snapshot = getBrowserStoreSnapshot();
      expect(snapshot.workbenches).toHaveLength(0);
      expect(snapshot.items).toHaveLength(0);
      expect(snapshot.itemMedia).toHaveLength(0);
      expect(snapshot.scars).toHaveLength(0);
    });
  });

  describe("workbenches", () => {
    it("creates, filters, updates, archives, and dusts workbenches", async () => {
      await createWorkbench(workbenchFactory({ id: "workbench-1", shopId: "shop-1", name: "Bench A" }));
      await createWorkbench(workbenchFactory({ id: "workbench-2", shopId: "shop-2", name: "Bench B" }));

      expect(await getAllWorkbenches()).toHaveLength(2);
      expect(await getWorkbenchesByShop("shop-1")).toHaveLength(1);

      const updated = await updateWorkbench("workbench-1", { name: "Bench A+" });
      expect(updated.name).toBe("Bench A+");

      const dusted = await updateDust("workbench-1", new Date("2026-04-30T12:00:00.000Z"));
      expect(dusted.lastOpenedAt?.toISOString()).toBe("2026-04-30T12:00:00.000Z");

      const archived = await archiveWorkbench("workbench-1");
      expect(archived.name).toContain("[ARCHIVED]");

      const dusty = calculateDustLevel(
        workbenchFactory({
          updatedAt: new Date("2026-03-01T12:00:00.000Z"),
          createdAt: new Date("2026-03-01T12:00:00.000Z"),
          lastOpenedAt: new Date("2026-03-01T12:00:00.000Z"),
        }),
        new Date("2026-04-25T12:00:00.000Z"),
        30
      );
      expect(dusty).toBeGreaterThan(0.9);

      await deleteWorkbench("workbench-2");
      expect(await getWorkbenchById("workbench-2")).toBeUndefined();
    });

    it("removes bench-linked browser-preview records when a project is deleted", async () => {
      replaceBrowserStoreSnapshot({
        workbenches: [workbenchFactory({ id: "bench-cleanup", shopId: "shop-1" })],
        items: [itemFactory({ id: "item-cleanup", workbenchId: "bench-cleanup" })],
        itemMedia: [mediaFactory({ id: "media-cleanup", itemId: "item-cleanup" })],
        scars: [scarFactory({ id: "scar-cleanup", itemId: "item-cleanup" })],
      });

      await deleteWorkbench("bench-cleanup");

      const snapshot = getBrowserStoreSnapshot();
      expect(snapshot.items).toHaveLength(0);
      expect(snapshot.itemMedia).toHaveLength(0);
      expect(snapshot.scars).toHaveLength(0);
    });
  });

  describe("items", () => {
    it("creates, filters, searches, updates, and deletes items", async () => {
      await createItem(itemFactory({ id: "item-1", type: "observation", content: "Saw a loose tenon" }));
      await createItem(itemFactory({ id: "item-2", type: "reference", content: "Router jig reference", workbenchId: "workbench-2" }));

      expect(await getAllItems()).toHaveLength(2);
      expect(await getItemsByWorkbench("workbench-1")).toHaveLength(1);
      expect(await getItemsByType("reference")).toHaveLength(1);
      expect(await searchItems("router")).toHaveLength(1);

      const updated = await updateItem("item-1", { content: "Saw a tighter loose tenon" });
      expect(updated.content).toContain("tighter");

      await deleteItem("item-2");
      expect(await getItemById("item-2")).toBeUndefined();
    });

    it("removes media and scars tied to a deleted browser-preview item", async () => {
      replaceBrowserStoreSnapshot({
        items: [itemFactory({ id: "item-linked" })],
        itemMedia: [mediaFactory({ id: "media-linked", itemId: "item-linked" })],
        scars: [scarFactory({ id: "scar-linked", itemId: "item-linked" })],
      });

      await deleteItem("item-linked");

      const snapshot = getBrowserStoreSnapshot();
      expect(snapshot.items).toHaveLength(0);
      expect(snapshot.itemMedia).toHaveLength(0);
      expect(snapshot.scars).toHaveLength(0);
    });
  });

  describe("item media", () => {
    it("creates, loads, and deletes media by item", async () => {
      await createItemMedia(mediaFactory({ id: "media-1", itemId: "item-1", path: "/tmp/one.png" }));
      await createItemMedia(mediaFactory({ id: "media-2", itemId: "item-1", path: "/tmp/two.png" }));

      const media = await getMediaByItem("item-1");
      expect(media).toHaveLength(2);

      await deleteItemMedia("media-1");
      expect(await getMediaByItem("item-1")).toHaveLength(1);
    });
  });

  describe("scars", () => {
    it("creates, reads, aggregates, updates, and deletes scars", async () => {
      await createScar(scarFactory({ id: "scar-1", failureType: "execution", itemId: "item-1" }));
      await createScar(scarFactory({ id: "scar-2", failureType: "execution", itemId: "item-1" }));
      await createScar(scarFactory({ id: "scar-3", failureType: "wrong_tool", itemId: "item-2" }));

      expect(await getAllScars()).toHaveLength(3);
      expect(await getScarsByItem("item-1")).toHaveLength(2);

      const scar = await getScarById("scar-1");
      expect(scar?.failureType).toBe("execution");

      const updated = await updateScar("scar-1", { severity: "restart" });
      expect(updated.severity).toBe("restart");

      const aggregates = await aggregateScarsByType();
      expect(aggregates).toEqual(
        expect.arrayContaining([
          { failureType: "execution", count: 2 },
          { failureType: "wrong_tool", count: 1 },
        ])
      );

      await deleteScar("scar-3");
      expect(await getScarById("scar-3")).toBeUndefined();
    });
  });

  describe("app settings", () => {
    it("upserts and updates app settings by key", async () => {
      const inserted = await upsertAppSetting(appSettingFactory({ id: "setting-1", key: "preferences", value: "{\"theme\":\"dark\"}" }));
      expect(inserted.key).toBe("preferences");

      const upserted = await upsertAppSetting(appSettingFactory({ id: "setting-2", key: "preferences", value: "{\"theme\":\"light\"}" }));
      expect(upserted.id).toBe("setting-1");
      expect(upserted.value).toContain("light");

      const updated = await updateAppSetting("setting-1", { value: "{\"theme\":\"system\"}" });
      expect(updated.value).toContain("system");

      expect(await getAppSettingByKey("preferences")).toBeDefined();
      expect(await getAllAppSettings()).toHaveLength(1);
    });

    it("recovers missing browser-store tables from older snapshots", async () => {
      window.localStorage.setItem(
        "tinker-browser-store",
        JSON.stringify({
          shops: [],
          workbenches: [],
          items: [],
        })
      );

      await expect(getAllAppSettings()).resolves.toEqual([]);

      const setting = await upsertAppSetting(
        appSettingFactory({ id: "setting-legacy", key: "onboarding.dismissed", value: "true" })
      );
      expect(setting.key).toBe("onboarding.dismissed");
      expect(await getAppSettingByKey("onboarding.dismissed")).toBeDefined();
    });
  });

  describe("browser store normalization", () => {
    it("fills missing workbench sizing and media type defaults", async () => {
      window.localStorage.setItem(
        "tinker-browser-store",
        JSON.stringify({
          workbenches: [
            {
              id: "bench-legacy",
              shopId: "shop-1",
              name: "Legacy Bench",
              posX: 12,
              posY: 24,
              createdAt: "2026-04-01T12:00:00.000Z",
              updatedAt: "2026-04-02T12:00:00.000Z",
            },
          ],
          itemMedia: [
            {
              id: "media-legacy",
              itemId: "item-1",
              path: "browser-media:%7B%22name%22%3A%22evidence.png%22%2C%22src%22%3A%22data%3Aimage%2Fpng%3Bbase64%2Cabc%22%7D",
              createdAt: "2026-04-01T12:00:00.000Z",
              updatedAt: "2026-04-02T12:00:00.000Z",
            },
          ],
        })
      );

      const workbenches = await getAllWorkbenches();
      expect(workbenches[0]?.width).toBe(1000);
      expect(workbenches[0]?.height).toBe(1000);

      const media = await getMediaByItem("item-1");
      expect(media[0]?.type).toBe("photo");
    });
  });

  describe("camera state", () => {
    it("saves one state per workbench and filters by shop", async () => {
      replaceBrowserStoreSnapshot({
        workbenches: [
          workbenchFactory({ id: "workbench-1", shopId: "shop-1" }),
          workbenchFactory({ id: "workbench-2", shopId: "shop-2" }),
        ],
      });

      await saveCameraState(cameraStateFactory({ id: "camera-1", workbenchId: "workbench-1", zoom: 1.5 }));
      await saveCameraState(cameraStateFactory({ id: "camera-2", workbenchId: "workbench-2", zoom: 0.8 }));
      await saveCameraState(cameraStateFactory({ id: "camera-3", workbenchId: "workbench-1", zoom: 2.1 }));

      const current = await getCameraByWorkbench("workbench-1");
      expect(current?.zoom).toBe(2.1);

      const shopCameras = await getCamerasByShop("shop-1");
      expect(shopCameras).toHaveLength(1);
      expect(shopCameras[0]?.workbenchId).toBe("workbench-1");

      await deleteCameraState("camera-2");
      expect(await getCameraByWorkbench("workbench-1")).toBeDefined();
    });
  });
});
