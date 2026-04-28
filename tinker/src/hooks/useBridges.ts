import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllBridges, getBridgesByItem, getBridgeById, getDecayingBridges, createBridge, updateBridge, deleteBridge, reinforceBridge } from "../data/bridges";
import { queryKeys } from "./queryKeys";
import type { BridgeInsert, BridgeUpdate } from "../types";

export function useAllBridges() {
  return useQuery({
    queryKey: queryKeys.bridges(),
    queryFn: getAllBridges,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBridges(itemId: string) {
  return useQuery({
    queryKey: queryKeys.bridges(itemId),
    queryFn: () => getBridgesByItem(itemId),
    enabled: !!itemId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBridge(id: string) {
  return useQuery({
    queryKey: ["bridges", "detail", id],
    queryFn: () => getBridgeById(id),
    enabled: !!id,
  });
}

export function useDecayingBridges() {
  return useQuery({
    queryKey: queryKeys.bridgesDecaying,
    queryFn: getDecayingBridges,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateBridge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBridge,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bridges() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bridges(variables.sourceItemId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bridges(variables.targetItemId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bridgesDecaying });
    },
  });
}

export function useUpdateBridge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BridgeUpdate }) => updateBridge(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bridges() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bridges(data.sourceItemId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bridges(data.targetItemId) });
      queryClient.invalidateQueries({ queryKey: ["bridges", "detail", data.id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.bridgesDecaying });
    },
  });
}

export function useDeleteBridge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBridge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bridges() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bridgesDecaying });
    },
  });
}

export function useReinforceBridge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reinforceBridge,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bridges() });
      queryClient.invalidateQueries({ queryKey: queryKeys.bridges(data.sourceItemId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bridges(data.targetItemId) });
      queryClient.invalidateQueries({ queryKey: ["bridges", "detail", data.id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.bridgesDecaying });
    },
  });
}
