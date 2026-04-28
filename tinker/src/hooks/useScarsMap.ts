import { useQuery } from "@tanstack/react-query";
import { buildScarSharePayload, getScarMapData, type ScarMapFilters } from "../data/scarMap";

export function useScarMap(filters: ScarMapFilters) {
  return useQuery({
    queryKey: [
      "scarMap",
      filters.workbenchId ?? "all",
      filters.failureType ?? "all",
      filters.from?.toISOString() ?? "none",
      filters.to?.toISOString() ?? "none",
    ],
    queryFn: () => getScarMapData(filters),
    staleTime: 1000 * 30,
  });
}

export function useScarSharePayload(filters: ScarMapFilters) {
  return useQuery({
    queryKey: [
      "scarShare",
      filters.workbenchId ?? "all",
      filters.failureType ?? "all",
      filters.from?.toISOString() ?? "none",
      filters.to?.toISOString() ?? "none",
    ],
    queryFn: () => buildScarSharePayload(filters),
    staleTime: 1000 * 30,
  });
}
