import { ChevronRight } from 'lucide-react';
import type { Alert } from '@shared/types';
import { SEVERITY_META } from '@shared/types';
import { cn, timeAgo } from '@/lib/utils';
import { SeverityBadge, StatusBadge } from '@/components/ui/primitives';
import { EntityChip } from './EntityChip';

export function AlertRow({
  alert,
  onClick,
  selected,
}: {
  alert: Alert;
  onClick?: () => void;
  selected?: boolean;
}) {
  const meta = SEVERITY_META[alert.severity];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative block w-full border-b border-edge/50 px-4 py-3 text-left transition-colors',
        selected ? 'bg-surface-3/80' : 'hover:bg-surface-2/80',
      )}
    >
      <span
        className="absolute inset-y-2 left-0 w-[2px] rounded-r-full"
        style={{ backgroundColor: meta.color, opacity: selected ? 1 : 0.65 }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <SeverityBadge severity={alert.severity} />
          <span className="truncate text-[12.5px] font-medium text-bright">{alert.ruleName}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="whitespace-nowrap font-mono text-[10px] text-muted">{timeAgo(alert.lastSeen)}</span>
          <ChevronRight size={13} className="text-muted/50 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
      <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-muted">{alert.description}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {alert.entities.slice(0, 3).map((entity) => (
          <EntityChip key={`${entity.type}-${entity.value}`} entity={entity} />
        ))}
        <span className="ml-auto flex items-center gap-2 whitespace-nowrap">
          <span className="font-mono text-[9.5px] text-muted">{alert.eventCount} events</span>
          <StatusBadge status={alert.status} />
        </span>
      </div>
    </button>
  );
}
