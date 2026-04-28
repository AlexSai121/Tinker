import { db } from "@/db";
import { cameraStates, workbenches } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { CameraState, CameraStateInsert } from "@/types";
import { deleteRow, getTable, insertRow, updateRow } from "@/lib/browserStore";
import { withDataFallback } from "./backend";

export async function getCameraByWorkbench(workbenchId: string): Promise<CameraState | undefined> {
  return withDataFallback(
    () => getTable<CameraState>("cameraStates").find((cameraState) => cameraState.workbenchId === workbenchId),
    async () => {
      const result = await db
        .select()
        .from(cameraStates)
        .where(eq(cameraStates.workbenchId, workbenchId))
        .limit(1);
      return result[0];
    }
  );
}

// In case getByShop was requested literally, this gets all camera states for workbenches in a shop
export async function getCamerasByShop(shopId: string): Promise<CameraState[]> {
  return withDataFallback(
    () => {
      const shopWorkbenchIds = getTable<{ id: string; shopId: string }>("workbenches")
        .filter((workbench) => workbench.shopId === shopId)
        .map((workbench) => workbench.id);

      return getTable<CameraState>("cameraStates").filter((cameraState) =>
        shopWorkbenchIds.includes(cameraState.workbenchId)
      );
    },
    async () => {
      const result = await db
        .select({ cameraState: cameraStates })
        .from(cameraStates)
        .innerJoin(workbenches, eq(cameraStates.workbenchId, workbenches.id))
        .where(eq(workbenches.shopId, shopId));
      return result.map((row) => row.cameraState);
    }
  );
}

export async function saveCameraState(data: CameraStateInsert): Promise<CameraState> {
  const existing = await getCameraByWorkbench(data.workbenchId);

  return withDataFallback(
    () => {
      if (existing) {
        return updateRow<CameraState>("cameraStates", existing.id, (cameraState) => ({
          ...cameraState,
          ...data,
          updatedAt: new Date(),
        }));
      }
      return insertRow("cameraStates", data as CameraState);
    },
    async () => {
      if (existing) {
        const result = await db
          .update(cameraStates)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(cameraStates.id, existing.id))
          .returning();
        return result[0];
      }

      const result = await db.insert(cameraStates).values(data).returning();
      return result[0];
    }
  );
}

export async function deleteCameraState(id: string): Promise<void> {
  return withDataFallback(
    () => {
      deleteRow("cameraStates", id);
    },
    async () => {
      await db.delete(cameraStates).where(eq(cameraStates.id, id));
    }
  );
}
