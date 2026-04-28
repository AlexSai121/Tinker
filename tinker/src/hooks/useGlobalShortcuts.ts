import { useEffect } from "react";
import { useUiStore } from "../stores/uiStore";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

export function useGlobalShortcuts() {
  const modalCount = useUiStore((s) => s.modalStack.length);
  const closeModal = useUiStore((s) => s.closeModal);
  const openModal = useUiStore((s) => s.openModal);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const activeShopId = useUiStore((s) => s.activeShopId);
  const setViewMode = useUiStore((s) => s.setViewMode);
  const viewMode = useUiStore((s) => s.viewMode);
  const searchQuery = useUiStore((s) => s.searchQuery);
  const setSearchQuery = useUiStore((s) => s.setSearchQuery);
  const selectedItemId = useUiStore((s) => s.selectedItemId);
  const selectItem = useUiStore((s) => s.selectItem);

  useEffect(() => {
    const focusSearchInput = () => {
      const searchInput = document.getElementById("global-search-input");
      if (searchInput instanceof HTMLInputElement) {
        searchInput.focus();
        searchInput.select();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const editable = isEditableTarget(event.target);

      if (event.key === "Escape") {
        if (modalCount > 0) {
          event.preventDefault();
          closeModal();
          return;
        }

        if (searchQuery.trim().length > 0) {
          event.preventDefault();
          setSearchQuery("");
          return;
        }

        if (viewMode === "project" && selectedItemId) {
          event.preventDefault();
          selectItem(null);
          return;
        }

        if (viewMode === "project") {
          event.preventDefault();
          setViewMode("workbench");
        }
        return;
      }

      if (!(event.metaKey || event.ctrlKey)) {
        if (event.key === "/" && !editable) {
          event.preventDefault();
          focusSearchInput();
        }

        if (event.key === "N" && event.shiftKey && !editable) {
          event.preventDefault();
          if (activeShopId) {
            openModal({ type: "createProject", payload: { shopId: activeShopId } });
          } else {
            openModal({ type: "createShop" });
          }
        }

        return;
      }

      if (event.key === ",") {
        event.preventDefault();
        openModal({ type: "settings" });
        return;
      }

      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        focusSearchInput();
        return;
      }

      if (event.key.toLowerCase() === "b" && !editable) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeShopId, closeModal, modalCount, openModal, searchQuery, selectItem, selectedItemId, setSearchQuery, setViewMode, toggleSidebar, viewMode]);
}
