import React, { useMemo, useState } from "react";
import { CircleDot, Download, Filter, Flame, Hammer, TriangleAlert } from "lucide-react";
import { buildScarSharePayload } from "../../data/scarMap";
import { useScarMap } from "../../hooks/useScarsMap";
import { SCAR_FAILURE_TYPES } from "../../utils/constants";
import { EmptyState } from "../shared/EmptyState";
import { SkeletonBlock } from "../shared/Skeleton";
import { MetricCard, MetricGrid, Page, PageHeader, Panel } from "../shared/Layout";

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Panel title={title} description={description}>
      {children}
    </Panel>
  );
}

function TimelineChart({ data }: { data: Array<{ period: string; count: number }> }) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--ui-text-3)]">No failures in this range.</p>;
  }

  const max = Math.max(...data.map((point) => point.count), 1);

  return (
    <div className="flex h-48 items-end gap-2">
      {data.map((point) => (
        <div key={point.period} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
          <div className="text-[11px] text-[var(--ui-text-3)]">{point.count}</div>
          <div
            className="w-full rounded-t transition-all"
            style={{ background: "var(--ui-accent)", height: `${Math.max(16, (point.count / max) * 140)}px` }}
            title={`${point.period}: ${point.count}`}
          />
          <div className="w-full truncate text-center text-[10px] text-[var(--ui-text-3)]">{point.period.slice(5)}</div>
        </div>
      ))}
    </div>
  );
}

function DistributionChart({ data }: { data: Array<{ failureType: string; count: number }> }) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--ui-text-3)]">Nothing tagged yet.</p>;
  }

  const total = data.reduce((sum, point) => sum + point.count, 0);
  let cursor = 0;
  const segments = data.map((point, index) => {
    const start = cursor;
    const slice = (point.count / total) * 360;
    cursor += slice;
    const color = ["#c98577", "#d7a94d", "#8fa7bb", "#7f9a75", "#a994c7", "#a88a66", "#d8cfc3", "#9a9083"][index % 8];
    return `${color} ${start}deg ${cursor}deg`;
  });

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="mx-auto h-40 w-40 rounded-full border border-[var(--ui-border)]" style={{ background: `conic-gradient(${segments.join(", ")})` }} />
      <div className="grid flex-1 gap-2">
        {data.map((point, index) => {
          const color = ["#c98577", "#d7a94d", "#8fa7bb", "#7f9a75", "#a994c7", "#a88a66", "#d8cfc3", "#9a9083"][index % 8];
          return (
            <div key={point.failureType} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 text-[var(--ui-text-2)]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                <span className="capitalize">{point.failureType.replace(/_/g, " ")}</span>
              </div>
              <span className="text-[var(--ui-text-3)]">{point.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeatmapChart({
  rows,
  columns,
}: {
  rows: Array<{ workbenchId: string; workbenchName: string; counts: Partial<Record<(typeof SCAR_FAILURE_TYPES)[number], number>>; total: number }>;
  columns: readonly (typeof SCAR_FAILURE_TYPES)[number][];
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--ui-text-3)]">No projects have scars in this range.</p>;
  }

  const max = Math.max(...rows.map((row) => row.total), 1);

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[760px] gap-2" style={{ gridTemplateColumns: `180px repeat(${columns.length}, minmax(72px, 1fr))` }}>
        <div className="ui-kicker">Project</div>
        {columns.map((column) => (
          <div key={column} className="text-center text-[11px] uppercase text-[var(--ui-text-3)]">
            {column.replace(/_/g, " ")}
          </div>
        ))}
        {rows.map((row) => (
          <React.Fragment key={row.workbenchId}>
            <div className="truncate text-sm text-[var(--ui-text-2)]">{row.workbenchName}</div>
            {columns.map((column) => {
              const count = row.counts[column] ?? 0;
              const opacity = count === 0 ? 0.08 : Math.max(0.18, count / max);
              return (
                <div
                  key={`${row.workbenchId}-${column}`}
                  className="rounded-md border border-[var(--ui-border)] py-2 text-center text-xs text-[var(--ui-text-1)]"
                  style={{ backgroundColor: `rgba(204, 120, 92, ${opacity})` }}
                  title={`${row.workbenchName} / ${column}: ${count}`}
                >
                  {count}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function TrendChart({ data }: { data: Array<{ period: string; attempts: number; scars: number }> }) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--ui-text-3)]">Not enough attempt history yet.</p>;
  }

  const width = 520;
  const height = 180;
  const max = Math.max(...data.map((point) => Math.max(point.attempts, point.scars)), 1);
  const xStep = data.length > 1 ? width / (data.length - 1) : width;

  const toPolyline = (key: "attempts" | "scars") =>
    data
      .map((point, index) => {
        const x = index * xStep;
        const y = height - (point[key] / max) * (height - 24) - 12;
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full overflow-visible">
        <polyline fill="none" stroke="#9a9083" strokeWidth="3" points={toPolyline("attempts")} />
        <polyline fill="none" stroke="#c98577" strokeWidth="3" points={toPolyline("scars")} />
      </svg>
      <div className="flex flex-wrap gap-4 text-xs text-[var(--ui-text-2)]">
        <span className="flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-[var(--ui-text-2)]" /> Attempts</span>
        <span className="flex items-center gap-2"><span className="h-2 w-6 rounded-full bg-[var(--ui-accent)]" /> Scars</span>
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] text-[var(--ui-text-3)]">
        {data.map((point) => (
          <span key={point.period}>{point.period.slice(5)}: {point.attempts}/{point.scars}</span>
        ))}
      </div>
    </div>
  );
}

export function ScarMapView() {
  const [workbenchId, setWorkbenchId] = useState("");
  const [failureType, setFailureType] = useState<"all" | (typeof SCAR_FAILURE_TYPES)[number]>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filters = useMemo(
    () => ({
      workbenchId: workbenchId || null,
      failureType,
      from: from ? new Date(`${from}T00:00:00`) : null,
      to: to ? new Date(`${to}T23:59:59`) : null,
    }),
    [failureType, from, to, workbenchId]
  );

  const { data, isLoading, isError } = useScarMap(filters);
  const highSeverityCount = data?.rows.filter(({ scar }) => scar.severity === "restart" || scar.severity === "injury").length ?? 0;

  const handleExport = async () => {
    const payload = await buildScarSharePayload(filters);
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tinker-scar-share-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="grid h-full gap-4 p-6 lg:grid-cols-2">
        <SkeletonBlock className="h-60 w-full rounded-lg" />
        <SkeletonBlock className="h-60 w-full rounded-lg" />
        <SkeletonBlock className="h-72 w-full rounded-lg" />
        <SkeletonBlock className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState title="Scar map unavailable" description="The failure archaeology dashboard could not load right now." className="w-full max-w-xl" />
      </div>
    );
  }

  return (
    <Page>
      <PageHeader
        title="Scar Map"
        description="A calmer map of failures, lessons, and repeating patterns."
        actions={
        <button type="button" onClick={handleExport} className="btn btn-primary inline-flex items-center gap-2 self-start shrink-0" data-testid="btn-export-scar-map">
          <Download className="h-4 w-4" />
          Export
        </button>
        }
      />

      <MetricGrid className="mb-6 md:grid-cols-4">
        <MetricCard label="Total scars" value={data.summary.totalScars} icon={<TriangleAlert className="h-4 w-4 text-[var(--ui-danger)]" />} />
        <MetricCard label="Recurring patterns" value={data.distribution.length} icon={<CircleDot className="h-4 w-4 text-[var(--ui-warning)]" />} />
        <MetricCard label="High severity" value={highSeverityCount} icon={<Flame className="h-4 w-4 text-[var(--ui-danger)]" />} />
        <MetricCard label="Attempts in range" value={data.summary.totalAttempts} icon={<Hammer className="h-4 w-4 text-[var(--ui-text-2)]" />} />
      </MetricGrid>

      <Panel className="mb-6" bodyClassName="grid gap-3 xl:grid-cols-[1.1fr_1fr_1fr_1fr]">
        <div className="flex items-center gap-2 text-sm text-[var(--ui-text-2)]">
          <Filter className="h-4 w-4" />
          Filters
        </div>
        <select value={workbenchId} onChange={(event) => setWorkbenchId(event.target.value)} className="input" data-testid="select-scar-project-filter">
          <option value="">All projects</option>
          {data.workbenches.map((workbench) => (
            <option key={workbench.id} value={workbench.id}>{workbench.name}</option>
          ))}
        </select>
        <select value={failureType} onChange={(event) => setFailureType(event.target.value as typeof failureType)} className="input" data-testid="select-scar-type-filter">
          <option value="all">All failure types</option>
          {SCAR_FAILURE_TYPES.map((type) => (
            <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="input" data-testid="input-scar-from" />
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="input" data-testid="input-scar-to" />
        </div>
      </Panel>

      {data.rows.length === 0 ? (
        <EmptyState
          title="No scars in this slice"
          description="Try widening the filters, or tag a failure on an attempt item to start the pattern trail."
          className="min-h-[320px]"
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard title="Timeline" description="Daily failure counts across the current filter window.">
            <TimelineChart data={data.timeline} />
          </ChartCard>
          <ChartCard title="Distribution" description="Which failure patterns are showing up most often.">
            <DistributionChart data={data.distribution} />
          </ChartCard>
          <ChartCard title="Project Heat Map" description="Where failures cluster by project and failure taxonomy.">
            <HeatmapChart rows={data.heatmap} columns={SCAR_FAILURE_TYPES} />
          </ChartCard>
          <ChartCard title="Trend Line" description="Attempts versus scars by week, so you can see whether practice is getting cleaner.">
            <TrendChart data={data.trend} />
          </ChartCard>
        </div>
      )}
    </Page>
  );
}
