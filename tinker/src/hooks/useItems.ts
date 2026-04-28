import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllItems, getItemsByWorkbench, getItemById, searchItems, createItem, updateItem, deleteItem } from "../data/items";
import { queryKeys } from "./queryKeys";
import type { ItemInsert, ItemUpdate } from "../types";

export function useAllItems() {
  return useQuery({
    queryKey: ["items"],
    queryFn: getAllItems,
    staleTime: 1000 * 60 * 5,
  });
}

export function useItems(workbenchId: string) {
  return useQuery({
    queryKey: queryKeys.items(workbenchId),
    queryFn: () => getItemsByWorkbench(workbenchId),
    enabled: !!workbenchId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: queryKeys.item(id),
    queryFn: () => getItemById(id),
    enabled: !!id,
  });
}

export function useSearchItems(query: string) {
  return useQuery({
    queryKey: ["items", "search", query],
    queryFn: () => searchItems(query),
    enabled: query.length > 2,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createItem,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.items(variables.workbenchId) });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ItemUpdate }) => updateItem(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.items(data.workbenchId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.item(data.id) });
    },
  });
}

export function useUpdateItemPosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, posX, posY }: { id: string; posX: number; posY: number }) => updateItem(id, { posX, posY }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.items(data.workbenchId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.item(data.id) });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });
}
