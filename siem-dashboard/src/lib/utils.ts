import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AlertStatus, Severity, TimeRange } from '@shared/types';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat('en-US');

export function fmtCompact(value: number): string {
  return compact.format(value);
}

export function fmtNumber(value: number): string {
  return full.format(Math.round(value));
}

export function fmtPercent(value: number, digits = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

export function fmtBytes(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  if (minutes < 60) return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function fmtClock(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', { hour12: false });
}

export function fmtClockShort(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function timeAgo(ts: number, now = Date.now()): string {
  const diff = Math.max(0, now - ts);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function fmtBucketLabel(ts: number, range: TimeRange): string {
  const date = new Date(ts);
  if (range === '7d') {
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit' });
  }
  if (range === '24h' || range === '6h') {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

export function severitySort(a: Severity, b: Severity): number {
  return SEVERITY_WEIGHT[b] - SEVERITY_WEIGHT[a];
}

export const STATUS_LABEL: Record<AlertStatus, string> = {
  open: 'Open',
  investigating: 'Investigating',
  resolved: 'Resolved',
};

export const STATUS_STYLE: Record<AlertStatus, string> = {
  open: 'border-sev-critical/30 bg-sev-critical/10 text-sev-critical',
  investigating: 'border-sev-medium/30 bg-sev-medium/10 text-sev-medium',
  resolved: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
};

export function initials(name: string): string {
  return name
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function classForOutcome(outcome: string): string {
  switch (outcome) {
    case 'blocked':
      return 'text-sev-high';
    case 'failure':
      return 'text-sev-critical';
    case 'success':
      return 'text-emerald-300';
    default:
      return 'text-muted';
  }
}
