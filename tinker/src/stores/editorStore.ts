import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ItemInsert, SkillInsert } from "../types";

interface EditorState {
  draftItem: Partial<ItemInsert> | null;
  draftSkill: Partial<SkillInsert> | null;
  draftBridgeNote: string;

  setDraftItem: (draft: Partial<ItemInsert> | null) => void;
  setDraftSkill: (draft: Partial<SkillInsert> | null) => void;
  setDraftBridgeNote: (note: string) => void;
  resetDrafts: () => void;
  resetEditor: () => void;
}

const initialEditorState = {
  draftItem: null,
  draftSkill: null,
  draftBridgeNote: "",
};

export const useEditorStore = create<EditorState>()(
  devtools(
    (set) => ({
      ...initialEditorState,

      setDraftItem: (draft) => set({ draftItem: draft }),
      setDraftSkill: (draft) => set({ draftSkill: draft }),
      setDraftBridgeNote: (note) => set({ draftBridgeNote: note }),
      resetDrafts: () => set(initialEditorState),
      resetEditor: () => set(initialEditorState),
    }),
    { name: "editor-store" }
  )
);
