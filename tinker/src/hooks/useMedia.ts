import { useMutation, useQueryClient } from "@tanstack/react-query";
import { electron } from "../lib/electron";
import type { MediaSaveRequest, MediaDeleteRequest } from "../../electron/ipc/types";

export function useSaveMedia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: MediaSaveRequest) => {
      if (!electron.mediaSave) {
        throw new Error("Electron API not available");
      }
      return await electron.mediaSave(request);
    },
    onSuccess: () => {
      // Invalidate queries that might depend on media
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: MediaDeleteRequest) => {
      if (!electron.mediaDelete) {
        throw new Error("Electron API not available");
      }
      return await electron.mediaDelete(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
