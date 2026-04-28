import { useMutation } from "@tanstack/react-query";
import { electron } from "../lib/electron";

export function useExport() {
  return useMutation({
    mutationFn: async () => {
      if (!electron.dbExport) {
        throw new Error("Electron API not available");
      }
      return await electron.dbExport();
    },
    onError: (error) => {
      console.error("Export failed:", error);
    },
  });
}
