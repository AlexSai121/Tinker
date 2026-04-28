import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importExportPayload, type ImportOptions } from "../data/export";

export function useImportData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: ImportOptions) => importExportPayload(options),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
