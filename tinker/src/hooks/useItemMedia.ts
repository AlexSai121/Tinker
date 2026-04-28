import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createItemMedia, deleteItemMedia, getMediaByItem } from "../data/itemMedia";
import { queryKeys } from "./queryKeys";
import type { ItemMediaInsert } from "../types";

export function useItemMedia(itemId: string) {
  return useQuery({
    queryKey: queryKeys.itemMedia(itemId),
    queryFn: () => getMediaByItem(itemId),
    enabled: !!itemId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateItemMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createItemMedia,
    onSuccess: (_, variables: ItemMediaInsert) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.itemMedia(variables.itemId) });
    },
  });
}

export function useDeleteItemMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, itemId }: { id: string; itemId: string }) =>
      deleteItemMedia(id).then(() => itemId),
    onSuccess: (itemId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.itemMedia(itemId) });
    },
  });
}
