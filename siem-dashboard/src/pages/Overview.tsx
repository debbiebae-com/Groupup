import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowUpRight, Database, RefreshCw, ShieldAlert, Siren, Timer } from 'lucide-react';
import type { TimeRange } from '@shared/types';
import { RANGE_META } from '@shared/types';
import { api, useApi } from '@/lib/api';
import { mergeAlerts, useLiveStore } from '@/lib/live';
import { fmtCompact, fmtDuration, fmtNumber, severitySort } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { AlertRow } from '@/components/common/AlertRow';
import { Button, EmptyState, Panel, Segmented, Skeleton } from '@/components/ui/primitives';
import { TrafficChart } from '@/components/charts/TrafficChart';
import { SeverityDonut } from '@/components/charts/SeverityDonut';
import { ActivityFeed, GeoPanel, RuleHitsPanel, TopIpsPanel } from '@/components/dashboard/panels';

const RANGES: { value: TimeRange; label: string }[] = (['1h', '6h', '24h', '7d'] as TimeRange[]).map((range) => ({
  value: range,
  label: RANGE_META[range].short,
}));

export function Overview() {
  const navigate = useNavigate();
  const [range, setRange] = useState<TimeRange>('24h');
  const summary = useLiveStore((state) => state.summary);
  const alertOverrides = useLiveStore((state) => state.alertOverrides);
  const { data, loading, error, refetch } = useApi(`overview:${range}`, () => api.overview(range), 15_000);
  const activity = useApi('activity', () => api.activity(), 20_000);

  const totals = useMemo(() => data?.timeseries.map((bucket) => bucket.critical + bucket.high + bucket.medium + bucket.low + bucket.info) ?? [], [data]);
  const elevated = useMemo(() => data?.timeseries.map((bucket) => bucket.critical + bucket.high) ?? [], [data]);

  const activeAlerts = useMemo(() => {
    const merged = mergeAlerts(data?.activeAlerts ?? [], alertOverrides).filter((alert) => alert.status !== 'resolved');
    return merged.sort((a, b) => severitySort(a.severity, b.severity) || b.lastSeen - a.lastSeen).slice(0, 4);
  }, [data, alertOverrides]);

  const kpis = data?.kpis;
  const eps = summary.eps || kpis?.eps || 0;

  return (
    <div className="animate-fade-in space-y-3.5">
      <PageHeader
        eyebrow="Security overview"
        title="Operational posture"
        description="Live detection, triage, and telemetry health across the monitored estate."
        actions={
          <>
            <Segmented options={RANGES} value={range} onChange={setRange} />
            <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </>
        }
      />

      {error && !data ? (
        <Panel bodyClassName="p-6">
          <EmptyState
            icon={<ShieldAlert size={22} />}
            title="Telemetry unavailable"
            description={error}
            action={
              <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
                Retry
              </Button>
            }
          />
        </Panel>
      ) : null}

      <div className="grid grid-cols-2 gap-3 max-[430px]:grid-cols-1 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Events ingested"
          value={fmtCompact(kpis?.events ?? 0)}
          icon={Database}
          hint="normalized to ECS"
          delta={kpis?.eventsDeltaPct}
          deltaLabel="vs previous period"
          deltaTone="neutral"
          spark={totals}
          sparkColor="#22d3ee"
          accent="accent"
          loading={!data}
        />
        <StatCard
          label="Active alerts"
          value={fmtNumber(kpis?.openAlerts ?? 0)}
          icon={Siren}
          hint={`${kpis?.alertsDelta ?? 0} new this hour`}
          spark={elevated}
          sparkColor="#fb923c"
          loading={!data}
        />
        <StatCard
          label="Critical severity"
          value={fmtNumber(kpis?.criticalAlerts ?? 0)}
          icon={ShieldAlert}
          hint={kpis?.criticalAlerts ? 'Containment required' : 'No critical alerts open'}
          accent={kpis?.criticalAlerts ? 'critical' : 'none'}
          loading={!data}
        />
        <StatCard
          label="Sources online"
          value={`${kpis?.sourcesOnline ?? 0}/${kpis?.sourcesTotal ?? 0}`}
          icon={Activity}
          hint={
            kpis && kpis.sourcesOnline < kpis.sourcesTotal
              ? `${kpis.sourcesTotal - kpis.sourcesOnline} feed offline`
              : 'All collectors healthy'
          }
          loading={!data}
        />
        <StatCard
          label="Mean time to detect"
          value={kpis ? fmtDuration(kpis.mttdSeconds) : '—'}
          icon={Timer}
          hint="Rolling 7-day median"
          delta={kpis?.mttdDeltaPct}
          deltaLabel="improvement"
          deltaTone="good"
          loading={!data}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <TrafficChart data={data?.timeseries ?? []} range={range} eps={eps} loading={loading && !data} />
        </div>
        <div className="xl:col-span-4">
          <SeverityDonut severity={data?.severity ?? { critical: 0, high: 0, medium: 0, low: 0, info: 0 }} loading={loading && !data} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Panel
            title="Active incidents"
            subtitle="Prioritized by severity and recency"
            icon={<Siren size={13} />}
            actions={
              <button
                type="button"
                onClick={() => navigate('/alerts')}
                className="flex items-center gap-1 text-[10px] text-muted transition-colors hover:text-accent"
              >
                View all <ArrowUpRight size={11} />
              </button>
            }
            className="h-full"
          >
            {!data && loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : activeAlerts.length ? (
              <div>
                {activeAlerts.map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    onClick={() => navigate(`/alerts?alert=${alert.id}`)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ShieldAlert size={20} />}
                title="No active incidents"
                description="All detections are triaged. New alerts will appear here in real time."
              />
            )}
          </Panel>
        </div>
        <div className="xl:col-span-5">
          <TopIpsPanel ips={data?.topIps ?? []} loading={loading && !data} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <GeoPanel geo={data?.geo ?? []} loading={loading && !data} />
        </div>
        <div className="xl:col-span-4">
          <RuleHitsPanel rules={data?.recentRules ?? []} loading={loading && !data} />
        </div>
        <div className="md:col-span-2 xl:col-span-4">
          <ActivityFeed items={activity.data ?? []} loading={activity.loading && !activity.data} />
        </div>
      </div>
    </div>
  );
}
