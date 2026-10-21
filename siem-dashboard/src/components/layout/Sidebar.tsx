import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  Database,
  Gauge,
  LayoutDashboard,
  Radar,
  ScrollText,
  ShieldCheck,
  Siren,
  X,
} from 'lucide-react';
import { useLiveStore } from '@/lib/live';
import { cn } from '@/lib/utils';
import { Sparkline } from '@/components/ui/primitives';

const NAV_SECTIONS = [
  {
    label: 'Monitor',
    items: [
      { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/logs', label: 'Log explorer', icon: ScrollText },
      { to: '/alerts', label: 'Alerts', icon: Siren, badge: 'alerts' as const },
      { to: '/sources', label: 'Data sources', icon: Database },
    ],
  },
  {
    label: 'Detect',
    items: [{ to: '/rules', label: 'Detection rules', icon: Radar }],
  },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const summary = useLiveStore((state) => state.summary);
  const sources = useLiveStore((state) => state.sources);
  const connected = useLiveStore((state) => state.connected);
  const [samples, setSamples] = useState<number[]>(Array.from({ length: 24 }, () => 40 + Math.random() * 20));
  const location = useLocation();

  useEffect(() => {
    setSamples((current) => [...current.slice(-23), summary.eps * 10 + Math.random() * 8]);
  }, [summary.eps]);

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const offline = sources.filter((source) => source.status === 'offline').length;
  const feedTotal = sources.length || 8;

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[232px] flex-col border-r border-edge/80 bg-[#070b12]/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-[60px] items-center justify-between border-b border-edge/70 px-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent shadow-glow">
              <ShieldCheck size={17} />
            </div>
            <div>
              <div className="text-[13px] font-semibold leading-none tracking-[0.2em] text-bright">AEGIS</div>
              <div className="mt-1 text-[8.5px] uppercase leading-none tracking-[0.18em] text-muted">Security Operations</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted hover:text-bright lg:hidden"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        <div className="border-b border-edge/70 px-4 py-3">
          <div className="flex items-center justify-between rounded-lg border border-edge/70 bg-surface-2/60 px-2.5 py-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className={cn(
                    'absolute inline-flex h-full w-full rounded-full opacity-70',
                    connected ? 'animate-ping bg-emerald-400' : 'bg-sev-medium',
                  )}
                />
                <span className={cn('relative h-1.5 w-1.5 rounded-full', connected ? 'bg-emerald-400' : 'bg-sev-medium')} />
              </span>
              <span className="text-[10.5px] font-medium text-bright">{connected ? 'Real-time stream' : 'Reconnecting…'}</span>
            </div>
            <span className="font-mono text-[10px] text-accent">{summary.eps.toFixed(1)} eps</span>
          </div>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto px-2.5 py-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="mb-4">
              <div className="px-2.5 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted/70">
                {section.label}
              </div>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={'end' in item ? item.end : undefined}
                        className={({ isActive }) =>
                          cn(
                            'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium transition-colors',
                            isActive
                              ? 'bg-surface-3/80 text-bright'
                              : 'text-muted hover:bg-surface-2/80 hover:text-bright',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span className="absolute inset-y-1.5 left-0 w-[2px] rounded-full bg-accent shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                            )}
                            <Icon
                              size={15}
                              className={cn('shrink-0 transition-colors', isActive ? 'text-accent' : 'text-muted/80 group-hover:text-bright')}
                            />
                            <span className="flex-1 truncate">{item.label}</span>
                            {'badge' in item && item.badge === 'alerts' && summary.openAlerts > 0 && (
                              <span
                                className={cn(
                                  'inline-flex min-w-[18px] items-center justify-center rounded-full px-1 py-[1px] font-mono text-[9.5px]',
                                  summary.criticalAlerts > 0
                                    ? 'bg-sev-critical/15 text-sev-critical'
                                    : 'bg-surface-3 text-muted',
                                )}
                              >
                                {summary.openAlerts}
                              </span>
                            )}
                            {item.to === '/sources' && (
                              <span className="font-mono text-[9.5px] text-muted">
                                {feedTotal - offline}/{feedTotal}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className="px-2.5">
            <div className="label-caps mb-2">Environment</div>
            <div className="space-y-1.5 rounded-lg border border-edge/60 bg-surface-2/40 p-2.5">
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-muted">Region</span>
                <span className="font-mono text-bright">af-south-1</span>
              </div>
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-muted">Shift</span>
                <span className="text-bright">SOC-1 · Day</span>
              </div>
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-muted">Retention</span>
                <span className="font-mono text-bright">90d</span>
              </div>
            </div>
          </div>
        </nav>

        <div className="mx-2.5 mb-2.5 rounded-lg border border-edge/70 bg-surface-2/50 p-2.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted">
              <Activity size={11} className="text-accent" />
              Ingest pulse
            </span>
            <span className="font-mono text-[10px] text-emerald-300">healthy</span>
          </div>
          <Sparkline data={samples} className="mt-1.5 h-7" color="#22d3ee" />
          <div className="mt-1 flex items-center justify-between text-[9px] text-muted">
            <span>v4.8.1</span>
            <span className="flex items-center gap-1">
              <Gauge size={9} /> p95 412ms
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
