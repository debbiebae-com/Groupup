import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckCheck,
  ClipboardCheck,
  Copy,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Siren,
  UserRound,
} from 'lucide-react';
import type { Alert, AlertStatus, Severity } from '@shared/types';
import { SEVERITY_META } from '@shared/types';
import { api, useApi } from '@/lib/api';
import { mergeAlerts, pushToast, useLiveStore } from '@/lib/live';
import { cn, fmtDateTime, severitySort, timeAgo } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { AlertRow } from '@/components/common/AlertRow';
import { EntityChip } from '@/components/common/EntityChip';
import {
  Button,
  EmptyState,
  Panel,
  SearchInput,
  Select,
  SeverityBadge,
  Skeleton,
  StatusBadge,
} from '@/components/ui/primitives';

type Tab = AlertStatus | 'all';

const TABS: { value: Tab; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'all', label: 'All' },
];

export function Alerts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('alert');
  const [tab, setTab] = useState<Tab>('all');
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [updating, setUpdating] = useState(false);

  const overrides = useLiveStore((state) => state.alertOverrides);
  const { data, loading, error, refetch } = useApi('alerts', () => api.alerts(), 20_000);
  const meta = useApi('meta', () => api.meta());

  const merged = useMemo(() => mergeAlerts(data ?? [], overrides), [data, overrides]);

  const counts = useMemo(() => {
    const base: Record<Tab, number> = { open: 0, investigating: 0, resolved: 0, all: merged.length };
    for (const alert of merged) base[alert.status] += 1;
    return base;
  }, [merged]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return merged
      .filter((alert) => {
        if (tab !== 'all' && alert.status !== tab) return false;
        if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
        if (q) {
          const haystack = `${alert.id} ${alert.ruleName} ${alert.description} ${alert.entities
            .map((entity) => entity.value)
            .join(' ')}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const rank: Record<AlertStatus, number> = { open: 0, investigating: 1, resolved: 2 };
        if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
        return severitySort(a.severity, b.severity) || b.lastSeen - a.lastSeen;
      });
  }, [merged, tab, severityFilter, query]);

  const selected: Alert | null = useMemo(() => {
    if (selectedId) {
      const match = merged.find((alert) => alert.id === selectedId);
      if (match) return match;
    }
    return filtered[0] ?? null;
  }, [selectedId, merged, filtered]);

  useEffect(() => {
    if (!selectedId) return;
    const match = merged.find((alert) => alert.id === selectedId);
    if (match && tab !== 'all' && match.status !== tab) setTab('all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const selectAlert = (id: string) => {
    setSearchParams({ alert: id }, { replace: true });
  };

  const patchAlert = async (alert: Alert, patch: { status?: AlertStatus; assignee?: string }) => {
    setUpdating(true);
    try {
      const updated = await api.updateAlert(alert.id, patch);
      const label = patch.status
        ? `marked ${patch.status}`
        : `assigned to ${patch.assignee || 'unassigned'}`;
      pushToast({ title: `${updated.id} ${label}`, severity: 'success' });
    } catch (patchError) {
      pushToast({ title: 'Update failed', description: (patchError as Error).message, severity: 'high' });
    } finally {
      setUpdating(false);
    }
  };

  const copyLink = async (alert: Alert) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/alerts?alert=${alert.id}`);
      pushToast({ title: 'Alert link copied', severity: 'success' });
    } catch {
      pushToast({ title: 'Clipboard unavailable', severity: 'medium' });
    }
  };

  return (
    <div className="animate-fade-in space-y-3">
      <PageHeader
        eyebrow="Detect · triage"
        title="Alert queue"
        description="Correlated detections from streaming analytics. Triage, assign, and contain."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => refetch()} loading={loading}>
              <RefreshCw size={12} />
              Refresh
            </Button>
            <Button variant="subtle" size="sm" onClick={() => navigate('/rules')}>
              <ClipboardCheck size={12} />
              Tune detections
            </Button>
          </>
        }
      />

      {error && (
        <div className="rounded-lg border border-sev-critical/30 bg-sev-critical/[0.06] px-3 py-2 text-[11px] text-sev-critical">
          Failed to load alerts: {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <Panel bodyClassName="p-0" className="overflow-hidden">
          <div className="border-b border-edge/60 p-3">
            <div className="mb-2.5 flex flex-wrap items-center gap-1">
              {TABS.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  onClick={() => setTab(entry.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                    tab === entry.value
                      ? 'bg-surface-3 text-bright'
                      : 'text-muted hover:bg-surface-2 hover:text-bright',
                  )}
                >
                  {entry.label}
                  <span
                    className={cn(
                      'rounded px-1 font-mono text-[9px]',
                      tab === entry.value ? 'bg-base/60 text-bright' : 'text-muted/70',
                      entry.value === 'open' && counts.open > 0 && 'text-sev-critical',
                    )}
                  >
                    {counts[entry.value]}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search ID, rule, entity…"
                className="flex-1"
                onClear={() => setQuery('')}
              />
              <Select
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value as Severity | 'all')}
                className="w-[112px]"
                aria-label="Severity filter"
              >
                <option value="all">All severity</option>
                {(Object.keys(SEVERITY_META) as Severity[]).map((severity) => (
                  <option key={severity} value={severity}>
                    {SEVERITY_META[severity].label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="scrollbar-thin max-h-[calc(100vh-268px)] min-h-[420px] overflow-y-auto">
            {loading && !merged.length ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            ) : filtered.length ? (
              filtered.map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  selected={selected?.id === alert.id}
                  onClick={() => selectAlert(alert.id)}
                />
              ))
            ) : (
              <EmptyState
                icon={tab === 'open' ? <ShieldCheck size={24} /> : <Search size={24} />}
                title={tab === 'open' ? 'Queue is clear' : 'No alerts match'}
                description={
                  tab === 'open'
                    ? 'No open detections. New alerts stream in automatically as rules fire.'
                    : 'Adjust the tab, severity filter, or search to broaden the results.'
                }
              />
            )}
          </div>

          <div className="flex items-center justify-between border-t border-edge/60 px-3.5 py-2 text-[9.5px] text-muted">
            <span className="flex items-center gap-1.5">
              <Siren size={10} className={counts.open ? 'text-sev-critical' : 'text-muted'} />
              {counts.open} open · {counts.investigating} investigating
            </span>
            <span className="font-mono">{merged.length} total in queue</span>
          </div>
        </Panel>

        <div className="xl:sticky xl:top-[72px] xl:self-start">
          {selected ? (
            <Panel bodyClassName="p-0" className="overflow-hidden">
              <div className="border-b border-edge/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={selected.severity} />
                    <span className="font-mono text-[10.5px] text-muted">{selected.id}</span>
                    <StatusBadge status={selected.status} />
                  </div>
                  <Button variant="ghost" size="xs" onClick={() => copyLink(selected)}>
                    <Copy size={11} />
                    Link
                  </Button>
                </div>
                <h2 className="mt-2.5 text-[16px] font-semibold leading-snug text-bright">{selected.ruleName}</h2>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{selected.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selected.entities.map((entity) => (
                    <EntityChip
                      key={`${entity.type}-${entity.value}`}
                      entity={entity}
                      onClick={() => navigate(`/logs?q=${encodeURIComponent(entity.value)}`)}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-b border-edge/60 p-4 sm:grid-cols-4">
                <div>
                  <div className="label-caps">First seen</div>
                  <div className="mt-1 text-[11px] text-bright">{timeAgo(selected.firstSeen)}</div>
                  <div className="text-[9px] text-muted/70">{fmtDateTime(selected.firstSeen).slice(0, 17)}</div>
                </div>
                <div>
                  <div className="label-caps">Last seen</div>
                  <div className="mt-1 text-[11px] text-bright">{timeAgo(selected.lastSeen)}</div>
                  <div className="text-[9px] text-muted/70">{fmtDateTime(selected.lastSeen).slice(0, 17)}</div>
                </div>
                <div>
                  <div className="label-caps">Events</div>
                  <div className="mt-1 font-mono text-[12px] text-bright">{selected.eventCount}</div>
                  <div className="text-[9px] text-muted/70">correlated</div>
                </div>
                <div>
                  <div className="label-caps">Assignee</div>
                  <div className="relative mt-1">
                    <UserRound size={10} className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-muted" />
                    <select
                      value={selected.assignee ?? ''}
                      disabled={updating}
                      onChange={(event) => patchAlert(selected, { assignee: event.target.value })}
                      className="w-full cursor-pointer appearance-none bg-transparent pl-3.5 text-[11px] text-bright focus:outline-none"
                    >
                      <option value="" className="bg-surface-2">
                        Unassigned
                      </option>
                      {(meta.data?.analysts ?? []).map((analyst) => (
                        <option key={analyst} value={analyst} className="bg-surface-2">
                          {analyst}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-[9px] text-muted/70">SOC-1</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge/60 bg-surface-2/40 px-4 py-2.5">
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="rounded border border-accent/25 bg-accent/10 px-1.5 py-0.5 font-mono text-[9.5px] text-accent">
                    {selected.mitre.id}
                  </span>
                  <span className="text-muted">{selected.mitre.tactic}</span>
                  <span className="text-muted/40">/</span>
                  <span className="truncate text-bright">{selected.mitre.technique}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {selected.status === 'open' && (
                    <>
                      <Button
                        variant="primary"
                        size="xs"
                        disabled={updating}
                        onClick={() => patchAlert(selected, { status: 'investigating' })}
                      >
                        <Search size={11} />
                        Investigate
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        disabled={updating}
                        onClick={() => patchAlert(selected, { status: 'resolved' })}
                      >
                        <CheckCheck size={11} />
                        Resolve
                      </Button>
                    </>
                  )}
                  {selected.status === 'investigating' && (
                    <Button
                      variant="subtle"
                      size="xs"
                      disabled={updating}
                      onClick={() => patchAlert(selected, { status: 'resolved' })}
                    >
                      <CheckCheck size={11} />
                      Resolve
                    </Button>
                  )}
                  {selected.status === 'resolved' && (
                    <Button
                      variant="outline"
                      size="xs"
                      disabled={updating}
                      onClick={() => patchAlert(selected, { status: 'open' })}
                    >
                      <RotateCcw size={11} />
                      Reopen
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => navigate(`/logs?q=${encodeURIComponent(selected.entities[0]?.value ?? selected.id)}`)}
                  >
                    Logs
                    <ArrowUpRight size={11} />
                  </Button>
                </div>
              </div>

              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="label-caps">Investigation timeline</span>
                  <span className="font-mono text-[9px] text-muted/70">{selected.timeline.length} events</span>
                </div>
                <ol className="relative ml-1 space-y-3.5 border-l border-edge/70 pl-4">
                  {selected.timeline.map((item, index) => (
                    <li key={`${item.ts}-${index}`} className="relative">
                      <span
                        className="absolute -left-[21.5px] top-1 h-[7px] w-[7px] rounded-full ring-2 ring-surface"
                        style={{ backgroundColor: SEVERITY_META[item.severity].color }}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <SeverityBadge severity={item.severity} />
                        <span className="font-mono text-[9px] text-muted/70">{timeAgo(item.ts)}</span>
                      </div>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-bright/90">{item.message}</p>
                      <span className="mt-0.5 block font-mono text-[9px] text-muted/60">{item.sourceId}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </Panel>
          ) : (
            <Panel bodyClassName="p-6">
              <EmptyState
                icon={<Siren size={24} />}
                title="Select an alert"
                description="Pick an item from the queue to review its entities, ATT&CK mapping, and correlated timeline."
              />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
