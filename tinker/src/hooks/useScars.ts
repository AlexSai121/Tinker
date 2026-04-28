import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllScars, getScarsByItem, getScarById, createScar, updateScar, deleteScar } from "../data/scars";
import { queryKeys } from "./queryKeys";
import type { ScarInsert, ScarUpdate } from "../types";

export function useAllScars() {
  return useQuery({
    queryKey: ["scars"],
    queryFn: getAllScars,
    staleTime: 1000 * 60 * 5,
  });
}

export function useScars(itemId: string) {
  return useQuery({
    queryKey: queryKeys.scars(itemId),
    queryFn: () => getScarsByItem(itemId),
    enabled: !!itemId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useScar(id: string) {
  return useQuery({
    queryKey: ["scars", "detail", id],
    queryFn: () => getScarById(id),
    enabled: !!id,
  });
}

export function useCreateScar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createScar,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["scars"] });
      queryClient.invalidateQueries({ queryKey: ["scarMap"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.scars(variables.itemId) });
    },
  });
}

export function useUpdateScar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ScarUpdate }) => updateScar(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["scars"] });
      queryClient.invalidateQueries({ queryKey: ["scarMap"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.scars(data.itemId) });
      queryClient.invalidateQueries({ queryKey: ["scars", "detail", data.id] });
    },
  });
}

export function useDeleteScar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteScar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scars"] });
      queryClient.invalidateQueries({ queryKey: ["scarMap"] });
    },
  });
}
