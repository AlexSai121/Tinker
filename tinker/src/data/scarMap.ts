import { db } from "@/db";
import { items, scars, workbenches } from "@/db/schema";
import { getTable } from "@/lib/browserStore";
import { eq } from "drizzle-orm";
import type { Item, Scar, Workbench } from "@/types";
import { withDataFallback } from "./backend";

export interface ScarMapFilters {
  workbenchId?: string | null;
  failureType?: Scar["failureType"] | "all";
  from?: Date | null;
  to?: Date | null;
}

export interface ScarTimelinePoint {
  period: string;
  count: number;
}

export interface ScarDistributionPoint {
  failureType: Scar["failureType"];
  count: number;
}

export interface ScarHeatmapRow {
  workbenchId: string;
  workbenchName: string;
  counts: Partial<Record<Scar["failureType"], number>>;
  total: number;
}

export interface ScarTrendPoint {
  period: string;
  attempts: number;
  scars: number;
}

export interface ScarMapRow {
  scar: Scar;
  item: Item;
  workbench: Workbench;
}

export interface ScarMapData {
  rows: ScarMapRow[];
  timeline: ScarTimelinePoint[];
  distribution: ScarDistributionPoint[];
  heatmap: ScarHeatmapRow[];
  trend: ScarTrendPoint[];
  workbenches: Pick<Workbench, "id" | "name">[];
  summary: {
    totalScars: number;
    totalAttempts: number;
    failureRate: number;
  };
}

function startOfWeek(value: Date) {
  const date = new Date(value);
  const day = date.getDay();
  const offset = (day + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - offset);
  return date;
}

function toDayKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toWeekKey(value: Date) {
  return toDayKey(startOfWeek(value));
}

function inDateRange(value: Date, from?: Date | null, to?: Date | null) {
  if (from && value < from) return false;
  if (to && value > to) return false;
  return true;
}

async function getScarRows(): Promise<ScarMapRow[]> {
  return withDataFallback(
    () => {
      const allScars = getTable<Scar>("scars");
      const allItems = getTable<Item>("items");
      const allWorkbenches = getTable<Workbench>("workbenches");

      return allScars
        .map((scar) => {
          const item = allItems.find((candidate) => candidate.id === scar.itemId);
          const workbench = item
            ? allWorkbenches.find((candidate) => candidate.id === item.workbenchId)
            : undefined;

          if (!item || !workbench) {
            return null;
          }

          return { scar, item, workbench };
        })
        .filter((row): row is ScarMapRow => Boolean(row));
    },
    async () => {
      const rows = await db
        .select({
          scar: scars,
          item: items,
          workbench: workbenches,
        })
        .from(scars)
        .innerJoin(items, eq(scars.itemId, items.id))
        .innerJoin(workbenches, eq(items.workbenchId, workbenches.id));

      return rows;
    }
  );
}

async function getAttemptRows(): Promise<Array<{ item: Item; workbench: Workbench }>> {
  return withDataFallback(
    () => {
      const allItems = getTable<Item>("items").filter((item) => item.type === "attempt");
      const allWorkbenches = getTable<Workbench>("workbenches");

      return allItems
        .map((item) => {
          const workbench = allWorkbenches.find((candidate) => candidate.id === item.workbenchId);
          if (!workbench) return null;
          return { item, workbench };
        })
        .filter((row): row is { item: Item; workbench: Workbench } => Boolean(row));
    },
    () =>
      db
        .select({
          item: items,
          workbench: workbenches,
        })
        .from(items)
        .innerJoin(workbenches, eq(items.workbenchId, workbenches.id))
        .where(eq(items.type, "attempt"))
  );
}

function applyScarFilters(rows: ScarMapRow[], filters: ScarMapFilters) {
  return rows.filter(({ scar, workbench }) => {
    if (filters.workbenchId && workbench.id !== filters.workbenchId) {
      return false;
    }

    if (filters.failureType && filters.failureType !== "all" && scar.failureType !== filters.failureType) {
      return false;
    }

    return inDateRange(new Date(scar.createdAt), filters.from, filters.to);
  });
}

function applyAttemptFilters(rows: Array<{ item: Item; workbench: Workbench }>, filters: ScarMapFilters) {
  return rows.filter(({ item, workbench }) => {
    if (filters.workbenchId && workbench.id !== filters.workbenchId) {
      return false;
    }

    return inDateRange(new Date(item.createdAt), filters.from, filters.to);
  });
}

export async function getScarMapData(filters: ScarMapFilters = {}): Promise<ScarMapData> {
  const [scarRows, attemptRows] = await Promise.all([getScarRows(), getAttemptRows()]);
  const filteredRows = applyScarFilters(scarRows, filters);
  const filteredAttempts = applyAttemptFilters(attemptRows, filters);

  const timelineBuckets = new Map<string, number>();
  filteredRows.forEach(({ scar }) => {
    const key = toDayKey(new Date(scar.createdAt));
    timelineBuckets.set(key, (timelineBuckets.get(key) ?? 0) + 1);
  });

  const distributionBuckets = new Map<Scar["failureType"], number>();
  filteredRows.forEach(({ scar }) => {
    distributionBuckets.set(scar.failureType, (distributionBuckets.get(scar.failureType) ?? 0) + 1);
  });

  const heatmapBuckets = new Map<string, ScarHeatmapRow>();
  filteredRows.forEach(({ scar, workbench }) => {
    const current = heatmapBuckets.get(workbench.id) ?? {
      workbenchId: workbench.id,
      workbenchName: workbench.name,
      counts: {},
      total: 0,
    };
    current.counts[scar.failureType] = (current.counts[scar.failureType] ?? 0) + 1;
    current.total += 1;
    heatmapBuckets.set(workbench.id, current);
  });

  const trendBuckets = new Map<string, ScarTrendPoint>();
  filteredAttempts.forEach(({ item }) => {
    const key = toWeekKey(new Date(item.createdAt));
    const current = trendBuckets.get(key) ?? { period: key, attempts: 0, scars: 0 };
    current.attempts += 1;
    trendBuckets.set(key, current);
  });
  filteredRows.forEach(({ scar }) => {
    const key = toWeekKey(new Date(scar.createdAt));
    const current = trendBuckets.get(key) ?? { period: key, attempts: 0, scars: 0 };
    current.scars += 1;
    trendBuckets.set(key, current);
  });

  const totalAttempts = filteredAttempts.length;
  const totalScars = filteredRows.length;

  return {
    rows: filteredRows,
    timeline: [...timelineBuckets.entries()]
      .map(([period, count]) => ({ period, count }))
      .sort((left, right) => left.period.localeCompare(right.period)),
    distribution: [...distributionBuckets.entries()]
      .map(([failureType, count]) => ({ failureType, count }))
      .sort((left, right) => right.count - left.count),
    heatmap: [...heatmapBuckets.values()].sort((left, right) => right.total - left.total),
    trend: [...trendBuckets.values()].sort((left, right) => left.period.localeCompare(right.period)),
    workbenches: [...new Map(scarRows.map(({ workbench }) => [workbench.id, { id: workbench.id, name: workbench.name }])).values()],
    summary: {
      totalScars,
      totalAttempts,
      failureRate: totalAttempts > 0 ? totalScars / totalAttempts : 0,
    },
  };
}

export async function buildScarSharePayload(filters: ScarMapFilters = {}) {
  const data = await getScarMapData(filters);
  const aliases = new Map<string, string>();
  let counter = 1;

  data.rows.forEach(({ workbench }) => {
    if (!aliases.has(workbench.id)) {
      aliases.set(workbench.id, `project-${counter}`);
      counter += 1;
    }
  });

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    filters: {
      workbenchId: filters.workbenchId ?? null,
      failureType: filters.failureType ?? "all",
      from: filters.from?.toISOString() ?? null,
      to: filters.to?.toISOString() ?? null,
    },
    summary: data.summary,
    timeline: data.timeline,
    distribution: data.distribution,
    heatmap: data.heatmap.map((row) => ({
      projectAlias: aliases.get(row.workbenchId) ?? row.workbenchId,
      counts: row.counts,
      total: row.total,
    })),
    scars: data.rows.map(({ scar, workbench }) => ({
      projectAlias: aliases.get(workbench.id) ?? workbench.id,
      failureType: scar.failureType,
      severity: scar.severity,
      costTime: scar.costTime,
      costMaterials: scar.costMaterials,
      costMoney: scar.costMoney,
      notes: scar.notes,
      createdAt: scar.createdAt.toISOString(),
    })),
  };
}
