import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowDownToLine,
  ArrowRight,
  ChevronDown,
  FileSearch,
  Pause,
  Play,
  RefreshCw,
  SearchX,
} from 'lucide-react';
import type { LogEvent, Severity, SourceKind } from '@shared/types';
import { SEVERITY_META, SEVERITY_ORDER, SOURCE_KIND_LABEL } from '@shared/types';
import { api, exportLogs, useApi } from '@/lib/api';
import { useLiveStore } from '@/lib/live';
import { cn, classForOutcome, fmtClock, fmtDateTime, fmtNumber, timeAgo } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Button, EmptyState, Panel, SearchInput, Select, SeverityBadge, Skeleton } from '@/components/ui/primitives';
import { LogDetailDrawer } from '@/components/logs/LogDetailDrawer';

const PAGE_SIZE = 100;
const LIVE_CAP = 500;

const WINDOWS = [
  { value: 15, label: 'Last 15 minutes' },
  { value: 30, label: 'Last 30 minutes' },
  { value: 60, label: 'Last 60 minutes' },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${escapeRegExp(query.trim())})`, 'ig');
  const parts = text.split(regex);
  const needle = query.trim().toLowerCase();
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === needle ? (
          <mark key={index} className="rounded-sm bg-accent/20 px-0.5 text-accent">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function matchFilters(
  event: LogEvent,
  query: string,
  severity: Severity[],
  source: SourceKind | 'all',
  windowMinutes: number,
): boolean {
  if (Date.now() - event.ts > windowMinutes * 60_000 + 5_000) return false;
  if (severity.length && !severity.includes(event.severity)) return false;
  if (source !== 'all' && event.sourceKind !== source) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${event.message} ${event.srcIp ?? ''} ${event.dstIp ?? ''} ${event.host ?? ''} ${event.user ?? ''} ${event.eventType} ${event.sourceId}`.toLowerCase();
  return haystack.includes(q);
}

export function Logs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(urlQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(urlQuery);
  const [severity, setSeverity] = useState<Severity[]>([]);
  const [sourceKind, setSourceKind] = useState<SourceKind | 'all'>('all');
  const [windowMinutes, setWindowMinutes] = useState(15);
  const [selected, setSelected] = useState<LogEvent | null>(null);
  const [rows, setRows] = useState<LogEvent[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [total, setTotal] = useState(0);
  const [bufferStart, setBufferStart] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const flashTimer = useRef<number | undefined>(undefined);

  const paused = useLiveStore((state) => state.paused);
  const togglePaused = useLiveStore((state) => state.togglePaused);
  const connected = useLiveStore((state) => state.connected);
  const liveLogs = useLiveStore((state) => state.logs);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 320);
    return () => window.clearTimeout(timer);
  }, [query]);

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        q: debouncedQuery,
        severity: [...severity].sort(),
        source: sourceKind,
        minutes: windowMinutes,
      }),
    [debouncedQuery, severity, sourceKind, windowMinutes],
  );

  const { data, loading, error, refetch } = useApi(
    `logs:${queryKey}`,
    () =>
      api.logs({
        q: debouncedQuery || undefined,
        severity,
        source: sourceKind === 'all' ? undefined : [sourceKind],
        minutes: windowMinutes,
        limit: PAGE_SIZE,
      }),
    0,
  );

  useEffect(() => {
    if (!data) return;
    setRows(data.events);
    setCursor(data.nextCursor);
    setTotal(data.total);
    setBufferStart(data.bufferStart);
  }, [data]);

  useEffect(() => {
    if (paused || liveLogs.length === 0) return;
    const matching = liveLogs
      .filter((event) => matchFilters(event, debouncedQuery, severity, sourceKind, windowMinutes))
      .slice(0, 60);
    if (!matching.length) return;

    setRows((current) => {
      const existing = new Set(current.map((event) => event.id));
      const fresh = matching.filter((event) => !existing.has(event.id));
      if (!fresh.length) return current;
      return [...fresh, ...current].slice(0, LIVE_CAP);
    });
    setTotal((current) => current + matching.length);
    setFlashIds((current) => {
      const next = new Set(current);
      matching.forEach((event) => next.add(event.id));
      return next;
    });
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashIds(new Set()), 1600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveLogs, paused]);

  const toggleSeverity = (value: Severity) => {
    setSeverity((current) =>
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value],
    );
  };

  const resetFilters = () => {
    setQuery('');
    setSeverity([]);
    setSourceKind('all');
    setWindowMinutes(15);
    if (urlQuery) setSearchParams({}, { replace: true });
  };

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const result = await api.logs({
        q: debouncedQuery || undefined,
        severity,
        source: sourceKind === 'all' ? undefined : [sourceKind],
        minutes: windowMinutes,
        limit: PAGE_SIZE,
        cursor,
      });
      setRows((current) => {
        const existing = new Set(current.map((event) => event.id));
        return [...current, ...result.events.filter((event) => !existing.has(event.id))];
      });
      setCursor(result.nextCursor);
      setTotal(result.total);
    } finally {
      setLoadingMore(false);
    }
  };

  const activeFilters = severity.length > 0 || sourceKind !== 'all' || query.trim().length > 0;

  return (
    <div className="animate-fade-in space-y-3">
      <PageHeader
        eyebrow="Monitor · telemetry"
        title="Log explorer"
        description="Query normalized events across every sensor. The stream buffer holds the last 60 minutes of telemetry."
        actions={
          <>
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider',
                paused
                  ? 'border-sev-medium/30 bg-sev-medium/10 text-sev-medium'
                  : 'border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-300',
              )}
            >
              <span className="flex h-1.5 w-1.5">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    paused ? 'bg-sev-medium' : connected ? 'animate-pulse bg-emerald-400' : 'bg-sev-medium',
                  )}
                />
              </span>
              {paused ? 'Paused' : connected ? 'Live tail' : 'Reconnecting'}
            </div>
            <Button variant="outline" size="sm" onClick={togglePaused}>
              {paused ? <Play size={12} /> : <Pause size={12} />}
              {paused ? 'Resume' : 'Pause'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              loading={loading}
              onClick={() => refetch()}
              title="Refresh results"
            >
              <RefreshCw size={12} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="subtle"
              size="sm"
              onClick={() =>
                exportLogs({
                  q: debouncedQuery || undefined,
                  severity,
                  source: sourceKind === 'all' ? undefined : [sourceKind],
                  minutes: windowMinutes,
                })
              }
            >
              <ArrowDownToLine size={12} />
              <span className="hidden sm:inline">Export</span> CSV
            </Button>
          </>
        }
      />

      <Panel bodyClassName="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search messages, IPs, hosts, users… ( / )"
            className="w-full sm:w-[300px]"
            onClear={() => setQuery('')}
          />
          <div className="flex flex-wrap items-center gap-1">
            {SEVERITY_ORDER.map((value) => {
              const meta = SEVERITY_META[value];
              const active = severity.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleSeverity(value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium capitalize transition-colors',
                    active ? 'text-bright' : 'border-edge bg-surface-2/40 text-muted hover:text-bright',
                  )}
                  style={
                    active
                      ? { borderColor: `${meta.color}66`, backgroundColor: `${meta.color}18`, color: meta.color }
                      : undefined
                  }
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                  {value}
                </button>
              );
            })}
          </div>
          <div className="hidden h-5 w-px bg-edge/70 sm:block" />
          <Select
            value={sourceKind}
            onChange={(event) => setSourceKind(event.target.value as SourceKind | 'all')}
            aria-label="Source filter"
            className="w-[150px]"
          >
            <option value="all">All sources</option>
            {(Object.keys(SOURCE_KIND_LABEL) as SourceKind[]).map((kind) => (
              <option key={kind} value={kind}>
                {SOURCE_KIND_LABEL[kind]}
              </option>
            ))}
          </Select>
          <Select
            value={windowMinutes}
            onChange={(event) => setWindowMinutes(Number(event.target.value))}
            aria-label="Time window"
            className="w-[148px]"
          >
            {WINDOWS.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </Select>
          {activeFilters && (
            <Button variant="ghost" size="xs" onClick={resetFilters} className="ml-auto">
              Clear filters
            </Button>
          )}
        </div>
      </Panel>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-sev-critical/30 bg-sev-critical/[0.06] px-3 py-2 text-[11px] text-sev-critical">
          <span>Query failed: {error}</span>
          <Button variant="ghost" size="xs" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      <Panel bodyClassName="p-0" className="overflow-hidden">
        <div className="scrollbar-thin max-h-[calc(100vh-330px)] min-h-[380px] overflow-auto">
          <table className="w-full min-w-[860px] table-fixed border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[#0a0f18]/95 backdrop-blur">
              <tr className="border-b border-edge text-[9px] uppercase tracking-[0.14em] text-muted">
                <th className="w-[92px] px-3 py-2.5 font-medium">Time</th>
                <th className="w-[86px] px-2 py-2.5 font-medium">Severity</th>
                <th className="px-2 py-2.5 font-medium">Event</th>
                <th className="w-[130px] px-2 py-2.5 font-medium">Source</th>
                <th className="hidden w-[150px] px-2 py-2.5 font-medium lg:table-cell">Principal</th>
                <th className="hidden w-[168px] px-2 py-2.5 font-medium xl:table-cell">Network</th>
                <th className="w-[84px] px-3 py-2.5 font-medium">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {loading && !rows.length
                ? Array.from({ length: 10 }).map((_, index) => (
                    <tr key={index} className="border-b border-edge/40">
                      <td colSpan={7} className="px-3 py-2.5">
                        <Skeleton className="h-7 w-full" />
                      </td>
                    </tr>
                  ))
                : rows.map((event) => (
                    <tr
                      key={event.id}
                      tabIndex={0}
                      onClick={() => setSelected(event)}
                      onKeyDown={(keyEvent) => {
                        if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                          keyEvent.preventDefault();
                          setSelected(event);
                        }
                      }}
                      className={cn(
                        'table-row group cursor-pointer outline-none',
                        flashIds.has(event.id) && 'animate-row-flash',
                      )}
                    >
                      <td className="px-3 py-2 align-top" title={fmtDateTime(event.ts)}>
                        <span className="font-mono text-[10.5px] tabular-nums text-muted">{fmtClock(event.ts)}</span>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <SeverityBadge severity={event.severity} />
                      </td>
                      <td className="min-w-0 px-2 py-2 align-top">
                        <div className="truncate text-[11.5px] leading-snug text-bright/90 group-hover:text-bright">
                          <Highlight text={event.message} query={debouncedQuery} />
                        </div>
                        <div className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-wide text-muted/70">
                          {event.eventType}
                        </div>
                      </td>
                      <td className="px-2 py-2 align-top">
                        <div className="truncate font-mono text-[10px] text-bright/80">{event.sourceId}</div>
                        <div className="mt-0.5 text-[9px] text-muted/70">{SOURCE_KIND_LABEL[event.sourceKind]}</div>
                      </td>
                      <td className="hidden px-2 py-2 align-top lg:table-cell">
                        <div className="truncate font-mono text-[10px] text-bright/80">{event.user ?? '—'}</div>
                        <div className="mt-0.5 truncate font-mono text-[9px] text-muted/70">{event.host ?? '—'}</div>
                      </td>
                      <td className="hidden px-2 py-2 align-top xl:table-cell">
                        <div className="flex items-center gap-1 font-mono text-[9.5px] text-muted">
                          <span className="truncate text-bright/70">{event.srcIp ?? '—'}</span>
                          <ArrowRight size={9} className="shrink-0 text-muted/50" />
                          <span className="truncate text-bright/70">{event.dstIp ?? '—'}</span>
                        </div>
                        <div className="mt-0.5 truncate text-[9px] text-muted/70">
                          {event.dstPort ? `:${event.dstPort}` : ''} {event.country ?? ''}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span className={cn('flex items-center gap-1.5 text-[10px] capitalize', classForOutcome(event.outcome))}>
                          <span className="h-1 w-1 rounded-full bg-current" />
                          {event.outcome}
                        </span>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {!loading && !rows.length && (
            <EmptyState
              icon={<SearchX size={24} />}
              title="No events matched this query"
              description="Try widening the time window, clearing severity filters, or searching for a different host, user, or IP address."
              action={
                <Button variant="outline" size="sm" onClick={resetFilters} className="mt-2">
                  Reset filters
                </Button>
              }
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge/70 px-3.5 py-2.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted">
            <span className="flex items-center gap-1.5">
              <FileSearch size={11} />
              <span className="font-mono text-bright">{fmtNumber(rows.length)}</span> shown
              {total > rows.length && (
                <>
                  <span className="text-muted/50">/</span>
                  <span className="font-mono">{fmtNumber(total)}</span> matched
                </>
              )}
            </span>
            <span className="hidden text-muted/40 sm:inline">·</span>
            <span className="hidden sm:inline">
              Buffer start {bufferStart ? timeAgo(bufferStart) : '—'} · {LIVE_CAP} event client cap
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!paused && connected && (
              <span className="flex items-center gap-1 text-[9.5px] uppercase tracking-wider text-emerald-300/80">
                <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                streaming
              </span>
            )}
            <Button
              variant="outline"
              size="xs"
              onClick={loadMore}
              disabled={!cursor}
              loading={loadingMore}
            >
              <ChevronDown size={12} />
              Load 100 more
            </Button>
          </div>
        </div>
      </Panel>

      <LogDetailDrawer event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
