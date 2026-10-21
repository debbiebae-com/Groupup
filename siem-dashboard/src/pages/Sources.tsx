import { useMemo } from 'react';
import {
  Cloud,
  Database,
  Globe2,
  KeyRound,
  Laptop,
  Network,
  RefreshCw,
  ShieldCheck,
  Signal,
  TriangleAlert,
} from 'lucide-react';
import type { SourceHealth, SourceKind, SourceStatus } from '@shared/types';
import { SOURCE_KIND_LABEL } from '@shared/types';
import { api, useApi } from '@/lib/api';
import { useLiveStore } from '@/lib/live';
import { cn, fmtCompact, fmtNumber, timeAgo } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Button, EmptyState, Panel, ProgressBar, Skeleton, Sparkline } from '@/components/ui/primitives';

const KIND_ICON: Record<SourceKind, typeof Database> = {
  firewall: Network,
  endpoint: Laptop,
  identity: KeyRound,
  cloud: Cloud,
  dns: Globe2,
  proxy: ShieldCheck,
};

const KIND_COLOR: Record<SourceKind, string> = {
  firewall: '#f97316',
  endpoint: '#22d3ee',
  identity: '#a78bfa',
  cloud: '#38bdf8',
  dns: '#34d399',
  proxy: '#f5c451',
};

const FEED_STATUS: Record<SourceStatus, { label: string; dot: string; pill: string; color: string }> = {
  healthy: {
    label: 'Healthy',
    dot: 'bg-emerald-400',
    pill: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
    color: '#34d399',
  },
  degraded: {
    label: 'Degraded',
    dot: 'bg-sev-medium',
    pill: 'border-sev-medium/30 bg-sev-medium/10 text-sev-medium',
    color: '#f5c451',
  },
  offline: {
    label: 'Offline',
    dot: 'bg-sev-critical',
    pill: 'border-sev-critical/30 bg-sev-critical/10 text-sev-critical',
    color: '#fb5f76',
  },
};

function SourceCard({ source }: { source: SourceHealth }) {
  const Icon = KIND_ICON[source.kind];
  const status = FEED_STATUS[source.status];
  const color = KIND_COLOR[source.kind];

  return (
    <div
      className={cn(
        'panel flex flex-col p-4 transition-colors',
        source.status === 'offline' ? 'opacity-70' : 'hover:border-edge',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
            style={{ borderColor: `${color}44`, backgroundColor: `${color}14`, color }}
          >
            <Icon size={15} />
          </div>
          <div className="min-w-0">
            <div className="truncate font-mono text-[12px] font-medium text-bright">{source.name}</div>
            <div className="truncate text-[9.5px] text-muted">{SOURCE_KIND_LABEL[source.kind]}</div>
          </div>
        </div>
        <span className={cn('inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-[2px] text-[9px]', status.pill)}>
          <span className={cn('h-1 w-1 rounded-full', status.dot)} />
          {status.label}
        </span>
      </div>

      <div className="mt-2 truncate text-[10px] text-muted/80">{source.vendor}</div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-y border-edge/50 py-2.5">
        <div>
          <div className="text-[8.5px] uppercase tracking-[0.12em] text-muted/70">EPS</div>
          <div className="mt-0.5 font-mono text-[12px] text-bright">
            {source.status === 'offline' ? '0.0' : source.eventsPerSec.toFixed(1)}
          </div>
        </div>
        <div>
          <div className="text-[8.5px] uppercase tracking-[0.12em] text-muted/70">24h events</div>
          <div className="mt-0.5 font-mono text-[12px] text-bright">
            {source.events24h ? fmtCompact(source.events24h) : '—'}
          </div>
        </div>
        <div>
          <div className="text-[8.5px] uppercase tracking-[0.12em] text-muted/70">Error rate</div>
          <div
            className={cn(
              'mt-0.5 font-mono text-[12px]',
              source.errorRatePct > 1 ? 'text-sev-medium' : source.errorRatePct > 2 ? 'text-sev-critical' : 'text-bright',
            )}
          >
            {source.errorRatePct ? `${source.errorRatePct.toFixed(2)}%` : '—'}
          </div>
        </div>
      </div>

      <div className="mt-2">
        <Sparkline data={source.history} color={status.color} className="h-8" fill />
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[9px] text-muted/70">
        <span className="flex items-center gap-1">
          <Signal size={9} />
          {source.status === 'offline' ? 'No heartbeat' : `Last event ${timeAgo(source.lastEventTs)}`}
        </span>
        <span className="font-mono">{source.id}</span>
      </div>
    </div>
  );
}

function Metric({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: 'bad' | 'good' }) {
  return (
    <div className="px-4 py-3">
      <div className="label-caps">{label}</div>
      <div
        className={cn(
          'mt-1 font-mono text-[19px] font-semibold leading-none',
          tone === 'bad' ? 'text-sev-critical' : tone === 'good' ? 'text-emerald-300' : 'text-bright',
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-[9.5px] text-muted/70">{hint}</div>
    </div>
  );
}

export function Sources() {
  const liveSources = useLiveStore((state) => state.sources);
  const { data, loading, error, refetch } = useApi('sources', () => api.sources(), 20_000);
  const sources = liveSources.length ? liveSources : (data ?? []);

  const stats = useMemo(() => {
    const online = sources.filter((source) => source.status !== 'offline').length;
    const eps = sources.reduce((sum, source) => sum + source.eventsPerSec, 0);
    const events24h = sources.reduce((sum, source) => sum + source.events24h, 0);
    const worstError = sources.reduce((max, source) => Math.max(max, source.errorRatePct), 0);
    return { online, eps, events24h, worstError };
  }, [sources]);

  const maxEps = Math.max(0.001, ...sources.map((source) => source.eventsPerSec));
  const sorted = [...sources].sort((a, b) => b.eventsPerSec - a.eventsPerSec);
  const offline = sources.filter((source) => source.status === 'offline');
  const degraded = sources.filter((source) => source.status === 'degraded');

  return (
    <div className="animate-fade-in space-y-3">
      <PageHeader
        eyebrow="Monitor · collectors"
        title="Data sources"
        description="Collector health, ingest throughput, and parser diagnostics across the telemetry fabric."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} loading={loading}>
            <RefreshCw size={12} />
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="rounded-lg border border-sev-critical/30 bg-sev-critical/[0.06] px-3 py-2 text-[11px] text-sev-critical">
          Failed to load sources: {error}
        </div>
      )}

      <Panel bodyClassName="p-0">
        <div className="grid grid-cols-2 divide-x divide-edge/60 md:grid-cols-4">
          <Metric
            label="Feeds online"
            value={`${stats.online}/${sources.length}`}
            hint={offline.length ? `${offline.length} collector offline` : 'all collectors reporting'}
            tone={offline.length ? 'bad' : 'good'}
          />
          <Metric label="Aggregate rate" value={`${stats.eps.toFixed(1)} eps`} hint="normalized across sensors" />
          <Metric label="Events · 24h" value={fmtCompact(stats.events24h)} hint={`${fmtNumber(stats.events24h)} raw events`} />
          <Metric
            label="Worst error rate"
            value={`${stats.worstError.toFixed(2)}%`}
            hint={degraded.length ? `${degraded.length} degraded parser` : 'within tolerance'}
            tone={stats.worstError > 1 ? 'bad' : 'good'}
          />
        </div>
      </Panel>

      {loading && !sources.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[214px] w-full" />
          ))}
        </div>
      ) : sources.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sources.map((source) => (
            <SourceCard key={source.id} source={source} />
          ))}
        </div>
      ) : (
        <Panel bodyClassName="p-6">
          <EmptyState icon={<Database size={22} />} title="No collectors configured" description="Add an ingest source to begin receiving telemetry." />
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Panel title="Ingest distribution" subtitle="Share of normalized event rate per collector" icon={<Signal size={13} />} bodyClassName="p-4">
            <ul className="space-y-2.5">
              {sorted.map((source) => {
                const color = KIND_COLOR[source.kind];
                return (
                  <li key={source.id} className="flex items-center gap-3">
                    <span className="w-[128px] shrink-0 truncate font-mono text-[10px] text-bright/85">{source.name}</span>
                    <ProgressBar value={source.eventsPerSec} max={maxEps} color={color} className="h-1.5 flex-1" />
                    <span className="w-[58px] shrink-0 text-right font-mono text-[10px] tabular-nums text-muted">
                      {source.eventsPerSec.toFixed(2)}
                    </span>
                    <span className="hidden w-[60px] shrink-0 text-right text-[9px] text-muted/60 sm:block">
                      {stats.eps > 0 ? `${((source.eventsPerSec / stats.eps) * 100).toFixed(1)}%` : '0%'}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 border-t border-edge/40 pt-2 text-[9px] text-muted/60">
              Rates sampled over the last 10 seconds · stream normalized to ECS
            </p>
          </Panel>
        </div>

        <div className="xl:col-span-5">
          <Panel title="Pipeline diagnostics" subtitle="Collector and parser checks" icon={<ShieldCheck size={13} />} bodyClassName="p-4">
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <div>
                  <div className="text-[11px] text-bright">TLS certificate chain</div>
                  <div className="text-[9.5px] text-muted">204 / 204 collectors valid · next rotation in 41d</div>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <div>
                  <div className="text-[11px] text-bright">Clock synchronization</div>
                  <div className="text-[9.5px] text-muted">NTP skew +2 ms across the fleet</div>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <div>
                  <div className="text-[11px] text-bright">Parser pack</div>
                  <div className="text-[9.5px] text-muted">v4.8.1 deployed · 0 schema rejections</div>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sev-medium" />
                <div>
                  <div className="text-[11px] text-bright">DNS enrich buffer</div>
                  <div className="text-[9.5px] text-muted">
                    {degraded.length ? `${degraded.map((source) => source.name).join(', ')} at 71% capacity` : 'Buffers within capacity'}
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', offline.length ? 'bg-sev-critical' : 'bg-emerald-400')} />
                <div>
                  <div className="text-[11px] text-bright">Legacy VPN collector</div>
                  <div className="text-[9.5px] text-muted">
                    {offline.length
                      ? `${offline.map((source) => source.name).join(', ')} · no heartbeat for ${timeAgo(offline[0].lastEventTs).replace(' ago', '')}`
                      : 'All collectors heartbeating'}
                  </div>
                </div>
              </li>
            </ul>

            <div className="mt-4 flex gap-2 rounded-lg border border-edge/60 bg-surface-2/50 p-2.5">
              <TriangleAlert size={13} className="mt-0.5 shrink-0 text-sev-medium" />
              <p className="text-[9.5px] leading-relaxed text-muted">
                This environment uses a synthetic telemetry generator. No external networks are contacted; all events are produced by the
                local simulation engine and flow through the real detection pipeline.
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
