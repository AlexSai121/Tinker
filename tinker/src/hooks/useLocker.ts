import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllLockerItems,
  getStaleLockerItems,
  createLockerItem,
  updateLockerItem,
  deleteLockerItem,
  archiveLockerItem,
  rescueLockerItem,
  restoreLockerItem,
} from "../data/locker";
import { queryKeys } from "./queryKeys";
import type { LockerItemInsert, LockerItemUpdate } from "../types";

export function useLockerItems() {
  return useQuery({
    queryKey: queryKeys.locker,
    queryFn: getAllLockerItems,
    staleTime: 1000 * 60 * 5,
  });
}

export function useStaleLockerItems() {
  return useQuery({
    queryKey: queryKeys.lockerStale,
    queryFn: () => getStaleLockerItems(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateLockerItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLockerItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locker });
      queryClient.invalidateQueries({ queryKey: queryKeys.lockerStale });
    },
  });
}

export function useUpdateLockerItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LockerItemUpdate }) => updateLockerItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locker });
      queryClient.invalidateQueries({ queryKey: queryKeys.lockerStale });
    },
  });
}

export function useDeleteLockerItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLockerItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locker });
      queryClient.invalidateQueries({ queryKey: queryKeys.lockerStale });
    },
  });
}

export function useArchiveLockerItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveLockerItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locker });
      queryClient.invalidateQueries({ queryKey: queryKeys.lockerStale });
    },
  });
}

export function useRestoreLockerItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, staleDays }: { id: string; staleDays?: number }) => restoreLockerItem(id, staleDays),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locker });
      queryClient.invalidateQueries({ queryKey: queryKeys.lockerStale });
    },
  });
}

export function useRescueLockerItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rescueLockerItem,
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locker });
      queryClient.invalidateQueries({ queryKey: queryKeys.lockerStale });
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.items(variables.workbenchId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.item(result.rescuedItem.id) });
    },
  });
}
