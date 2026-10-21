import { Boxes, Globe2, Server, UserRound } from 'lucide-react';
import type { AlertEntity } from '@shared/types';
import { cn } from '@/lib/utils';

const ICONS = {
  ip: Globe2,
  user: UserRound,
  host: Server,
  service: Boxes,
} as const;

export function EntityChip({
  entity,
  onClick,
  className,
}: {
  entity: AlertEntity;
  onClick?: () => void;
  className?: string;
}) {
  const Icon = ICONS[entity.type];
  const label = entity.type === 'ip' ? entity.value : `${entity.type}: ${entity.value}`;
  const content = (
    <>
      <Icon size={10} className="shrink-0 text-muted" />
      <span className={cn('truncate', entity.type === 'ip' && 'font-mono')}>{label}</span>
      {entity.country && <span className="shrink-0 text-[9px] text-muted/70">{entity.country}</span>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex max-w-full items-center gap-1 rounded border border-edge bg-surface-2/70 px-1.5 py-[2px] text-[10px] text-bright transition-colors hover:border-accent/30 hover:text-accent',
          className,
        )}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded border border-edge bg-surface-2/70 px-1.5 py-[2px] text-[10px] text-bright',
        className,
      )}
    >
      {content}
    </span>
  );
}
