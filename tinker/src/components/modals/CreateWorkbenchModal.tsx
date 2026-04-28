import React from "react";
import { CreateProjectModal } from "./CreateProjectModal";

export function CreateWorkbenchModal({ payload }: { payload?: Record<string, unknown> }) {
  return <CreateProjectModal payload={payload} />;
}
