import React, { Suspense, lazy } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUiStore } from "../../stores/uiStore";

const CreateShopModal = lazy(() => import("./CreateShopModal").then((module) => ({ default: module.CreateShopModal })));
const CreateWorkbenchModal = lazy(() => import("./CreateWorkbenchModal").then((module) => ({ default: module.CreateWorkbenchModal })));
const CreateProjectModal = lazy(() => import("./CreateProjectModal").then((module) => ({ default: module.CreateProjectModal })));
const CreateBridgeModal = lazy(() => import("./CreateBridgeModal").then((module) => ({ default: module.CreateBridgeModal })));
const CreateLockerModal = lazy(() => import("./CreateLockerModal").then((module) => ({ default: module.CreateLockerModal })));
const SkillEvidenceModal = lazy(() => import("./SkillEvidenceModal").then((module) => ({ default: module.SkillEvidenceModal })));
const ExportModal = lazy(() => import("./ExportModal").then((module) => ({ default: module.ExportModal })));
const SettingsModal = lazy(() => import("./SettingsModal").then((module) => ({ default: module.SettingsModal })));
const MediaPreviewModal = lazy(() => import("./MediaPreviewModal").then((module) => ({ default: module.MediaPreviewModal })));

function ModalContent({ type, payload }: { type: string; payload?: Record<string, unknown> }) {
  return (
    <Suspense fallback={null}>
      {(() => {
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
      })()}
    </Suspense>
  );
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
