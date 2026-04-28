import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllShops, getShopById, createShop, updateShop, deleteShop } from "../data/shops";
import { queryKeys } from "./queryKeys";
import type { ShopInsert, ShopUpdate } from "../types";

export function useShops() {
  return useQuery({
    queryKey: queryKeys.shops,
    queryFn: getAllShops,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useShop(id: string) {
  return useQuery({
    queryKey: queryKeys.shop(id),
    queryFn: () => getShopById(id),
    enabled: !!id,
  });
}

export function useCreateShop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createShop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shops });
    },
    onError: (error) => {
      console.error("Failed to create shop:", error);
    },
  });
}

export function useUpdateShop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ShopUpdate }) => updateShop(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shops });
      queryClient.invalidateQueries({ queryKey: queryKeys.shop(variables.id) });
    },
  });
}

export function useDeleteShop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteShop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shops });
      queryClient.invalidateQueries({ queryKey: queryKeys.workbenches() });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.skills() });
      queryClient.invalidateQueries({ queryKey: queryKeys.locker });
    },
  });
}
