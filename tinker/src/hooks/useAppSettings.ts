import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllAppSettings, getAppSettingByKey, upsertAppSetting } from "../data/appSettings";
import { queryKeys } from "./queryKeys";
import type { AppSettingInsert } from "../types";

export function useAppSettings() {
  return useQuery({
    queryKey: queryKeys.appSettings,
    queryFn: getAllAppSettings,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAppSetting(key: string) {
  return useQuery({
    queryKey: queryKeys.appSetting(key),
    queryFn: async () => (await getAppSettingByKey(key)) ?? null,
    enabled: !!key,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpsertAppSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AppSettingInsert) => upsertAppSetting(data),
    onSuccess: (setting) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appSettings });
      queryClient.invalidateQueries({ queryKey: queryKeys.appSetting(setting.key) });
    },
  });
}
