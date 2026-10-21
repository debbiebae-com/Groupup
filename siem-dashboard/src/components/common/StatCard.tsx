import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn, fmtPercent } from '@/lib/utils';
import { Skeleton, Sparkline } from '@/components/ui/primitives';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  hint?: ReactNode;
  delta?: number;
  deltaLabel?: string;
  deltaTone?: 'good' | 'bad' | 'neutral';
  spark?: number[];
  sparkColor?: string;
  accent?: 'critical' | 'accent' | 'none';
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  delta,
  deltaLabel,
  deltaTone = 'neutral',
  spark,
  sparkColor = '#22d3ee',
  accent = 'none',
  loading,
}: StatCardProps) {
  const isUp = (delta ?? 0) > 0;
  const DeltaIcon = isUp ? ArrowUpRight : ArrowDownRight;
  const deltaColor =
    deltaTone === 'neutral'
      ? 'text-muted'
      : deltaTone === 'good'
        ? 'text-emerald-300'
        : 'text-sev-high';

  return (
    <div
      className={cn(
        'panel relative overflow-hidden p-3.5',
        accent === 'critical' && 'border-sev-critical/25 bg-gradient-to-br from-sev-critical/[0.05] to-surface/90',
      )}
    >
      {accent === 'critical' && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sev-critical/70 to-transparent" />
      )}
      {accent === 'accent' && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="label-caps">{label}</span>
        {Icon && <Icon size={14} className={accent === 'critical' ? 'text-sev-critical/70' : 'text-muted/70'} />}
      </div>

      {loading ? (
        <Skeleton className="mt-3 h-7 w-24" />
      ) : (
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="num text-[24px] font-semibold leading-none tracking-tight text-bright">{value}</span>
        </div>
      )}

      <div className="mt-2.5 flex items-end justify-between gap-2">
        <div className="min-w-0 space-y-1">
          {delta !== undefined && (
            <div className="flex items-center gap-1.5 text-[10.5px]">
              <span className={cn('flex items-center gap-0.5 font-medium', deltaColor)}>
                <DeltaIcon size={12} />
                {fmtPercent(delta)}
              </span>
              {deltaLabel && <span className="truncate text-muted">{deltaLabel}</span>}
            </div>
          )}
          {hint && <div className="truncate text-[10.5px] text-muted">{hint}</div>}
        </div>
        {spark && spark.length > 1 && (
          <div className="w-[74px] shrink-0 opacity-90">
            <Sparkline data={spark} color={sparkColor} className="h-6" fill />
          </div>
        )}
      </div>
    </div>
  );
}
