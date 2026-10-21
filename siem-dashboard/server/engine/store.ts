import { EventEmitter } from 'node:events';
import type {
  Alert,
  AlertEntity,
  AlertStatus,
  GeoCount,
  LogEvent,
  Overview,
  OverviewKpis,
  Rule,
  Severity,
  SeverityBuckets,
  SimScenario,
  SourceHealth,
  SourceKind,
  StreamMessage,
  Summary,
  TimeRange,
  TimelineBucket,
  TopIp,
} from '../../shared/types.ts';
import { RANGE_META, SEVERITY_ORDER } from '../../shared/types.ts';
import {
  ALERT_SEEDS,
  ANALYSTS,
  COUNTRIES,
  EXTERNAL_IPS,
  RULE_SEEDS,
  SOURCE_SEEDS,
  type RuleKind,
} from './catalog.ts';
import { buildScenarioEvents, generateNoiseBatch, int, pick, randomHex } from './events.ts';

const RANGE_KEYS: TimeRange[] = ['1h', '6h', '24h', '7d'];
const RECENT_WINDOW_MS = 60 * 60 * 1000;
const MAX_RECENT_LOGS = 6000;
const DETECTION_WINDOW_MS = 10 * 60 * 1000;
const ALERT_COOLDOWN_MS = 10 * 60 * 1000;

interface RuleState extends Rule {
  kind: RuleKind;
}

interface RangeStats {
  range: TimeRange;
  bucketMs: number;
  buckets: TimelineBucket[];
  totals: SeverityBuckets;
  total: number;
  prevTotal: number;
  topIps: TopIp[];
  geo: GeoCount[];
}

function emptyBuckets(): SeverityBuckets {
  return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
}

function addBuckets(target: SeverityBuckets, source: SeverityBuckets): void {
  target.critical += source.critical;
  target.high += source.high;
  target.medium += source.medium;
  target.low += source.low;
  target.info += source.info;
}

function sumBuckets(buckets: SeverityBuckets): number {
  return buckets.critical + buckets.high + buckets.medium + buckets.low + buckets.info;
}

function bucketSum(bucket: TimelineBucket): number {
  return bucket.critical + bucket.high + bucket.medium + bucket.low + bucket.info;
}

function jitter(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function splitSeverity(total: number): SeverityBuckets {
  const critical = Math.max(0, Math.round(total * 0.0032 * jitter(0.5, 1.6)));
  const high = Math.max(0, Math.round(total * 0.024 * jitter(0.7, 1.4)));
  const medium = Math.max(0, Math.round(total * 0.11 * jitter(0.8, 1.25)));
  const low = Math.max(0, Math.round(total * 0.28 * jitter(0.85, 1.15)));
  const info = Math.max(0, total - critical - high - medium - low);
  return { critical, high, medium, low, info };
}

function hourlyProfile(now: number): number[] {
  const nowHour = Math.floor(now / 3_600_000) * 3_600_000;
  const rates: number[] = [];
  for (let h = 167; h >= 0; h -= 1) {
    const ts = nowHour - h * 3_600_000;
    const date = new Date(ts);
    const hour = date.getUTCHours();
    const weekday = date.getUTCDay();
    const daytime = hour >= 9 && hour < 19 ? 1.25 : hour >= 19 && hour < 24 ? 0.9 : 0.58;
    const weekend = weekday === 0 || weekday === 6 ? 0.74 : 1;
    const base = 19_000 * daytime * weekend * jitter(0.88, 1.12);
    rates.push(Math.round(base));
  }
  return rates;
}

function severityRank(severity: Severity): number {
  return SEVERITY_ORDER.length - SEVERITY_ORDER.indexOf(severity);
}

function higherSeverity(a: Severity, b: Severity): Severity {
  return severityRank(a) >= severityRank(b) ? a : b;
}

export class SiemStore extends EventEmitter {
  private recentLogs: LogEvent[] = [];
  private claimedLogIds = new Set<string>();
  private rulesState: RuleState[] = RULE_SEEDS.map((rule) => ({
    id: rule.id,
    name: rule.name,
    description: rule.description,
    severity: rule.severity,
    enabled: rule.enabled,
    mitre: rule.mitre,
    threshold: rule.threshold,
    logSource: rule.logSource,
    matches24h: rule.seedMatches,
    lastTriggered: undefined,
    kind: rule.kind,
  }));
  private alerts: Alert[] = [];
  private nextAlertNumber = 1043;
  private rangeStats = new Map<TimeRange, RangeStats>();
  private sources: SourceHealth[] = [];
  private cooldowns = new Map<string, number>();
  private emitTimes: number[] = [];
  private lifetimeEvents = 1_482_093_441;
  private emittedSinceStart = 0;
  private mttdBase = int(198, 286);
  private lastAutoScenario = 0;
  private activity: { ts: number; message: string; severity: Severity }[] = [];

  constructor() {
    super();
    const now = Date.now();
    this.seedSources(now);
    this.seedAlerts(now);
    this.seedStats(now);
    this.seedRecentLogs(now);
    this.activity = [
      { ts: now - 8 * 60_000, message: 'Detection pack v4.8.1 deployed to all sensors', severity: 'info' },
      { ts: now - 21 * 60_000, message: 'fw-edge-01 policy sync completed (1,204 rules)', severity: 'info' },
      { ts: now - 44 * 60_000, message: 'dns-umbrella latency elevated — ingest degraded', severity: 'medium' },
      { ts: now - 96 * 60_000, message: 'Quarterly access review closed by compliance', severity: 'info' },
    ];
    this.lastAutoScenario = now - 90_000;
  }

  // ---------------------------------------------------------------- seeding

  private seedSources(now: number): void {
    this.sources = SOURCE_SEEDS.map((seed) => {
      const history = Array.from({ length: 30 }, () => (seed.status === 'offline' ? 0 : int(4, 22)));
      return {
        id: seed.id,
        name: seed.name,
        kind: seed.kind,
        vendor: seed.vendor,
        status: seed.status,
        eventsPerSec: seed.status === 'offline' ? 0 : seed.weight * 8.2,
        events24h: Math.round(seed.weight * 486_000),
        errorRatePct: seed.errorRatePct,
        lastEventTs: seed.status === 'offline' ? now - 5_184_000 : now - 30_000,
        history,
      };
    });
  }

  private seedAlerts(now: number): void {
    const ruleById = new Map(this.rulesState.map((rule) => [rule.id, rule]));
    this.alerts = ALERT_SEEDS.map((seed) => {
      const rule = ruleById.get(seed.ruleId);
      if (!rule) throw new Error(`missing rule ${seed.ruleId}`);
      const firstSeen = now - seed.minutesAgo * 60_000;
      const timeline = seed.timeline.map((item) => ({
        ts: now - item.minutesAgo * 60_000,
        severity: item.severity,
        message: item.message,
        sourceId: item.sourceId,
      }));
      const lastSeen = timeline.length ? Math.max(...timeline.map((item) => item.ts)) : firstSeen;
      return {
        id: seed.id,
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        status: seed.status,
        firstSeen,
        lastSeen,
        eventCount: seed.eventCount,
        description: timeline[0]?.message ?? rule.description,
        assignee: seed.assignee,
        entities: seed.entities,
        mitre: rule.mitre,
        timeline,
      } satisfies Alert;
    });
    for (const alert of this.alerts) {
      const rule = ruleById.get(alert.ruleId);
      if (rule) {
        rule.lastTriggered = Math.max(rule.lastTriggered ?? 0, alert.lastSeen);
      }
    }
  }

  private seedStats(now: number): void {
    const profile = hourlyProfile(now);
    const nowHour = Math.floor(now / 3_600_000) * 3_600_000;

    for (const range of RANGE_KEYS) {
      const meta = RANGE_META[range];
      const bucketCount = Math.ceil(meta.windowMs / meta.bucketMs);
      const buckets: TimelineBucket[] = [];

      for (let i = 0; i < bucketCount; i += 1) {
        const ts = nowHour - (bucketCount - 1 - i) * meta.bucketMs;
        const hoursInBucket = meta.bucketMs / 3_600_000;
        const hourStartIndex = Math.floor((ts - (nowHour - 167 * 3_600_000)) / 3_600_000);
        let total = 0;
        if (hoursInBucket >= 1) {
          for (let h = 0; h < hoursInBucket; h += 1) {
            total += profile[Math.min(profile.length - 1, Math.max(0, hourStartIndex + h))] ?? 0;
          }
        } else {
          const hourly = profile[Math.min(profile.length - 1, Math.max(0, hourStartIndex))] ?? 0;
          total = Math.round((hourly * meta.bucketMs) / 3_600_000);
        }
        const split = splitSeverity(Math.max(0, total));
        buckets.push({ ts, ...split });
      }

      const totals = emptyBuckets();
      for (const bucket of buckets) addBuckets(totals, bucket);
      const total = sumBuckets(totals);

      let prevTotal = 0;
      if (range === '1h') {
        prevTotal = profile[profile.length - 2] ?? total;
      } else if (range === '6h') {
        prevTotal = profile.slice(-12, -6).reduce((sum, value) => sum + value, 0);
      } else if (range === '24h') {
        prevTotal = profile.slice(-48, -24).reduce((sum, value) => sum + value, 0);
      } else {
        prevTotal = Math.round(total * jitter(0.91, 1.06));
      }

      this.rangeStats.set(range, {
        range,
        bucketMs: meta.bucketMs,
        buckets,
        totals,
        total,
        prevTotal,
        topIps: this.seedTopIps(total),
        geo: this.seedGeo(total),
      });
    }
  }

  private seedTopIps(total: number): TopIp[] {
    const shares = [0.033, 0.026, 0.019, 0.014, 0.011, 0.008];
    const used = new Set<string>();
    return shares.map((share, index) => {
      let country = pick(COUNTRIES);
      let ip = pick(EXTERNAL_IPS[country.country] ?? ['198.51.100.9']);
      let guard = 0;
      while (used.has(ip) && guard < 20) {
        country = pick(COUNTRIES);
        ip = pick(EXTERNAL_IPS[country.country] ?? ['198.51.100.9']);
        guard += 1;
      }
      used.add(ip);
      const severity: Severity = index < 2 ? (index === 0 ? 'critical' : 'high') : index < 4 ? 'medium' : 'low';
      return {
        ip,
        country: country.country,
        flag: country.flag,
        count: Math.max(1, Math.round(total * share * jitter(0.8, 1.2))),
        severity,
      };
    });
  }

  private seedGeo(total: number): GeoCount[] {
    const picks = [
      { index: 2, share: 0.152 },
      { index: 1, share: 0.121 },
      { index: 0, share: 0.098 },
      { index: 3, share: 0.071 },
      { index: 4, share: 0.052 },
      { index: 8, share: 0.037 },
      { index: 10, share: 0.024 },
    ];
    return picks.map(({ index, share }) => {
      const country = COUNTRIES[index % COUNTRIES.length];
      return {
        country: country.country,
        flag: country.flag,
        count: Math.max(1, Math.round(total * share * jitter(0.85, 1.15))),
      };
    });
  }

  private seedRecentLogs(now: number): void {
    const seeded: LogEvent[] = [];
    for (let i = 0; i < 860; i += 1) {
      seeded.push(...generateNoiseBatch(now - int(2 * 60_000, RECENT_WINDOW_MS), 1));
    }
    seeded.sort((a, b) => a.ts - b.ts);
    this.recentLogs = seeded;
  }

  // -------------------------------------------------------------- ingestion

  ingest(events: LogEvent[]): Alert[] {
    if (!events.length) return [];
    for (const event of events) {
      this.recentLogs.push(event);
      this.claimedLogIds.add(event.id);
      this.lifetimeEvents += 1;
      this.emittedSinceStart += 1;
      this.emitTimes.push(event.ts);
    }
    this.recentLogs.sort((a, b) => a.ts - b.ts);
    if (this.recentLogs.length > MAX_RECENT_LOGS) {
      this.recentLogs = this.recentLogs.slice(-MAX_RECENT_LOGS);
    }
    for (const range of RANGE_KEYS) {
      const stats = this.rangeStats.get(range);
      if (!stats) continue;
      for (const event of events) this.recordInStats(stats, event);
    }
    return this.evaluateRules(events);
  }

  private recordInStats(stats: RangeStats, event: LogEvent): void {
    const bucketStart = Math.floor(event.ts / stats.bucketMs) * stats.bucketMs;
    const last = stats.buckets[stats.buckets.length - 1];
    if (!last) return;
    while (stats.buckets[stats.buckets.length - 1].ts < bucketStart) {
      const removed = stats.buckets.shift();
      if (removed) {
        stats.totals.critical -= removed.critical;
        stats.totals.high -= removed.high;
        stats.totals.medium -= removed.medium;
        stats.totals.low -= removed.low;
        stats.totals.info -= removed.info;
        stats.total -= bucketSum(removed);
      }
      stats.buckets.push({ ts: stats.buckets[stats.buckets.length - 1].ts + stats.bucketMs, ...emptyBuckets() });
    }
    const bucket = stats.buckets[stats.buckets.length - 1];
    bucket[event.severity] += 1;
    stats.totals[event.severity] += 1;
    stats.total += 1;

    if (event.srcIp && event.country && !event.srcIp.startsWith('10.')) {
      const existing = stats.topIps.find((entry) => entry.ip === event.srcIp);
      if (existing) {
        existing.count += 1;
        existing.severity = higherSeverity(existing.severity, event.severity);
      } else if (stats.topIps.length < 12) {
        stats.topIps.push({
          ip: event.srcIp,
          country: event.country,
          flag: COUNTRIES.find((c) => c.country === event.country)?.flag ?? '🌐',
          count: 1,
          severity: event.severity,
        });
      }
      stats.topIps.sort((a, b) => b.count - a.count);
      if (stats.topIps.length > 8) stats.topIps.length = 8;
      const geoEntry = stats.geo.find((entry) => entry.country === event.country);
      if (geoEntry) geoEntry.count += 1;
    }
  }

  advance(now: number): void {
    for (const range of RANGE_KEYS) {
      const stats = this.rangeStats.get(range);
      if (!stats) continue;
      const target = Math.floor(now / stats.bucketMs) * stats.bucketMs;
      let guard = 0;
      while (stats.buckets[stats.buckets.length - 1].ts < target && guard < 500) {
        const removed = stats.buckets.shift();
        if (removed) {
          stats.totals.critical -= removed.critical;
          stats.totals.high -= removed.high;
          stats.totals.medium -= removed.medium;
          stats.totals.low -= removed.low;
          stats.totals.info -= removed.info;
          stats.total -= bucketSum(removed);
        }
        stats.buckets.push({
          ts: stats.buckets[stats.buckets.length - 1].ts + stats.bucketMs,
          ...emptyBuckets(),
        });
        guard += 1;
      }
    }
    this.emitTimes = this.emitTimes.filter((ts) => now - ts < 10_000);
    this.activity = this.activity.filter((item) => now - item.ts < 24 * 60 * 60 * 1000);
  }

  // -------------------------------------------------------------- detection

  private evaluateRules(batch: LogEvent[]): Alert[] {
    const now = Date.now();
    const recent = this.recentLogs.filter((event) => now - event.ts <= DETECTION_WINDOW_MS);
    const batchKinds = new Set(batch.map((event) => event.eventType));
    const created: Alert[] = [];

    for (const rule of this.rulesState) {
      if (!rule.enabled) continue;
      const matches = this.detect(rule, recent, batchKinds);
      for (const match of matches) {
        const cooldownKey = `${rule.id}:${match.entityKey}`;
        const lastFired = this.cooldowns.get(cooldownKey) ?? 0;
        if (now - lastFired < ALERT_COOLDOWN_MS) continue;
        this.cooldowns.set(cooldownKey, now);
        const alert = this.createAlert(rule, match, now);
        created.push(alert);
      }
    }
    return created;
  }

  private detect(
    rule: RuleState,
    recent: LogEvent[],
    batchKinds: Set<string>,
  ): { entityKey: string; events: LogEvent[]; entities: AlertEntity[]; description: string }[] {
    const within = (ms: number) => recent.filter((event) => Date.now() - event.ts <= ms);
    const results: { entityKey: string; events: LogEvent[]; entities: AlertEntity[]; description: string }[] = [];

    const groupBy = (events: LogEvent[], key: (event: LogEvent) => string | undefined) => {
      const map = new Map<string, LogEvent[]>();
      for (const event of events) {
        const value = key(event);
        if (!value) continue;
        const list = map.get(value) ?? [];
        list.push(event);
        map.set(value, list);
      }
      return map;
    };

    switch (rule.kind) {
      case 'brute_force': {
        if (!batchKinds.has('auth_failure')) break;
        const failures = within(5 * 60_000).filter(
          (event) => event.eventType === 'auth_failure' && event.srcIp && event.country,
        );
        for (const [ip, events] of groupBy(failures, (event) => event.srcIp)) {
          const targeted = groupBy(events, (event) => event.user);
          for (const [targetUser, userEvents] of targeted) {
            if (userEvents.length < 6) continue;
          const latest = userEvents[userEvents.length - 1];
          const users = [targetUser];
          results.push({
            entityKey: `${ip}:${targetUser}`,
            events: userEvents,
            entities: [
              { type: 'ip', value: ip, country: latest.country },
              ...(users[0] ? [{ type: 'user' as const, value: users[0] }] : []),
              ...(latest.host ? [{ type: 'host' as const, value: latest.host }] : []),
            ],
            description: `${userEvents.length} failed sign-ins for ${users.join(', ') || 'multiple users'} from ${ip}${
              latest.country ? ` (${latest.country})` : ''
            }`,
          });
          }
        }
        break;
      }
      case 'port_scan': {
        if (!batchKinds.has('conn_denied')) break;
        const denied = within(3 * 60_000).filter((event) => event.eventType === 'conn_denied' && event.srcIp);
        for (const [ip, events] of groupBy(denied, (event) => event.srcIp)) {
          if (events.length < 15) continue;
          const ports = new Set(events.map((event) => event.dstPort).filter(Boolean));
          const latest = events[events.length - 1];
          results.push({
            entityKey: ip,
            events,
            entities: [
              { type: 'ip', value: ip, country: latest.country },
              { type: 'service', value: 'fw-edge-01' },
            ],
            description: `${events.length} denied connections across ${ports.size} ports from ${ip}${
              latest.country ? ` (${latest.country})` : ''
            }`,
          });
        }
        break;
      }
      case 'malware': {
        const detections = within(10 * 60_000).filter((event) => event.eventType === 'malware_detected');
        for (const [host, events] of groupBy(detections, (event) => event.host)) {
          const latest = events[events.length - 1];
          results.push({
            entityKey: host,
            events,
            entities: [
              { type: 'host', value: host },
              ...(latest.user ? [{ type: 'user' as const, value: latest.user }] : []),
            ],
            description: latest.message,
          });
        }
        break;
      }
      case 'c2': {
        if (!batchKinds.has('c2_beacon')) break;
        const beacons = within(10 * 60_000).filter((event) => event.eventType === 'c2_beacon');
        for (const [host, events] of groupBy(beacons, (event) => event.host)) {
          if (events.length < 3) continue;
          const latest = events[events.length - 1];
          results.push({
            entityKey: host,
            events,
            entities: [
              { type: 'host', value: host },
              ...(latest.user ? [{ type: 'user' as const, value: latest.user }] : []),
              ...(latest.dstIp ? [{ type: 'ip' as const, value: latest.dstIp, country: latest.country }] : []),
            ],
            description: `${events.length} periodic callbacks from ${host} to uncategorized infrastructure`,
          });
        }
        break;
      }
      case 'exfil': {
        const uploads = within(10 * 60_000).filter((event) => event.eventType === 'data_upload');
        for (const [host, events] of groupBy(uploads, (event) => event.host)) {
          const latest = events[events.length - 1];
          results.push({
            entityKey: host,
            events,
            entities: [
              { type: 'host', value: host },
              ...(latest.user ? [{ type: 'user' as const, value: latest.user }] : []),
              ...(latest.dstIp ? [{ type: 'ip' as const, value: latest.dstIp, country: latest.country }] : []),
            ],
            description: latest.message,
          });
        }
        break;
      }
      case 'impossible_travel': {
        if (!batchKinds.has('signin_success')) break;
        const successes = within(30 * 60_000).filter(
          (event) => event.eventType === 'signin_success' && event.country && event.user,
        );
        for (const [user, events] of groupBy(successes, (event) => event.user)) {
          const countries = Array.from(new Set(events.map((event) => event.country)));
          const ips = Array.from(new Set(events.map((event) => event.srcIp).filter(Boolean)));
          if (countries.length < 2 || ips.length < 2) continue;
          const latest = events[events.length - 1];
          results.push({
            entityKey: user,
            events,
            entities: [
              { type: 'user', value: user },
              { type: 'ip', value: latest.srcIp ?? 'unknown', country: latest.country },
            ],
            description: `${user} authenticated from ${countries.join(' and ')} within 30 minutes`,
          });
        }
        break;
      }
      case 'cloud_iam': {
        if (!batchKinds.has('iam_change')) break;
        const changes = within(10 * 60_000).filter((event) => event.eventType === 'iam_change');
        for (const [user, events] of groupBy(changes, (event) => event.user)) {
          const latest = events[events.length - 1];
          results.push({
            entityKey: user,
            events,
            entities: [
              { type: 'user', value: user },
              ...(latest.srcIp ? [{ type: 'ip' as const, value: latest.srcIp, country: latest.country }] : []),
              { type: 'service', value: 'IAM' },
            ],
            description: latest.message,
          });
        }
        break;
      }
      case 'dns_tunnel': {
        const tunnels = within(10 * 60_000).filter((event) => event.eventType === 'dns_tunnel');
        for (const [host, events] of groupBy(tunnels, (event) => event.host)) {
          if (events.length < 10) continue;
          results.push({
            entityKey: host,
            events,
            entities: [{ type: 'host', value: host }],
            description: `${events.length} high-entropy DNS queries from ${host}`,
          });
        }
        break;
      }
      case 'lateral': {
        if (!batchKinds.has('smb_failure')) break;
        const failures = within(5 * 60_000).filter((event) => event.eventType === 'smb_failure');
        for (const [host, events] of groupBy(failures, (event) => event.host)) {
          if (events.length < 3) continue;
          const latest = events[events.length - 1];
          results.push({
            entityKey: host,
            events,
            entities: [
              { type: 'host', value: host },
              ...(latest.user ? [{ type: 'user' as const, value: latest.user }] : []),
            ],
            description: `Failed SMB authentication across ${events.length} attempts from ${host}`,
          });
        }
        break;
      }
      case 'canary': {
        const touches = within(10 * 60_000).filter((event) => event.eventType === 'canary_file_touched');
        for (const [host, events] of groupBy(touches, (event) => event.host)) {
          results.push({
            entityKey: host,
            events,
            entities: [{ type: 'host', value: host }],
            description: events[events.length - 1].message,
          });
        }
        break;
      }
      case 'root_login': {
        const logins = within(10 * 60_000).filter((event) => event.eventType === 'root_login');
        for (const [ip, events] of groupBy(logins, (event) => event.srcIp ?? 'root')) {
          const latest = events[events.length - 1];
          results.push({
            entityKey: ip,
            events,
            entities: [
              { type: 'user', value: 'root' },
              ...(latest.srcIp ? [{ type: 'ip' as const, value: latest.srcIp, country: latest.country }] : []),
            ],
            description: latest.message,
          });
        }
        break;
      }
      case 'dormant': {
        const logins = within(10 * 60_000).filter((event) => event.eventType === 'dormant_signin');
        for (const [user, events] of groupBy(logins, (event) => event.user)) {
          results.push({
            entityKey: user,
            events,
            entities: [{ type: 'user', value: user }],
            description: events[events.length - 1].message,
          });
        }
        break;
      }
      case 'legacy_tls': {
        const handshakes = within(10 * 60_000).filter((event) => event.eventType === 'legacy_tls');
        if (handshakes.length < 5) break;
        results.push({
          entityKey: 'tls',
          events: handshakes,
          entities: [{ type: 'service', value: 'fw-edge-01' }],
          description: `${handshakes.length} deprecated TLS handshakes observed at the perimeter`,
        });
        break;
      }
    }

    return results;
  }

  private createAlert(
    rule: RuleState,
    match: { entityKey: string; events: LogEvent[]; entities: AlertEntity[]; description: string },
    now: number,
  ): Alert {
    const related = this.recentLogs
      .filter((event) => now - event.ts <= 15 * 60_000)
      .filter((event) => match.events.some((item) => item.id === event.id) || this.sharesEntity(event, match.entities))
      .sort((a, b) => a.ts - b.ts);

    const significant = related.filter((event) => event.severity !== 'info' && event.severity !== 'low');
    const chosen = (significant.length ? significant : related.length ? related : match.events).slice(-8);

    const timeline = chosen.map((event) => ({
      ts: event.ts,
      severity: event.severity,
      message: event.message,
      sourceId: event.sourceId,
    }));

    const firstSeen = Math.min(...match.events.map((event) => event.ts));
    const lastSeen = Math.max(...match.events.map((event) => event.ts));

    const alert: Alert = {
      id: `ALT-${this.nextAlertNumber}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      status: 'open',
      firstSeen,
      lastSeen: Math.max(lastSeen, firstSeen + 1000),
      eventCount: match.events.length,
      description: match.description,
      entities: match.entities.slice(0, 4),
      mitre: rule.mitre,
      timeline,
    };
    this.nextAlertNumber += 1;

    this.alerts = [alert, ...this.alerts];
    if (this.alerts.length > 240) this.alerts.length = 240;

    rule.lastTriggered = now;
    rule.matches24h += 1;

    this.activity = [
      { ts: now, message: `New ${rule.severity} alert: ${rule.name}`, severity: rule.severity },
      ...this.activity,
    ].slice(0, 60);

    return alert;
  }

  private sharesEntity(event: LogEvent, entities: AlertEntity[]): boolean {
    return entities.some((entity) => {
      if (entity.type === 'ip') return event.srcIp === entity.value || event.dstIp === entity.value;
      if (entity.type === 'host') return event.host === entity.value;
      if (entity.type === 'user') return event.user === entity.value;
      return event.service === entity.value;
    });
  }

  // ------------------------------------------------------------------ tick

  tickSources(now: number): void {
    const eps = this.currentEps();
    for (const source of this.sources) {
      const seed = SOURCE_SEEDS.find((item) => item.id === source.id);
      if (!seed || source.status === 'offline') {
        source.eventsPerSec = 0;
        continue;
      }
      const target = seed.weight * eps;
      source.eventsPerSec = Math.max(0, source.eventsPerSec * 0.7 + target * 0.3 * jitter(0.9, 1.1));
      source.events24h += Math.round(source.eventsPerSec * 5);
      source.lastEventTs = now;
      source.history = [...source.history.slice(-29), Math.round(source.eventsPerSec * 10 + jitter(-4, 8))];
      if (source.id === 'dns-umbrella') {
        source.status = 'degraded';
        source.errorRatePct = Math.max(0.8, Math.min(4.4, source.errorRatePct + jitter(-0.25, 0.3)));
      }
    }
  }

  currentEps(): number {
    const now = Date.now();
    this.emitTimes = this.emitTimes.filter((ts) => now - ts < 10_000);
    if (this.emittedSinceStart < 20) return 8.4;
    return Math.max(1, this.emitTimes.length / 10);
  }

  logActivity(now: number): { ts: number; message: string; severity: Severity }[] {
    return this.activity.slice(0, 12).map((item) => ({
      ...item,
      ts: Math.min(item.ts, now),
    }));
  }

  // ---------------------------------------------------------------- reading

  summary(): Summary {
    const open = this.alerts.filter((alert) => alert.status !== 'resolved');
    return {
      totalLogs: this.lifetimeEvents,
      openAlerts: open.length,
      criticalAlerts: open.filter((alert) => alert.severity === 'critical').length,
      connectedSources: this.sources.filter((source) => source.status !== 'offline').length,
      eps: Number(this.currentEps().toFixed(1)),
    };
  }

  overview(range: TimeRange): Overview {
    const stats = this.rangeStats.get(range);
    if (!stats) throw new Error(`unknown range ${range}`);
    const now = Date.now();
    const sourcesOnline = this.sources.filter((source) => source.status !== 'offline').length;
    const open = this.alerts.filter((alert) => alert.status !== 'resolved');
    const criticalOpen = open.filter((alert) => alert.severity === 'critical').length;

    const deltaPct = stats.prevTotal > 0 ? ((stats.total - stats.prevTotal) / stats.prevTotal) * 100 : 0;
    const rangeScale = range === '1h' ? 0.94 : range === '6h' ? 0.98 : range === '7d' ? 1.04 : 1;
    const mttd = Math.round(this.mttdBase * rangeScale);

    const kpis: OverviewKpis = {
      events: stats.total,
      eventsDeltaPct: Number(deltaPct.toFixed(1)),
      eps: Number(this.currentEps().toFixed(1)),
      openAlerts: open.length,
      criticalAlerts: criticalOpen,
      alertsDelta: open.filter((alert) => now - alert.firstSeen < 3_600_000).length,
      sourcesOnline,
      sourcesTotal: this.sources.length,
      mttdSeconds: mttd,
      mttdDeltaPct: -7.4,
    };

    const severity = { ...stats.totals };

    const activeAlerts = open
      .slice()
      .sort((a, b) => severityRank(b.severity) - severityRank(a.severity) || b.lastSeen - a.lastSeen)
      .slice(0, 6);

    const recentRules = this.rulesState
      .filter((rule) => rule.matches24h > 0)
      .sort((a, b) => b.matches24h - a.matches24h)
      .slice(0, 5)
      .map((rule) => ({ id: rule.id, name: rule.name, severity: rule.severity, count: rule.matches24h }));

    return {
      range,
      generatedAt: now,
      kpis,
      timeseries: stats.buckets.map((bucket) => ({ ...bucket })),
      severity,
      topIps: stats.topIps.slice(0, 6),
      geo: stats.geo.slice(0, 6),
      activeAlerts,
      recentRules,
    };
  }

  queryLogs(params: {
    q?: string;
    severity?: Severity[];
    sourceKind?: SourceKind[];
    sinceMinutes?: number;
    limit?: number;
    cursor?: string;
  }): { events: LogEvent[]; nextCursor?: string; total: number; bufferStart: number } {
    const now = Date.now();
    const since = now - Math.min(params.sinceMinutes ?? 60, 120) * 60_000;
    const q = params.q?.trim().toLowerCase();
    const limit = Math.min(params.limit ?? 100, 500);

    const matching = this.recentLogs.filter((event) => {
      if (event.ts < since) return false;
      if (params.severity?.length && !params.severity.includes(event.severity)) return false;
      if (params.sourceKind?.length && !params.sourceKind.includes(event.sourceKind)) return false;
      if (q) {
        const haystack = `${event.message} ${event.srcIp ?? ''} ${event.dstIp ?? ''} ${event.host ?? ''} ${event.user ?? ''} ${event.eventType} ${event.sourceId}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const sorted = matching.sort((a, b) => b.ts - a.ts);
    const offset = params.cursor ? Number.parseInt(params.cursor, 10) || 0 : 0;
    const page = sorted.slice(offset, offset + limit);
    const nextOffset = offset + page.length;
    return {
      events: page,
      nextCursor: nextOffset < sorted.length ? String(nextOffset) : undefined,
      total: sorted.length,
      bufferStart: Math.max(since, this.recentLogs[0]?.ts ?? since),
    };
  }

  listAlerts(params: { status?: AlertStatus[]; severity?: Severity[]; q?: string }): Alert[] {
    const q = params.q?.trim().toLowerCase();
    return this.alerts
      .filter((alert) => {
        if (params.status?.length && !params.status.includes(alert.status)) return false;
        if (params.severity?.length && !params.severity.includes(alert.severity)) return false;
        if (q) {
          const haystack = `${alert.id} ${alert.ruleName} ${alert.description} ${alert.entities.map((e) => e.value).join(' ')}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const statusRank: Record<AlertStatus, number> = { open: 0, investigating: 1, resolved: 2 };
        if (statusRank[a.status] !== statusRank[b.status]) return statusRank[a.status] - statusRank[b.status];
        return severityRank(b.severity) - severityRank(a.severity) || b.lastSeen - a.lastSeen;
      });
  }

  getAlert(id: string): Alert | undefined {
    return this.alerts.find((alert) => alert.id === id);
  }

  updateAlert(id: string, patch: { status?: AlertStatus; assignee?: string }): Alert | undefined {
    const alert = this.getAlert(id);
    if (!alert) return undefined;
    if (patch.status) alert.status = patch.status;
    if (patch.status === 'investigating' && !alert.assignee) {
      alert.assignee = patch.assignee ?? 'D. Mensah';
    }
    if (patch.assignee !== undefined) alert.assignee = patch.assignee || undefined;
    this.activity = [
      {
        ts: Date.now(),
        message: `${alert.id} marked ${alert.status}${alert.assignee ? ` · ${alert.assignee}` : ''}`,
        severity: (alert.status === 'resolved' ? 'info' : alert.severity) as Severity,
      },
      ...this.activity,
    ].slice(0, 60);
    return alert;
  }

  listRules(): Rule[] {
    return this.rulesState.map((rule) => ({ ...rule }));
  }

  setRuleEnabled(id: string, enabled: boolean): Rule | undefined {
    const rule = this.rulesState.find((item) => item.id === id);
    if (!rule) return undefined;
    rule.enabled = enabled;
    this.activity = [
      {
        ts: Date.now(),
        message: `${rule.name} ${enabled ? 'enabled' : 'disabled'} by D. Mensah`,
        severity: 'info' as Severity,
      },
      ...this.activity,
    ].slice(0, 60);
    return rule;
  }

  listSources(): SourceHealth[] {
    return this.sources;
  }

  analysts(): string[] {
    return ANALYSTS;
  }

  // ------------------------------------------------------------ simulation

  simulate(scenario: SimScenario): { label: string; events: LogEvent[]; alerts: Alert[] } {
    const now = Date.now();
    const { events, label } = buildScenarioEvents(scenario, now);
    const alerts = this.ingest(events);
    for (const alert of alerts) {
      this.emit('message', { type: 'alert', alert } satisfies StreamMessage);
    }
    this.emit('message', {
      type: 'logs',
      logs: events,
      eps: this.currentEps(),
      totalLogs: this.lifetimeEvents,
    } satisfies StreamMessage);
    this.emit('message', { type: 'summary', summary: this.summary() } satisfies StreamMessage);
    return { label, events, alerts };
  }

  maybeAutoScenario(now: number): void {
    if (now - this.lastAutoScenario < 180_000) return;
    this.lastAutoScenario = now;
    const scenarios: SimScenario[] = ['brute_force', 'port_scan', 'c2', 'malware', 'cloud_iam', 'exfiltration'];
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    this.simulate(scenario);
  }

  randomRuleMatch(): { id: string; name: string; severity: Severity; count: number } {
    return {
      id: `rule-${randomHex(3)}`,
      name: `Ad-hoc detection ${randomHex(2)}`,
      severity: pick(['low', 'medium'] as Severity[]),
      count: int(1, 4),
    };
  }
}
