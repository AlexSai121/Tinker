import React from "react";
import { cn } from "../../utils/cn";

interface PageProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}

export function Page({ children, className, innerClassName }: PageProps) {
  return (
    <div className={cn("ui-page", className)}>
      <div className={cn("ui-page-inner", innerClassName)}>{children}</div>
    </div>
  );
}

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("ui-page-header", className)}>
      <div className="min-w-0">
        <h1 className="ui-page-title">{title}</h1>
        {description && <p className="ui-page-description">{description}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  as?: "section" | "aside" | "article";
}

export function Panel({ children, className, bodyClassName, title, description, as = "section" }: PanelProps) {
  const Component = as;

  return (
    <Component className={cn("ui-panel", className)}>
      {(title || description) && (
        <div className="ui-panel-header">
          {title && <h2 className="text-sm font-semibold text-[var(--ui-text-1)]">{title}</h2>}
          {description && <p className="mt-1 text-xs leading-5 text-[var(--ui-text-3)]">{description}</p>}
        </div>
      )}
      <div className={cn("ui-panel-body", bodyClassName)}>{children}</div>
    </Component>
  );
}

interface MetricCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  testId?: string;
}

export function MetricCard({ label, value, icon, className, testId }: MetricCardProps) {
  return (
    <div className={cn("ui-metric", className)} data-testid={testId}>
      <div className="ui-metric-label">
        {icon}
        <span>{label}</span>
      </div>
      <div className="ui-metric-value">{value}</div>
    </div>
  );
}

interface MetricGridProps {
  children: React.ReactNode;
  className?: string;
}

export function MetricGrid({ children, className }: MetricGridProps) {
  return <div className={cn("ui-metric-grid", className)}>{children}</div>;
}

interface InspectorProps {
  children: React.ReactNode;
  className?: string;
}

export function Inspector({ children, className }: InspectorProps) {
  return <aside className={cn("ui-inspector flex min-h-0 flex-col overflow-y-auto", className)}>{children}</aside>;
}

interface FieldRowProps {
  children: React.ReactNode;
  className?: string;
  testId?: string;
  onClick?: () => void;
}

export function FieldRow({ children, className, testId, onClick }: FieldRowProps) {
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn("ui-row w-full px-4 py-3 text-left", className)} data-testid={testId}>
        {children}
      </button>
    );
  }

  return (
    <div className={cn("ui-row px-4 py-3", className)} data-testid={testId}>
      {children}
    </div>
  );
}
