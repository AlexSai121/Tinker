import { beforeEach, describe, expect, it } from "vitest";
import { useCanvasStore } from "@/stores/canvasStore";
import { useEditorStore } from "@/stores/editorStore";
import { useUiStore } from "@/stores/uiStore";

describe("zustand stores", () => {
  beforeEach(() => {
    useUiStore.getState().resetUi();
    useCanvasStore.getState().resetCanvas();
    useEditorStore.getState().resetEditor();
  });

  it("manages navigation and modal stack in uiStore", () => {
    useUiStore.getState().setActiveShop("shop-1");
    expect(useUiStore.getState().activeShopId).toBe("shop-1");
    expect(useUiStore.getState().viewMode).toBe("workbench");

    useUiStore.getState().setActiveWorkbench("workbench-1");
    expect(useUiStore.getState().activeWorkbenchId).toBe("workbench-1");
    expect(useUiStore.getState().viewMode).toBe("project");

    useUiStore.getState().openModal({ type: "createShop" });
    useUiStore.getState().openModal({ type: "settings" });
    expect(useUiStore.getState().modalStack).toHaveLength(2);

    useUiStore.getState().closeModal();
    expect(useUiStore.getState().modalStack).toHaveLength(1);

    useUiStore.getState().setSidebarOpen(false);
    expect(useUiStore.getState().sidebarOpen).toBe(false);
  });

  it("pans and zooms in canvasStore", () => {
    useCanvasStore.getState().pan(25, -10);
    expect(useCanvasStore.getState().x).toBe(25);
    expect(useCanvasStore.getState().y).toBe(-10);

    useCanvasStore.getState().zoom(2, 100, 50);
    expect(useCanvasStore.getState().scale).toBe(2);

    useCanvasStore.getState().setDraggedWorkbench("workbench-1");
    useCanvasStore.getState().setDragging(true);
    expect(useCanvasStore.getState().draggedWorkbenchId).toBe("workbench-1");
    expect(useCanvasStore.getState().isDragging).toBe(true);
  });

  it("tracks and resets editor drafts", () => {
    useEditorStore.getState().setDraftItem({ content: "draft item" });
    useEditorStore.getState().setDraftSkill({ name: "draft skill" });
    useEditorStore.getState().setDraftBridgeNote("note");

    expect(useEditorStore.getState().draftItem?.content).toBe("draft item");
    expect(useEditorStore.getState().draftSkill?.name).toBe("draft skill");
    expect(useEditorStore.getState().draftBridgeNote).toBe("note");

    useEditorStore.getState().resetDrafts();
    expect(useEditorStore.getState().draftItem).toBeNull();
    expect(useEditorStore.getState().draftSkill).toBeNull();
    expect(useEditorStore.getState().draftBridgeNote).toBe("");
  });
});
