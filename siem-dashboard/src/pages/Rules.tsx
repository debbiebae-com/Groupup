import { useEffect, useMemo, useState } from 'react';
import { Radar, RefreshCw, ShieldOff, Sparkles, Target } from 'lucide-react';
import type { Rule, Severity } from '@shared/types';
import { SEVERITY_META, SEVERITY_ORDER } from '@shared/types';
import { api, useApi } from '@/lib/api';
import { pushToast } from '@/lib/live';
import { cn, fmtNumber, severitySort, timeAgo } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Button, Panel, SearchInput, Select, SeverityBadge, Skeleton, Toggle } from '@/components/ui/primitives';

export function Rules() {
  const { data, loading, error, refetch } = useApi('rules', () => api.rules(), 20_000);
  const [rules, setRules] = useState<Rule[]>([]);
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');

  useEffect(() => {
    if (data) setRules(data);
  }, [data]);

  const enabled = rules.filter((rule) => rule.enabled).length;
  const matches = rules.reduce((sum, rule) => sum + rule.matches24h, 0);
  const criticalRules = rules.filter((rule) => rule.severity === 'critical').length;

  const tactics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const rule of rules) counts.set(rule.mitre.tactic, (counts.get(rule.mitre.tactic) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [rules]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rules
      .filter((rule) => {
        if (severityFilter !== 'all' && rule.severity !== severityFilter) return false;
        if (q) {
          const haystack = `${rule.name} ${rule.description} ${rule.logSource} ${rule.mitre.id} ${rule.mitre.tactic}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
        return severitySort(a.severity, b.severity) || b.matches24h - a.matches24h;
      });
  }, [rules, query, severityFilter]);

  const toggleRule = async (rule: Rule) => {
    const next = !rule.enabled;
    setRules((current) => current.map((item) => (item.id === rule.id ? { ...item, enabled: next } : item)));
    try {
      await api.setRule(rule.id, next);
      pushToast({
        title: `${rule.name} ${next ? 'enabled' : 'disabled'}`,
        description: next ? 'Rule will evaluate on the next event batch.' : 'Rule remains in the library but is no longer evaluated.',
        severity: 'success',
      });
    } catch (toggleError) {
      setRules((current) => current.map((item) => (item.id === rule.id ? { ...item, enabled: !next } : item)));
      pushToast({ title: 'Rule update failed', description: (toggleError as Error).message, severity: 'high' });
    }
  };

  return (
    <div className="animate-fade-in space-y-3">
      <PageHeader
        eyebrow="Detect · analytics"
        title="Detection rules"
        description="Streaming analytics evaluated against every normalized batch. Toggle rules to tune coverage without redeploying sensors."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} loading={loading}>
            <RefreshCw size={12} />
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="rounded-lg border border-sev-critical/30 bg-sev-critical/[0.06] px-3 py-2 text-[11px] text-sev-critical">
          Failed to load rules: {error}
        </div>
      )}

      <Panel bodyClassName="p-0">
        <div className="grid grid-cols-2 divide-x divide-edge/60 md:grid-cols-4">
          <div className="px-4 py-3">
            <div className="label-caps">Rules enabled</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="num text-[19px] font-semibold text-bright">
                {enabled}
                <span className="text-muted/50">/{rules.length}</span>
              </span>
            </div>
            <div className="text-[9.5px] text-muted/70">evaluated per batch</div>
          </div>
          <div className="px-4 py-3">
            <div className="label-caps">Matches · 24h</div>
            <div className="mt-1 num text-[19px] font-semibold text-bright">{fmtNumber(matches)}</div>
            <div className="text-[9.5px] text-muted/70">correlated detections</div>
          </div>
          <div className="px-4 py-3">
            <div className="label-caps">Critical analytics</div>
            <div className="mt-1 num text-[19px] font-semibold text-sev-critical">{criticalRules}</div>
            <div className="text-[9.5px] text-muted/70">highest fidelity rules</div>
          </div>
          <div className="px-4 py-3">
            <div className="label-caps">Pack version</div>
            <div className="mt-1 flex items-center gap-1.5">
              <Sparkles size={13} className="text-accent" />
              <span className="num text-[15px] font-semibold text-bright">v4.8.1</span>
            </div>
            <div className="text-[9.5px] text-muted/70">deployed 8 minutes ago</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 border-t border-edge/60 px-4 py-2.5">
          <span className="label-caps mr-1 flex items-center gap-1">
            <Target size={10} />
            ATT&amp;CK coverage
          </span>
          {tactics.map(([tactic, count]) => (
            <span
              key={tactic}
              className="inline-flex items-center gap-1 rounded border border-edge bg-surface-2/60 px-1.5 py-0.5 text-[9.5px] text-muted"
            >
              {tactic}
              <span className="font-mono text-[9px] text-bright/80">{count}</span>
            </span>
          ))}
        </div>
      </Panel>

      <Panel bodyClassName="p-0" className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-edge/60 p-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search rule, tactic, technique…"
            className="w-full sm:w-[320px]"
            onClear={() => setQuery('')}
          />
          <Select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value as Severity | 'all')}
            className="w-[132px]"
            aria-label="Severity filter"
          >
            <option value="all">All severity</option>
            {SEVERITY_ORDER.map((severity) => (
              <option key={severity} value={severity}>
                {SEVERITY_META[severity].label}
              </option>
            ))}
          </Select>
          <span className="ml-auto flex items-center gap-1.5 text-[10px] text-muted">
            <Radar size={11} className="text-accent" />
            {filtered.length} of {rules.length} rules
          </span>
        </div>

        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left">
            <thead>
              <tr className="border-b border-edge text-[9px] uppercase tracking-[0.14em] text-muted">
                <th className="px-4 py-2.5 font-medium">Rule</th>
                <th className="w-[104px] px-2 py-2.5 font-medium">Severity</th>
                <th className="w-[148px] px-2 py-2.5 font-medium">Log source</th>
                <th className="w-[216px] px-2 py-2.5 font-medium">Threshold</th>
                <th className="w-[172px] px-2 py-2.5 font-medium">ATT&amp;CK</th>
                <th className="w-[70px] px-2 py-2.5 text-right font-medium">24h</th>
                <th className="w-[100px] px-2 py-2.5 font-medium">Last hit</th>
                <th className="w-[88px] px-4 py-2.5 font-medium">Enabled</th>
              </tr>
            </thead>
            <tbody>
              {loading && !rules.length
                ? Array.from({ length: 8 }).map((_, index) => (
                    <tr key={index} className="border-b border-edge/40">
                      <td colSpan={8} className="px-4 py-3">
                        <Skeleton className="h-9 w-full" />
                      </td>
                    </tr>
                  ))
                : filtered.map((rule) => (
                    <tr key={rule.id} className={cn('table-row align-top', !rule.enabled && 'opacity-55')}>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          {rule.enabled ? (
                            <Radar size={13} className="mt-0.5 shrink-0 text-accent/80" />
                          ) : (
                            <ShieldOff size={13} className="mt-0.5 shrink-0 text-muted" />
                          )}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[12px] font-medium text-bright">{rule.name}</span>
                              {!rule.enabled && (
                                <span className="rounded border border-edge bg-surface-3 px-1 py-[1px] text-[8.5px] uppercase tracking-wider text-muted">
                                  disabled
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 line-clamp-1 text-[10.5px] leading-relaxed text-muted">{rule.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <SeverityBadge severity={rule.severity} />
                      </td>
                      <td className="px-2 py-3">
                        <span className="text-[10px] text-muted">{rule.logSource}</span>
                      </td>
                      <td className="px-2 py-3">
                        <span className="font-mono text-[9.5px] leading-relaxed text-muted">{rule.threshold}</span>
                      </td>
                      <td className="px-2 py-3">
                        <div className="font-mono text-[9.5px] text-accent">{rule.mitre.id}</div>
                        <div className="text-[9px] leading-tight text-muted">{rule.mitre.tactic}</div>
                        <div className="text-[9px] leading-tight text-muted/60">{rule.mitre.technique}</div>
                      </td>
                      <td className="px-2 py-3 text-right">
                        <span className="font-mono text-[11px] tabular-nums text-bright">{rule.matches24h}</span>
                      </td>
                      <td className="px-2 py-3">
                        <span className="font-mono text-[9.5px] text-muted">
                          {rule.lastTriggered ? timeAgo(rule.lastTriggered) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Toggle
                            checked={rule.enabled}
                            onChange={() => toggleRule(rule)}
                            label={`Toggle ${rule.name}`}
                          />
                          <span className={cn('w-5 text-[9px] uppercase tracking-wide', rule.enabled ? 'text-emerald-300' : 'text-muted')}>
                            {rule.enabled ? 'on' : 'off'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-edge/60 px-4 py-2.5 text-[9.5px] text-muted">
          <span>Disabled rules remain in the library but are skipped by the streaming evaluator.</span>
          <span className="font-mono">detection-pack v4.8.1 · mitre v15</span>
        </div>
      </Panel>
    </div>
  );
}
