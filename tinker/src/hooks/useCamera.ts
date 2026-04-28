import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCamerasByShop, saveCameraState, deleteCameraState } from "../data/camera";
import { queryKeys } from "./queryKeys";
import type { CameraStateInsert } from "../types";

export function useCamera(shopId: string) {
  return useQuery({
    queryKey: queryKeys.camera(shopId),
    queryFn: () => getCamerasByShop(shopId),
    enabled: !!shopId,
    staleTime: Infinity, // Camera states shouldn't go stale quickly unless updated
  });
}

export function useSaveCamera() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveCameraState,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["camera"] });
    },
  });
}

export function useDeleteCamera() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCameraState,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["camera"] });
    },
  });
}
