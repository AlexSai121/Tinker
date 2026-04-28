import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUiStore } from "../../stores/uiStore";
import { CreateShopModal } from "./CreateShopModal";
import { CreateWorkbenchModal } from "./CreateWorkbenchModal";
import { CreateProjectModal } from "./CreateProjectModal";
import { CreateBridgeModal } from "./CreateBridgeModal";
import { CreateLockerModal } from "./CreateLockerModal";
import { SkillEvidenceModal } from "./SkillEvidenceModal";
import { ExportModal } from "./ExportModal";
import { SettingsModal } from "./SettingsModal";
import { MediaPreviewModal } from "./MediaPreviewModal";

function ModalContent({ type, payload }: { type: string; payload?: Record<string, unknown> }) {
  switch (type) {
    case "createShop": return <CreateShopModal />;
    case "createWorkbench": return <CreateWorkbenchModal payload={payload} />;
    case "createProject": return <CreateProjectModal payload={payload} />;
    case "createBridge": return <CreateBridgeModal payload={payload} />;
    case "createLocker": return <CreateLockerModal />;
    case "skillEvidence": return <SkillEvidenceModal payload={payload} />;
    case "export": return <ExportModal />;
    case "settings": return <SettingsModal />;
    case "mediaPreview": return <MediaPreviewModal payload={payload} />;
    default: return null;
  }
}

export function ModalRoot() {
  const modalStack = useUiStore((s) => s.modalStack);
  const topModal = modalStack[modalStack.length - 1];

  return (
    <AnimatePresence>
      {topModal && (
        <motion.div
          key={`${topModal.type}-${modalStack.length}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <ModalContent type={topModal.type} payload={topModal.payload} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
