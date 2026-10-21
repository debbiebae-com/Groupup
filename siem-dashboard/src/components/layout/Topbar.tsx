import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Menu,
  Pause,
  Play,
  Search,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import type { SimScenario } from '@shared/types';
import { api } from '@/lib/api';
import { pushToast, useLiveStore } from '@/lib/live';
import { cn } from '@/lib/utils';
import { Button, Kbd, SeverityDot } from '@/components/ui/primitives';

const SCENARIOS: { id: SimScenario; label: string; description: string; severity: 'critical' | 'high' | 'medium' }[] = [
  {
    id: 'brute_force',
    label: 'Brute-force campaign',
    description: 'Failed logins → successful takeover',
    severity: 'high',
  },
  { id: 'port_scan', label: 'External port scan', description: '24 probes across 19 ports', severity: 'medium' },
  { id: 'malware', label: 'Ransomware execution', description: 'EDR encryption + shadow copy deletion', severity: 'critical' },
  { id: 'exfiltration', label: 'Data exfiltration', description: '64 MB to uncategorized host', severity: 'critical' },
  { id: 'c2', label: 'C2 beaconing', description: 'Periodic callbacks from a laptop', severity: 'high' },
  { id: 'cloud_iam', label: 'Cloud IAM abuse', description: 'Admin policy attached to a service account', severity: 'high' },
];

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const navigate = useNavigate();
  const summary = useLiveStore((state) => state.summary);
  const connected = useLiveStore((state) => state.connected);
  const paused = useLiveStore((state) => state.paused);
  const togglePaused = useLiveStore((state) => state.togglePaused);
  const [query, setQuery] = useState('');
  const [simOpen, setSimOpen] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [clock, setClock] = useState(() => new Date());
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setSimOpen(false);
    };
    if (simOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [simOpen]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === '/' && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const submitSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      navigate('/logs');
      return;
    }
    navigate(`/logs?q=${encodeURIComponent(trimmed)}`);
    searchRef.current?.blur();
  };

  const runScenario = async (scenario: SimScenario, label: string) => {
    setRunning(scenario);
    try {
      const result = await api.simulate(scenario);
      pushToast({
        title: `${label} injected`,
        description: `${result.events} events ingested · ${result.alerts.length} detection${
          result.alerts.length === 1 ? '' : 's'
        } raised`,
        severity: 'success',
        href: result.alerts[0] ? `/alerts?alert=${result.alerts[0].id}` : '/alerts',
      });
      setSimOpen(false);
    } catch (error) {
      pushToast({ title: 'Simulation failed', description: (error as Error).message, severity: 'high' });
    } finally {
      setRunning(null);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between gap-3 border-b border-edge/80 bg-base/85 px-4 backdrop-blur-xl sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-lg border border-edge bg-surface-2 p-1.5 text-muted hover:text-bright lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={16} />
        </button>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-edge bg-surface-2 text-accent">
            <ShieldAlert size={13} />
          </span>
          <div className="leading-tight">
            <div className="text-[11.5px] font-semibold text-bright">Global SOC</div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted">af-south-1 · prod</div>
          </div>
        </div>
        <div className="hidden h-5 w-px bg-edge/80 sm:block" />
        <div className="hidden items-baseline gap-1.5 md:flex">
          <span className="font-mono text-[11px] text-muted">UTC</span>
          <span className="font-mono text-[12px] tabular-nums text-bright">{clock.toISOString().slice(11, 19)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden w-56 xl:block">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submitSearch();
              if (event.key === 'Escape') event.currentTarget.blur();
            }}
            placeholder="Search logs, IPs, hosts…"
            className="h-8 w-full rounded-lg border border-edge bg-surface-2/70 pl-8 pr-12 text-[12px] text-bright placeholder:text-muted/60 focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10"
            spellCheck={false}
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
            <Kbd>⌘K</Kbd>
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="xl:hidden"
          onClick={() => navigate('/logs')}
          aria-label="Search logs"
        >
          <Search size={16} />
        </Button>

        <div
          className={cn(
            'hidden items-center gap-2 rounded-lg border px-2.5 py-1.5 sm:flex',
            !connected
              ? 'border-sev-medium/30 bg-sev-medium/10 text-sev-medium'
              : paused
                ? 'border-sev-medium/30 bg-sev-medium/10 text-sev-medium'
                : 'border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-300',
          )}
          title={connected ? 'Live event stream connected' : 'Reconnecting to stream'}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span
              className={cn(
                'absolute inline-flex h-full w-full rounded-full opacity-70',
                connected && !paused ? 'animate-ping bg-emerald-400' : 'bg-current',
              )}
            />
            <span className="relative h-1.5 w-1.5 rounded-full bg-current" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider">
            {!connected ? 'Reconnecting' : paused ? 'Paused' : 'Live'}
          </span>
          <span className="font-mono text-[10px] tabular-nums opacity-80">{summary.eps.toFixed(1)} ev/s</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={togglePaused}
          title={paused ? 'Resume live updates' : 'Pause live updates'}
          aria-label={paused ? 'Resume live updates' : 'Pause live updates'}
        >
          {paused ? <Play size={15} /> : <Pause size={15} />}
        </Button>

        <div className="relative" ref={menuRef}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setSimOpen((value) => !value)}
            className="gap-1.5"
            aria-expanded={simOpen}
          >
            <Zap size={13} />
            <span className="hidden sm:inline">Simulate attack</span>
            <span className="sm:hidden">Simulate</span>
            <ChevronDown size={12} className={cn('transition-transform', simOpen && 'rotate-180')} />
          </Button>
          {simOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[300px] overflow-hidden rounded-xl border border-edge bg-surface-2 shadow-2xl animate-fade-slide">
              <div className="flex items-center gap-2 border-b border-edge/70 px-3 py-2.5">
                <Sparkles size={13} className="text-accent" />
                <div>
                  <div className="text-[11.5px] font-semibold text-bright">Attack simulation</div>
                  <div className="text-[10px] text-muted">Inject realistic telemetry into the pipeline</div>
                </div>
              </div>
              <ul className="p-1.5">
                {SCENARIOS.map((scenario) => (
                  <li key={scenario.id}>
                    <button
                      type="button"
                      disabled={Boolean(running)}
                      onClick={() => runScenario(scenario.id, scenario.label)}
                      className="group flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-3 disabled:opacity-60"
                    >
                      <span className="mt-1">
                        <SeverityDot severity={scenario.severity} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11.5px] font-medium text-bright">{scenario.label}</span>
                        <span className="block truncate text-[10px] text-muted">{scenario.description}</span>
                      </span>
                      {running === scenario.id && (
                        <span className="mt-1 h-2 w-2 animate-spin rounded-full border border-accent border-t-transparent" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-edge/70 px-3 py-2 text-[9.5px] leading-relaxed text-muted">
                Events flow through the same detection engine as live traffic. Alerts appear within seconds.
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate('/alerts')}
          className="relative rounded-lg border border-edge bg-surface-2/60 p-1.5 text-muted transition-colors hover:text-bright"
          aria-label="Open alerts"
        >
          <Bell size={15} />
          {summary.openAlerts > 0 && (
            <span
              className={cn(
                'absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full border px-0.5 font-mono text-[8.5px]',
                summary.criticalAlerts > 0
                  ? 'border-base bg-sev-critical text-[#2a0309]'
                  : 'border-base bg-surface-3 text-bright',
              )}
            >
              {summary.openAlerts > 99 ? '99+' : summary.openAlerts}
            </span>
          )}
        </button>

        <div className="ml-0.5 flex items-center gap-2 border-l border-edge/70 pl-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-accent/30 bg-gradient-to-br from-accent/25 to-blue-500/20 font-mono text-[10px] font-semibold text-accent">
            DM
          </div>
          <div className="hidden leading-tight xl:block">
            <div className="text-[11px] font-medium text-bright">D. Mensah</div>
            <div className="text-[9px] text-muted">SOC Analyst II</div>
          </div>
        </div>
      </div>
    </header>
  );
}
