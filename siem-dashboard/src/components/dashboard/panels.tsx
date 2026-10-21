import { Link } from 'react-router-dom';
import { ArrowUpRight, Crosshair, Flame, Radio, Radar } from 'lucide-react';
import type { GeoCount, Severity, TopIp } from '@shared/types';
import { SEVERITY_META } from '@shared/types';
import { cn, fmtCompact, fmtNumber, fmtPercent, timeAgo } from '@/lib/utils';
import { Panel, ProgressBar, SeverityDot, Skeleton } from '@/components/ui/primitives';
import { CountryMark } from '@/components/common/CountryMark';

export function TopIpsPanel({ ips, loading }: { ips: TopIp[]; loading?: boolean }) {
  const max = Math.max(1, ...ips.map((ip) => ip.count));
  return (
    <Panel
      title="Top source addresses"
      subtitle="External sources by event volume"
      icon={<Crosshair size={13} />}
      actions={
        <Link to="/logs" className="flex items-center gap-1 text-[10px] text-muted transition-colors hover:text-accent">
          Explore <ArrowUpRight size={11} />
        </Link>
      }
      bodyClassName="py-1"
    >
      {loading && !ips.length ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      ) : (
        <ul className="divide-y divide-edge/40">
          {ips.map((ip, index) => (
            <li key={ip.ip}>
              <Link
                to={`/logs?q=${encodeURIComponent(ip.ip)}`}
                className="group flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-surface-2/70"
              >
                <span className="w-4 shrink-0 font-mono text-[9.5px] text-muted/60">{String(index + 1).padStart(2, '0')}</span>
                <CountryMark country={ip.country} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-mono text-[11px] text-bright transition-colors group-hover:text-accent">
                      {ip.ip}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <SeverityDot severity={ip.severity} />
                      <span className="font-mono text-[10px] tabular-nums text-muted">{fmtCompact(ip.count)}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <ProgressBar
                      value={ip.count}
                      max={max}
                      color={SEVERITY_META[ip.severity].color}
                      className="h-[3px] flex-1"
                    />
                    <span className="w-[86px] shrink-0 truncate text-right text-[9px] text-muted/80">{ip.country}</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function GeoPanel({ geo, loading }: { geo: GeoCount[]; loading?: boolean }) {
  const total = Math.max(
    1,
    geo.reduce((sum, entry) => sum + entry.count, 0),
  );
  const max = Math.max(1, ...geo.map((entry) => entry.count));
  return (
    <Panel
      title="Origin geography"
      subtitle="Source countries · GeoIP enriched"
      icon={<Flame size={13} />}
      actions={<span className="font-mono text-[9px] text-muted/70">{fmtCompact(total)} hits</span>}
      bodyClassName="p-3"
    >
      {loading && !geo.length ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-6 w-full" />
          ))}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {geo.map((entry) => (
            <li key={entry.country} className="flex items-center gap-2.5">
              <CountryMark country={entry.country} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[11px] text-bright">{entry.country}</span>
                  <span className="font-mono text-[10px] text-muted">{fmtPercent((entry.count / total) * 100, 1).replace('+', '')}</span>
                </div>
                <ProgressBar value={entry.count} max={max} color="#3b82f6" className="mt-1 h-[3px]" />
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 border-t border-edge/40 pt-2 text-[9px] leading-relaxed text-muted/60">
        Enrichment from MaxMind GeoLite2 · accuracy ±40 km
      </p>
    </Panel>
  );
}

export function RuleHitsPanel({
  rules,
  loading,
}: {
  rules: { id: string; name: string; severity: Severity; count: number }[];
  loading?: boolean;
}) {
  const max = Math.max(1, ...rules.map((rule) => rule.count));
  return (
    <Panel
      title="Detection rule hits"
      subtitle="Most active analytic rules · 24h"
      icon={<Radar size={13} />}
      actions={
        <Link to="/rules" className="flex items-center gap-1 text-[10px] text-muted transition-colors hover:text-accent">
          All rules <ArrowUpRight size={11} />
        </Link>
      }
      bodyClassName="px-4 py-3"
    >
      {loading && !rules.length ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-5 w-full" />
          ))}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {rules.map((rule) => (
            <li key={rule.id} className="flex items-center gap-2.5">
              <SeverityDot severity={rule.severity} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] text-bright">{rule.name}</span>
                <ProgressBar
                  value={rule.count}
                  max={max}
                  color={SEVERITY_META[rule.severity].color}
                  className="mt-1 h-[2.5px]"
                />
              </span>
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted">{rule.count}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function ActivityFeed({
  items,
  loading,
}: {
  items: { ts: number; message: string; severity: Severity }[];
  loading?: boolean;
}) {
  return (
    <Panel
      title="SOC activity"
      subtitle="Operator and platform events"
      icon={<Radio size={13} />}
      actions={
        <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-emerald-300/80">
          <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
          live
        </span>
      }
      bodyClassName="px-4 py-2"
    >
      {loading && !items.length ? (
        <div className="space-y-3 py-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-6 w-full" />
          ))}
        </div>
      ) : (
        <ul className="relative py-1">
          <span className="absolute bottom-3 left-[3px] top-3 w-px bg-edge/70" />
          {items.map((item, index) => (
            <li key={`${item.ts}-${index}`} className="relative flex gap-3 py-2 pl-4">
              <span
                className={cn('absolute left-0 top-[13px] h-[7px] w-[7px] rounded-full ring-2 ring-surface')}
                style={{ backgroundColor: SEVERITY_META[item.severity].color }}
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[10.5px] leading-relaxed text-bright/90">{item.message}</p>
                <span className="mt-0.5 block font-mono text-[9px] text-muted/70">{timeAgo(item.ts)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-edge/40 py-2 text-[9px] text-muted/60">
        {fmtNumber(items.length)} recent platform events
      </div>
    </Panel>
  );
}
