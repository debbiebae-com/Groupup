import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Severity, TimeRange, TimelineBucket } from '@shared/types';
import { SEVERITY_META } from '@shared/types';
import { cn, fmtBucketLabel, fmtCompact, fmtNumber } from '@/lib/utils';
import { Panel, Skeleton } from '@/components/ui/primitives';

const AREAS: { key: Severity; label: string }[] = [
  { key: 'info', label: 'Info' },
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
  { key: 'critical', label: 'Critical' },
];

interface TooltipPayload {
  dataKey?: string | number;
  value?: number;
  color?: string;
}

function TrafficTooltip({
  active,
  payload,
  label,
  range,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: number;
  range: TimeRange;
}) {
  if (!active || !payload?.length) return null;
  const byKey = new Map(payload.map((entry) => [String(entry.dataKey), entry.value ?? 0]));
  const total = AREAS.reduce((sum, area) => sum + (byKey.get(area.key) ?? 0), 0);

  return (
    <div className="min-w-[168px] rounded-lg border border-edge bg-surface-2/95 px-3 py-2 shadow-2xl backdrop-blur">
      <div className="mb-1.5 flex items-center justify-between gap-3 border-b border-edge/60 pb-1.5">
        <span className="font-mono text-[10px] text-muted">
          {fmtBucketLabel(label ?? 0, range)}
          {range === '7d' ? ` · ${new Date(label ?? 0).toLocaleDateString('en-GB', { month: 'short', day: '2-digit' })}` : ''}
        </span>
        <span className="font-mono text-[10px] font-semibold text-bright">{fmtCompact(total)}</span>
      </div>
      <div className="space-y-1">
        {[...AREAS].reverse().map((area) => (
          <div key={area.key} className="flex items-center justify-between gap-4 text-[10.5px]">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="h-1.5 w-1.5 rounded-sm" style={{ backgroundColor: SEVERITY_META[area.key].color }} />
              {area.label}
            </span>
            <span className="font-mono tabular-nums text-bright">{fmtNumber(byKey.get(area.key) ?? 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrafficChart({
  data,
  range,
  eps,
  loading,
}: {
  data: TimelineBucket[];
  range: TimeRange;
  eps: number;
  loading?: boolean;
}) {
  const total = useMemo(
    () =>
      data.reduce(
        (sum, bucket) => sum + bucket.critical + bucket.high + bucket.medium + bucket.low + bucket.info,
        0,
      ),
    [data],
  );

  return (
    <Panel
      title="Ingest volume"
      subtitle="Normalized security events by severity"
      actions={
        <div className="hidden items-center gap-3 sm:flex">
          {AREAS.slice(2).reverse().map((area) => (
            <span key={area.key} className="flex items-center gap-1.5 text-[9.5px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: SEVERITY_META[area.key].color }} />
              {area.label}
            </span>
          ))}
        </div>
      }
      className="min-h-[330px]"
      bodyClassName="flex flex-col"
    >
      <div className="px-2 pt-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-2">
          <div className="flex items-baseline gap-2">
            <span className="num text-[20px] font-semibold text-bright">{fmtCompact(total)}</span>
            <span className="text-[10.5px] text-muted">events in window</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono text-[10.5px] text-muted">
              {eps.toFixed(1)} <span className="text-muted/60">ev/s live</span>
            </span>
          </div>
        </div>
        {loading && !data.length ? (
          <Skeleton className="mt-3 h-[240px] w-full" />
        ) : (
          <div className="mt-1 h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  {AREAS.map((area) => (
                    <linearGradient key={area.key} id={`grad-${area.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SEVERITY_META[area.key].color} stopOpacity={area.key === 'info' ? 0.14 : 0.4} />
                      <stop offset="100%" stopColor={SEVERITY_META[area.key].color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke="#182335" strokeDasharray="3 6" vertical={false} />
                <XAxis
                  dataKey="ts"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={28}
                  tickMargin={8}
                  tickFormatter={(value: number) => fmtBucketLabel(value, range)}
                />
                <YAxis
                  width={38}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  tickFormatter={(value: number) => fmtCompact(value)}
                />
                <Tooltip content={<TrafficTooltip range={range} />} cursor={{ stroke: '#31435d', strokeDasharray: '3 4' }} />
                {AREAS.map((area) => (
                  <Area
                    key={area.key}
                    type="monotone"
                    dataKey={area.key}
                    stackId="events"
                    stroke={SEVERITY_META[area.key].color}
                    strokeWidth={area.key === 'critical' ? 1.6 : 1}
                    fill={`url(#grad-${area.key})`}
                    isAnimationActive={false}
                    activeDot={{ r: 2.5, strokeWidth: 0 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-edge/50 px-4 py-2">
        <div className="flex flex-wrap items-center gap-3">
          {AREAS.map((area) => (
            <span key={area.key} className="flex items-center gap-1.5 text-[9.5px] text-muted">
              <span className="h-1.5 w-1.5 rounded-sm" style={{ backgroundColor: SEVERITY_META[area.key].color }} />
              {area.label}
            </span>
          ))}
        </div>
        <span className={cn('font-mono text-[9.5px] text-muted/70')}>
          bucket {range === '7d' ? '6h' : range === '24h' ? '1h' : range === '6h' ? '15m' : '5m'}
        </span>
      </div>
    </Panel>
  );
}
