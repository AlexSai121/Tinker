import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWorkbenchesByShop, getWorkbenchById, createWorkbench, updateWorkbench, deleteWorkbench, archiveWorkbench, restoreWorkbench, updateDust } from "../data/workbenches";
import { queryKeys } from "./queryKeys";
import type { Workbench, WorkbenchInsert, WorkbenchUpdate } from "../types";
import { getAllWorkbenches } from "../data/workbenches";

export function useAllWorkbenches() {
  return useQuery({
    queryKey: queryKeys.workbenches(),
    queryFn: getAllWorkbenches,
    staleTime: 1000 * 60 * 5,
  });
}

export function useWorkbenches(shopId: string) {
  return useQuery({
    queryKey: queryKeys.workbenches(shopId),
    queryFn: () => getWorkbenchesByShop(shopId),
    enabled: !!shopId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useWorkbench(id: string) {
  return useQuery({
    queryKey: queryKeys.workbench(id),
    queryFn: () => getWorkbenchById(id),
    enabled: !!id,
  });
}

export function useCreateWorkbench() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkbench,
    onSuccess: (workbench, variables) => {
      queryClient.setQueryData(queryKeys.workbench(workbench.id), workbench);
      queryClient.invalidateQueries({ queryKey: queryKeys.workbenches() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workbenches(variables.shopId) });
    },
  });
}

export function useUpdateWorkbench() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorkbenchUpdate }) => updateWorkbench(id, data),
    onSuccess: (workbench) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workbenches(workbench.shopId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workbench(workbench.id) });
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}

export function useDeleteWorkbench() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkbench,
    onSuccess: (_, workbenchId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workbenches() });
      queryClient.invalidateQueries({ queryKey: queryKeys.items(workbenchId) });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.skills(workbenchId) });
    },
  });
}

export function useArchiveWorkbench() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveWorkbench,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workbenches() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workbenches(data.shopId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workbench(data.id) });
    },
  });
}

export function useRestoreWorkbench() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restoreWorkbench,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workbenches() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workbenches(data.shopId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workbench(data.id) });
    },
  });
}

export function useUpdateDust() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, date }: { id: string; date: Date }) => updateDust(id, date),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workbenches() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workbenches(data.shopId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workbench(data.id) });
    },
  });
}
