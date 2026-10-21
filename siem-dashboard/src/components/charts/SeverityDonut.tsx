import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Severity, SeverityBuckets } from '@shared/types';
import { SEVERITY_META, SEVERITY_ORDER } from '@shared/types';
import { fmtCompact, fmtNumber } from '@/lib/utils';
import { Panel, Skeleton } from '@/components/ui/primitives';

interface Slice {
  severity: Severity;
  label: string;
  value: number;
  color: string;
}

function DonutTooltip({ active, payload }: { active?: boolean; payload?: { payload?: Slice }[] }) {
  if (!active || !payload?.length) return null;
  const slice = payload[0]?.payload;
  if (!slice) return null;
  return (
    <div className="rounded-lg border border-edge bg-surface-2/95 px-2.5 py-1.5 text-[10.5px] shadow-2xl">
      <span className="font-medium" style={{ color: slice.color }}>
        {slice.label}
      </span>
      <span className="ml-2 font-mono text-bright">{fmtNumber(slice.value)}</span>
    </div>
  );
}

export function SeverityDonut({ severity, loading }: { severity: SeverityBuckets; loading?: boolean }) {
  const total = SEVERITY_ORDER.reduce((sum, key) => sum + severity[key], 0);
  const slices: Slice[] = SEVERITY_ORDER.map((key) => ({
    severity: key,
    label: SEVERITY_META[key].label,
    value: severity[key],
    color: SEVERITY_META[key].color,
  })).filter((slice) => slice.value > 0);

  return (
    <Panel
      title="Severity mix"
      subtitle="Distribution across the selected window"
      className="min-h-[330px]"
      bodyClassName="flex flex-col"
    >
      {loading && !total ? (
        <div className="space-y-4 p-4">
          <Skeleton className="mx-auto h-[150px] w-[150px] rounded-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <>
          <div className="relative mx-auto mt-2 h-[170px] w-full max-w-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={56}
                  outerRadius={76}
                  paddingAngle={2}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive={false}
                >
                  {slices.map((slice) => (
                    <Cell key={slice.severity} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="num text-[21px] font-semibold leading-none text-bright">{fmtCompact(total)}</span>
              <span className="mt-1 text-[9px] uppercase tracking-[0.16em] text-muted">events</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1 px-4 pb-4 pt-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {slices.map((slice) => {
              const pct = total ? (slice.value / total) * 100 : 0;
              return (
                <div
                  key={slice.severity}
                  className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-surface-2"
                >
                  <span className="flex min-w-0 items-center gap-1.5 text-[10.5px] text-muted">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                    <span className="truncate capitalize">{slice.severity}</span>
                  </span>
                  <span className="flex shrink-0 items-baseline gap-1.5">
                    <span className="font-mono text-[10.5px] tabular-nums text-bright">{fmtCompact(slice.value)}</span>
                    <span className="w-8 text-right font-mono text-[9px] text-muted/70">{pct.toFixed(1)}%</span>
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Panel>
  );
}
