import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Loader2, Search, X } from 'lucide-react';
import type { AlertStatus, Severity } from '@shared/types';
import { SEVERITY_META } from '@shared/types';
import { cn, STATUS_LABEL, STATUS_STYLE } from '@/lib/utils';

// ---------------------------------------------------------------------- panel

interface PanelProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  icon?: ReactNode;
}

export function Panel({ title, subtitle, actions, children, className, bodyClassName, icon }: PanelProps) {
  return (
    <section className={cn('panel flex min-w-0 flex-col', className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-edge/60 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {icon && <span className="text-muted">{icon}</span>}
              <h2 className="truncate text-[13px] font-semibold text-bright">{title}</h2>
            </div>
            {subtitle && <p className="mt-0.5 truncate text-[11px] text-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('min-w-0 flex-1', bodyClassName)}>{children}</div>
    </section>
  );
}

// --------------------------------------------------------------------- button

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'subtle' | 'danger';
type ButtonSize = 'xs' | 'sm' | 'md' | 'icon';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-[#04141a] hover:bg-[#5ce4f7] border border-accent/60 font-semibold',
  outline: 'border border-edge bg-surface-2/60 text-bright hover:border-edge hover:bg-surface-3',
  ghost: 'text-muted hover:bg-surface-3 hover:text-bright border border-transparent',
  subtle: 'bg-surface-3 text-bright hover:bg-[#162234] border border-edge/70',
  danger: 'border border-sev-critical/40 bg-sev-critical/10 text-sev-critical hover:bg-sev-critical/20',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  xs: 'h-7 px-2 text-[11px] gap-1.5 rounded-md',
  sm: 'h-8 px-2.5 text-[12px] gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-[13px] gap-2 rounded-lg',
  icon: 'h-8 w-8 rounded-lg',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export function Button({
  variant = 'outline',
  size = 'sm',
  loading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------- badge

export function SeverityBadge({
  severity,
  className,
  showDot = true,
}: {
  severity: Severity;
  className?: string;
  showDot?: boolean;
}) {
  const meta = SEVERITY_META[severity];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded border px-1.5 py-[2px] text-[9.5px] font-semibold tracking-[0.08em]',
        meta.bg,
        meta.border,
        meta.text,
        className,
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />}
      {meta.label}
    </span>
  );
}

export function SeverityDot({ severity, pulse = false }: { severity: Severity; pulse?: boolean }) {
  const meta = SEVERITY_META[severity];
  return (
    <span className="relative flex h-2 w-2">
      {pulse && <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', meta.dot)} />}
      <span className={cn('relative inline-flex h-2 w-2 rounded-full', meta.dot)} />
    </span>
  );
}

export function StatusBadge({ status, className }: { status: AlertStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-1.5 py-[2px] text-[10px] font-medium',
        STATUS_STYLE[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function CountBadge({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'critical' | 'accent' }) {
  const tones = {
    muted: 'bg-surface-3 text-muted border-edge',
    critical: 'bg-sev-critical/15 text-sev-critical border-sev-critical/30',
    accent: 'bg-accent/10 text-accent border-accent/25',
  };
  return (
    <span className={cn('inline-flex min-w-[20px] items-center justify-center rounded border px-1 py-[1px] font-mono text-[10px]', tones[tone])}>
      {children}
    </span>
  );
}

// -------------------------------------------------------------------- toggle

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-[18px] w-[32px] shrink-0 items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'border-accent/60 bg-accent/80' : 'border-edge bg-surface-3',
      )}
    >
      <span
        className={cn(
          'absolute h-[12px] w-[12px] rounded-full transition-transform',
          checked ? 'translate-x-[16px] bg-[#04141a]' : 'translate-x-[2px] bg-muted',
        )}
      />
    </button>
  );
}

// ------------------------------------------------------------------- controls

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  inputRef,
  onClear,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  onClear?: () => void;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input-base w-full pl-8 pr-8"
        spellCheck={false}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            onClear?.();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:bg-surface-3 hover:text-bright"
          aria-label="Clear search"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <div className={cn('relative', className)}>
      <select
        {...props}
        className="input-base w-full cursor-pointer appearance-none pr-8 text-[12px] focus:border-accent/50"
      >
        {children}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'sm',
}: {
  options: { value: T; label: string; disabled?: boolean }[];
  value: T;
  onChange: (value: T) => void;
  size?: 'xs' | 'sm';
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-edge bg-surface-2/80 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-[6px] font-medium transition-colors disabled:opacity-40',
            size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
            value === option.value
              ? 'bg-surface-3 text-bright shadow-sm ring-1 ring-edge'
              : 'text-muted hover:text-bright',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-edge bg-surface-3 px-1 py-[1px] font-mono text-[9px] text-muted">{children}</kbd>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-3/70', className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon && <div className="mb-1 text-muted/60">{icon}</div>}
      <p className="text-[13px] font-medium text-bright">{title}</p>
      {description && <p className="max-w-sm text-[12px] leading-relaxed text-muted">{description}</p>}
      {action}
    </div>
  );
}

// -------------------------------------------------------------------- drawer

const DrawerContext = createContext<{ close: () => void }>({ close: () => undefined });

export function useDrawer() {
  return useContext(DrawerContext);
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-2xl',
  headerActions,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  width?: string;
  headerActions?: ReactNode;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handler);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <DrawerContext.Provider value={{ close: onClose }}>
      <div className="fixed inset-0 z-50 flex justify-end">
        <button
          type="button"
          aria-label="Close panel"
          onClick={onClose}
          className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-[2px] animate-fade-in"
        />
        <aside
          className={cn(
            'relative flex h-full w-full flex-col border-l border-edge bg-surface shadow-2xl animate-slide-in-right',
            width,
          )}
          role="dialog"
          aria-modal="true"
        >
          <header className="flex items-start justify-between gap-4 border-b border-edge px-5 py-4">
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-bright">{title}</div>
              {subtitle && <div className="mt-0.5 text-[12px] text-muted">{subtitle}</div>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {headerActions}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-edge bg-surface-2 p-1.5 text-muted transition-colors hover:text-bright"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>
          </header>
          <div className="scrollbar-thin flex-1 overflow-y-auto">{children}</div>
        </aside>
      </div>
    </DrawerContext.Provider>,
    document.body,
  );
}

// ---------------------------------------------------------------- sparkline

export function Sparkline({
  data,
  color = '#22d3ee',
  className,
  height = 32,
  width = 120,
  fill = true,
  strokeWidth = 1.5,
}: {
  data: number[];
  color?: string;
  className?: string;
  height?: number;
  width?: number;
  fill?: boolean;
  strokeWidth?: number;
}) {
  const gradientId = useId().replace(/:/g, '');
  if (!data.length) return <div className={cn('h-8 w-full', className)} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((value, index) => {
    const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 3) - 1.5;
    return [x, y] as const;
  });
  const line = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('h-8 w-full', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gradientId})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function ProgressBar({
  value,
  max,
  color = '#22d3ee',
  className,
}: {
  value: number;
  max: number;
  color?: string;
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cn('h-1 w-full overflow-hidden rounded-full bg-surface-3', className)}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ------------------------------------------------------------------ tooltip

export function InfoHint({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-edge text-[8px] font-semibold text-muted"
      title={typeof children === 'string' ? children : undefined}
    >
      i
    </span>
  );
}
