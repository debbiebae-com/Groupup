import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
import type { Severity } from '@shared/types';
import { SEVERITY_META } from '@shared/types';
import { useToastStore } from '@/lib/live';
import { cn } from '@/lib/utils';

const SEVERITY_ICON: Record<Severity | 'success', typeof Info> = {
  critical: CircleAlert,
  high: AlertTriangle,
  medium: AlertTriangle,
  low: Info,
  info: Info,
  success: CheckCircle2,
};

const SEVERITY_ACCENT: Record<Severity | 'success', string> = {
  critical: 'border-l-sev-critical',
  high: 'border-l-sev-high',
  medium: 'border-l-sev-medium',
  low: 'border-l-sev-low',
  info: 'border-l-sev-info',
  success: 'border-l-emerald-400',
};

function ToastItem({
  id,
  title,
  description,
  severity,
  href,
}: {
  id: number;
  title: string;
  description?: string;
  severity: Severity | 'success';
  href?: string;
}) {
  const dismiss = useToastStore((state) => state.dismiss);
  const Icon = SEVERITY_ICON[severity];
  const color = severity === 'success' ? '#34d399' : SEVERITY_META[severity].color;

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(id), severity === 'critical' ? 9000 : 6000);
    return () => window.clearTimeout(timer);
  }, [dismiss, id, severity]);

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-[340px] items-start gap-2.5 rounded-lg border border-edge border-l-2 bg-surface-2/95 p-3 shadow-2xl backdrop-blur-md animate-fade-slide',
        SEVERITY_ACCENT[severity],
      )}
    >
      <Icon size={15} className="mt-0.5 shrink-0" style={{ color }} />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium leading-snug text-bright">{title}</p>
        {description && <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">{description}</p>}
        {href && (
          <Link
            to={href}
            onClick={() => dismiss(id)}
            className="mt-1.5 inline-block text-[11px] font-medium text-accent hover:underline"
          >
            Investigate →
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(id)}
        className="rounded p-0.5 text-muted transition-colors hover:text-bright"
        aria-label="Dismiss notification"
      >
        <X size={12} />
      </button>
    </div>
  );
}

export function Toasts() {
  const toasts = useToastStore((state) => state.toasts);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}
