export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

export type AlertStatus = 'open' | 'investigating' | 'resolved';

export type SourceKind = 'firewall' | 'endpoint' | 'identity' | 'cloud' | 'dns' | 'proxy';

export type TimeRange = '1h' | '6h' | '24h' | '7d';

export type SimScenario =
  | 'brute_force'
  | 'port_scan'
  | 'malware'
  | 'exfiltration'
  | 'c2'
  | 'cloud_iam';

export interface MitreRef {
  id: string;
  tactic: string;
  technique: string;
}

export interface LogEvent {
  id: string;
  ts: number;
  severity: Severity;
  eventType: string;
  message: string;
  sourceId: string;
  sourceKind: SourceKind;
  srcIp?: string;
  srcPort?: number;
  dstIp?: string;
  dstPort?: number;
  host?: string;
  service?: string;
  user?: string;
  outcome: 'success' | 'failure' | 'blocked' | 'allowed';
  country?: string;
  city?: string;
  bytesIn?: number;
  bytesOut?: number;
  mitre?: MitreRef;
  raw: Record<string, unknown>;
}

export type EntityType = 'ip' | 'user' | 'host' | 'service';

export interface AlertEntity {
  type: EntityType;
  value: string;
  country?: string;
}

export interface AlertTimelineItem {
  ts: number;
  severity: Severity;
  message: string;
  sourceId: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: Severity;
  status: AlertStatus;
  firstSeen: number;
  lastSeen: number;
  eventCount: number;
  description: string;
  assignee?: string;
  entities: AlertEntity[];
  mitre: MitreRef;
  timeline: AlertTimelineItem[];
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  enabled: boolean;
  mitre: MitreRef;
  threshold: string;
  logSource: string;
  matches24h: number;
  lastTriggered?: number;
}

export type SourceStatus = 'healthy' | 'degraded' | 'offline';

export interface SourceHealth {
  id: string;
  name: string;
  kind: SourceKind;
  vendor: string;
  status: SourceStatus;
  eventsPerSec: number;
  events24h: number;
  errorRatePct: number;
  lastEventTs: number;
  history: number[];
}

export interface TopIp {
  ip: string;
  country: string;
  flag: string;
  count: number;
  severity: Severity;
}

export interface GeoCount {
  country: string;
  flag: string;
  count: number;
}

export interface SeverityBuckets {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface TimelineBucket extends SeverityBuckets {
  ts: number;
}

export interface OverviewKpis {
  events: number;
  eventsDeltaPct: number;
  eps: number;
  openAlerts: number;
  criticalAlerts: number;
  alertsDelta: number;
  sourcesOnline: number;
  sourcesTotal: number;
  mttdSeconds: number;
  mttdDeltaPct: number;
}

export interface Overview {
  range: TimeRange;
  generatedAt: number;
  kpis: OverviewKpis;
  timeseries: TimelineBucket[];
  severity: SeverityBuckets;
  topIps: TopIp[];
  geo: GeoCount[];
  activeAlerts: Alert[];
  recentRules: { id: string; name: string; severity: Severity; count: number }[];
}

export interface Summary {
  totalLogs: number;
  openAlerts: number;
  criticalAlerts: number;
  connectedSources: number;
  eps: number;
}

export type StreamMessage =
  | { type: 'logs'; logs: LogEvent[]; eps: number; totalLogs: number }
  | { type: 'alert'; alert: Alert }
  | { type: 'alert_update'; alert: Alert }
  | { type: 'sources'; sources: SourceHealth[] }
  | { type: 'summary'; summary: Summary };

export const SEVERITY_META: Record<
  Severity,
  { label: string; color: string; text: string; bg: string; border: string; dot: string }
> = {
  critical: {
    label: 'CRITICAL',
    color: '#fb5f76',
    text: 'text-sev-critical',
    bg: 'bg-sev-critical/10',
    border: 'border-sev-critical/30',
    dot: 'bg-sev-critical',
  },
  high: {
    label: 'HIGH',
    color: '#fb923c',
    text: 'text-sev-high',
    bg: 'bg-sev-high/10',
    border: 'border-sev-high/30',
    dot: 'bg-sev-high',
  },
  medium: {
    label: 'MEDIUM',
    color: '#f5c451',
    text: 'text-sev-medium',
    bg: 'bg-sev-medium/10',
    border: 'border-sev-medium/30',
    dot: 'bg-sev-medium',
  },
  low: {
    label: 'LOW',
    color: '#3fb9f6',
    text: 'text-sev-low',
    bg: 'bg-sev-low/10',
    border: 'border-sev-low/30',
    dot: 'bg-sev-low',
  },
  info: {
    label: 'INFO',
    color: '#8fa3bd',
    text: 'text-sev-info',
    bg: 'bg-sev-info/10',
    border: 'border-sev-info/30',
    dot: 'bg-sev-info',
  },
};

export const SOURCE_KIND_LABEL: Record<SourceKind, string> = {
  firewall: 'Firewall',
  endpoint: 'Endpoint',
  identity: 'Identity',
  cloud: 'Cloud',
  dns: 'DNS',
  proxy: 'Web Proxy',
};

export const RANGE_META: Record<TimeRange, { label: string; short: string; windowMs: number; bucketMs: number }> = {
  '1h': { label: 'Last 1 hour', short: '1H', windowMs: 60 * 60 * 1000, bucketMs: 5 * 60 * 1000 },
  '6h': { label: 'Last 6 hours', short: '6H', windowMs: 6 * 60 * 60 * 1000, bucketMs: 15 * 60 * 1000 },
  '24h': { label: 'Last 24 hours', short: '24H', windowMs: 24 * 60 * 60 * 1000, bucketMs: 60 * 60 * 1000 },
  '7d': { label: 'Last 7 days', short: '7D', windowMs: 7 * 24 * 60 * 60 * 1000, bucketMs: 6 * 60 * 60 * 1000 },
};
