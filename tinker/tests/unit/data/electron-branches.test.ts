import { afterEach, describe, expect, it, vi } from "vitest";
import {
  appSettingFactory,
  cameraStateFactory,
  itemFactory,
  mediaFactory,
  scarFactory,
  shopFactory,
  workbenchFactory,
} from "../../helpers/factories";

interface ElectronDbMockConfig {
  selectRows?: unknown[];
  joinRows?: unknown[];
  insertRows?: unknown[];
  updateRows?: unknown[];
  groupRows?: unknown[];
}

function createElectronDbMock(config: ElectronDbMockConfig = {}) {
  const selectRows = config.selectRows ?? [];
  const joinRows = config.joinRows ?? [];
  const insertRows = config.insertRows ?? [];
  const updateRows = config.updateRows ?? [];
  const groupRows = config.groupRows ?? [];

  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        orderBy: vi.fn(async () => selectRows),
        where: vi.fn(() => ({
          limit: vi.fn(async () => selectRows),
          orderBy: vi.fn(async () => selectRows),
        })),
        innerJoin: vi.fn(() => ({
          where: vi.fn(async () => joinRows),
        })),
        groupBy: vi.fn(async () => groupRows),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(async () => insertRows),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => updateRows),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(async () => undefined),
    })),
  };
}

async function loadElectronModule<T>(path: string, dbMock: ReturnType<typeof createElectronDbMock>) {
  vi.resetModules();
  vi.doMock("@/lib/runtime", () => ({ isElectronRuntime: true }));
  vi.doMock("@/db", () => ({ db: dbMock }));
  return (await import(path)) as T;
}

describe("electron DAO branches", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("@/lib/runtime");
    vi.doUnmock("@/db");
    vi.restoreAllMocks();
  });

  it("covers shops, items, workbenches, scars, and item media electron paths", async () => {
    const shop = shopFactory({ id: "shop-electron" });
    const item = itemFactory({ id: "item-electron", content: "Electron item" });
    const workbench = workbenchFactory({ id: "workbench-electron", name: "Electron bench" });
    const scar = scarFactory({ id: "scar-electron" });
    const media = mediaFactory({ id: "media-electron" });

    const shopsDb = createElectronDbMock({
      selectRows: [shop],
      insertRows: [shop],
      updateRows: [shopFactory({ id: "shop-electron", name: "Updated Electron Shop" })],
    });
    const shopsModule = await loadElectronModule<typeof import("@/data/shops")>("@/data/shops", shopsDb);
    expect(await shopsModule.getAllShops()).toEqual([shop]);
    expect(await shopsModule.getShopById(shop.id)).toEqual(shop);
    expect(await shopsModule.createShop(shop)).toEqual(shop);
    expect((await shopsModule.updateShop(shop.id, { name: "Updated Electron Shop" })).name).toContain("Updated");
    await expect(shopsModule.deleteShop(shop.id)).resolves.toBeUndefined();

    const itemsDb = createElectronDbMock({
      selectRows: [item],
      insertRows: [item],
      updateRows: [itemFactory({ id: "item-electron", content: "Updated electron item" })],
    });
    const itemsModule = await loadElectronModule<typeof import("@/data/items")>("@/data/items", itemsDb);
    expect(await itemsModule.getAllItems()).toEqual([item]);
    expect(await itemsModule.getItemById(item.id)).toEqual(item);
    expect(await itemsModule.getItemsByWorkbench(item.workbenchId)).toEqual([item]);
    expect(await itemsModule.getItemsByType(item.type)).toEqual([item]);
    expect(await itemsModule.searchItems("electron")).toEqual([item]);
    expect(await itemsModule.createItem(item)).toEqual(item);
    expect((await itemsModule.updateItem(item.id, { content: "Updated electron item" })).content).toContain("Updated");
    await expect(itemsModule.deleteItem(item.id)).resolves.toBeUndefined();

    const workbenchesDb = createElectronDbMock({
      selectRows: [workbench],
      insertRows: [workbench],
      updateRows: [workbenchFactory({ id: "workbench-electron", name: "Archived Electron Bench" })],
    });
    const workbenchesModule = await loadElectronModule<typeof import("@/data/workbenches")>(
      "@/data/workbenches",
      workbenchesDb
    );
    expect(await workbenchesModule.getAllWorkbenches()).toEqual([workbench]);
    expect(await workbenchesModule.getWorkbenchById(workbench.id)).toEqual(workbench);
    expect(await workbenchesModule.getWorkbenchesByShop(workbench.shopId)).toEqual([workbench]);
    expect(await workbenchesModule.createWorkbench(workbench)).toEqual(workbench);
    expect(await workbenchesModule.updateWorkbench(workbench.id, { name: "Archived Electron Bench" })).toEqual(
      expect.objectContaining({ name: "Archived Electron Bench" })
    );
    expect(await workbenchesModule.archiveWorkbench(workbench.id)).toEqual(
      expect.objectContaining({ name: "Archived Electron Bench" })
    );
    expect(await workbenchesModule.updateDust(workbench.id, new Date())).toEqual(
      expect.objectContaining({ name: "Archived Electron Bench" })
    );
    await expect(workbenchesModule.deleteWorkbench(workbench.id)).resolves.toBeUndefined();

    const scarsDb = createElectronDbMock({
      selectRows: [scar],
      insertRows: [scar],
      updateRows: [scarFactory({ id: "scar-electron", severity: "restart" })],
      groupRows: [{ failureType: "execution", count: 1 }],
    });
    const scarsModule = await loadElectronModule<typeof import("@/data/scars")>("@/data/scars", scarsDb);
    expect(await scarsModule.getAllScars()).toEqual([scar]);
    expect(await scarsModule.getScarById(scar.id)).toEqual(scar);
    expect(await scarsModule.getScarsByItem(scar.itemId)).toEqual([scar]);
    expect(await scarsModule.createScar(scar)).toEqual(scar);
    expect(await scarsModule.updateScar(scar.id, { severity: "restart" })).toEqual(
      expect.objectContaining({ severity: "restart" })
    );
    expect(await scarsModule.aggregateScarsByType()).toEqual([{ failureType: "execution", count: 1 }]);
    await expect(scarsModule.deleteScar(scar.id)).resolves.toBeUndefined();

    const mediaDb = createElectronDbMock({
      selectRows: [media],
      insertRows: [media],
    });
    const mediaModule = await loadElectronModule<typeof import("@/data/itemMedia")>("@/data/itemMedia", mediaDb);
    expect(await mediaModule.getMediaByItem(media.itemId)).toEqual([media]);
    expect(await mediaModule.createItemMedia(media)).toEqual(media);
    await expect(mediaModule.deleteItemMedia(media.id)).resolves.toBeUndefined();
  });

  it("covers app settings and camera electron branches", async () => {
    const setting = appSettingFactory({ id: "setting-electron", key: "preferences", value: "{\"theme\":\"dark\"}" });
    const updatedSetting = appSettingFactory({
      id: "setting-electron",
      key: "preferences",
      value: "{\"theme\":\"system\"}",
    });
    const camera = cameraStateFactory({ id: "camera-electron", workbenchId: "workbench-electron", zoom: 1.75 });

    const appSettingsInsertDb = createElectronDbMock({
      selectRows: [],
      insertRows: [setting],
    });
    const appSettingsInsertModule = await loadElectronModule<typeof import("@/data/appSettings")>(
      "@/data/appSettings",
      appSettingsInsertDb
    );
    expect(await appSettingsInsertModule.upsertAppSetting(setting)).toEqual(setting);

    const appSettingsUpdateDb = createElectronDbMock({
      selectRows: [setting],
      updateRows: [updatedSetting],
    });
    const appSettingsUpdateModule = await loadElectronModule<typeof import("@/data/appSettings")>(
      "@/data/appSettings",
      appSettingsUpdateDb
    );
    expect(await appSettingsUpdateModule.getAllAppSettings()).toEqual([setting]);
    expect(await appSettingsUpdateModule.getAppSettingByKey("preferences")).toEqual(setting);
    expect(await appSettingsUpdateModule.upsertAppSetting(updatedSetting)).toEqual(updatedSetting);
    expect(await appSettingsUpdateModule.updateAppSetting(setting.id, { value: updatedSetting.value })).toEqual(updatedSetting);

    const cameraInsertDb = createElectronDbMock({
      selectRows: [camera],
      joinRows: [{ cameraState: camera }],
      insertRows: [camera],
      updateRows: [cameraStateFactory({ id: "camera-electron", workbenchId: "workbench-electron", zoom: 2 })],
    });
    const cameraModule = await loadElectronModule<typeof import("@/data/camera")>("@/data/camera", cameraInsertDb);
    expect(await cameraModule.getCameraByWorkbench(camera.workbenchId)).toEqual(camera);
    expect(await cameraModule.getCamerasByShop("shop-electron")).toEqual([camera]);
    expect(await cameraModule.saveCameraState(camera)).toEqual(expect.objectContaining({ zoom: 2 }));
    await expect(cameraModule.deleteCameraState(camera.id)).resolves.toBeUndefined();
  });
});
