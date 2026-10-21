import type { LogEvent, Severity, SourceKind } from '../../shared/types.ts';
import {
  BENIGN_DOMAINS,
  COUNTRIES,
  EXTERNAL_IPS,
  INTERNAL_HOSTS,
  INTERNAL_SERVICES,
  MALICIOUS_DOMAINS,
  SERVICE_ACCOUNTS,
  SOURCE_BY_ID,
  SOURCE_SEEDS,
  USERS,
} from './catalog.ts';

export function int(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function chance(p: number): boolean {
  return Math.random() < p;
}

export function pickWeighted<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

export function randomHex(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += Math.floor(Math.random() * 16).toString(16);
  }
  return out;
}

function makeId(): string {
  return `EVT-${randomHex(6)}${randomHex(2)}`;
}

const PUBLIC_DESTINATIONS = [
  '140.82.113.6',
  '20.190.151.7',
  '104.18.24.21',
  '52.84.150.39',
  '142.250.185.78',
  '31.13.71.36',
  '151.101.1.194',
  '3.5.140.2',
];

const PROCESS_NAMES = ['chrome.exe', 'outlook.exe', 'teams.exe', 'excel.exe', 'code.exe', 'slack.exe', 'svchost.exe'];

const MALWARE_NAMES = ['Emotet.GenK', 'Qakbot.Loader', 'Trickbot.Beacon', 'CobaltStrike.Beacon', 'LockBit.Ransom'];

const THREAT_SIGNATURES = [
  'Cobalt Strike C2 (high confidence)',
  'Suspicious PowerShell download cradle',
  'Known malicious JA3 fingerprint',
  'DNS sinkhole match',
];

const AWS_ROLES = ['DeployRole', 'ReadOnlyAudit', 'PlatformAdmin', 'DataPipelineRole'];
const AWS_BUCKETS = ['aegis-prod-logs', 'aegis-backups', 'aegis-artifacts', 'aegis-analytics'];


function externalGeo() {
  const country = pickWeighted(COUNTRIES);
  const ips = EXTERNAL_IPS[country.country] ?? ['203.0.113.10'];
  return {
    country: country.country,
    city: pick(country.cities),
    flag: country.flag,
    ip: pick(ips),
    port: int(1024, 65535),
  };
}

function internalHost() {
  return pick(INTERNAL_HOSTS);
}

function domainPath(): string {
  const base = pick(['/api/v2/sync', '/static/app.js', '/v1/session', '/assets/logo.svg', '/oauth/token']);
  return base;
}

function formatBytes(bytes: number): string {
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

interface Draft {
  ts: number;
  severity: Severity;
  eventType: string;
  message: string;
  sourceId: string;
  sourceKind: SourceKind;
  outcome: LogEvent['outcome'];
  srcIp?: string;
  srcPort?: number;
  dstIp?: string;
  dstPort?: number;
  host?: string;
  service?: string;
  user?: string;
  country?: string;
  city?: string;
  bytesIn?: number;
  bytesOut?: number;
  mitre?: LogEvent['mitre'];
  action?: string;
  extra?: Record<string, unknown>;
}

const SEVERITY_SCORE: Record<Severity, number> = {
  critical: 95,
  high: 75,
  medium: 50,
  low: 25,
  info: 10,
};

const DATASET: Record<SourceKind, string> = {
  firewall: 'panw.traffic',
  endpoint: 'crowdstrike.falcon',
  identity: 'okta.system',
  cloud: 'aws.cloudtrail',
  dns: 'cisco.umbrella.dns',
  proxy: 'zscaler.web',
};

function compact<T extends Record<string, unknown>>(input: T): Partial<T> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'object' && !Array.isArray(value)) {
      const nested = compact(value as Record<string, unknown>);
      if (Object.keys(nested).length) output[key] = nested;
      continue;
    }
    if (Array.isArray(value) && value.length === 0) continue;
    output[key] = value;
  }
  return output as Partial<T>;
}

export function toLogEvent(draft: Draft): LogEvent {
  const source = SOURCE_BY_ID.get(draft.sourceId);
  const raw: Record<string, unknown> = {
    '@timestamp': new Date(draft.ts).toISOString(),
    event: {
      kind: 'event',
      category: [
        draft.sourceKind === 'identity'
          ? 'authentication'
          : draft.sourceKind === 'cloud'
            ? 'iam'
            : draft.sourceKind === 'endpoint'
              ? 'process'
              : 'network',
      ],
      type: [draft.outcome === 'failure' ? 'denied' : 'connection'],
      action: draft.action ?? draft.eventType,
      outcome: draft.outcome,
      severity: SEVERITY_SCORE[draft.severity],
      dataset: DATASET[draft.sourceKind],
      module: draft.eventType,
    },
    source: {
      ip: draft.srcIp,
      port: draft.srcPort,
      geo: draft.country ? { country_name: draft.country, city_name: draft.city } : undefined,
      user: draft.sourceKind === 'cloud' ? { name: draft.user } : undefined,
    },
    destination: {
      ip: draft.dstIp,
      port: draft.dstPort,
    },
    host: draft.host ? { name: draft.host } : undefined,
    user: draft.user ? { name: draft.user } : undefined,
    network: {
      transport: 'tcp',
      bytes_in: draft.bytesIn,
      bytes_out: draft.bytesOut,
    },
    observer: {
      name: source?.name ?? draft.sourceId,
      vendor: source?.vendor,
      type: 'siem',
    },
    service: draft.service,
    rule: { name: draft.eventType },
    message: draft.message,
    ...draft.extra,
  };

  return {
    id: makeId(),
    ts: draft.ts,
    severity: draft.severity,
    eventType: draft.eventType,
    message: draft.message,
    sourceId: draft.sourceId,
    sourceKind: draft.sourceKind,
    outcome: draft.outcome,
    srcIp: draft.srcIp,
    srcPort: draft.srcPort,
    dstIp: draft.dstIp,
    dstPort: draft.dstPort,
    host: draft.host,
    service: draft.service,
    user: draft.user,
    country: draft.country,
    city: draft.city,
    bytesIn: draft.bytesIn,
    bytesOut: draft.bytesOut,
    mitre: draft.mitre,
    raw: compact(raw) as Record<string, unknown>,
  };
}

function noiseFirewall(now: number): Draft {
  const host = internalHost();
  const svc = pick(INTERNAL_SERVICES.firewall);
  const roll = Math.random();

  if (roll < 0.62) {
    const domain = pick(BENIGN_DOMAINS);
    return {
      ts: now,
      severity: 'info',
      eventType: 'traffic_allowed',
      message: `Allowed outbound TLS session to ${domain}:443`,
      sourceId: 'fw-edge-01',
      sourceKind: 'firewall',
      outcome: 'allowed',
      srcIp: host.ip,
      srcPort: int(49152, 65000),
      dstIp: pick(PUBLIC_DESTINATIONS),
      dstPort: 443,
      host: host.host,
      service: 'ssl',
      bytesIn: int(1_200, 480_000),
      bytesOut: int(400, 48_000),
      action: 'allow',
    };
  }
  if (roll < 0.78) {
    const geo = externalGeo();
    return {
      ts: now,
      severity: 'info',
      eventType: 'traffic_allowed',
      message: `Inbound TLS session accepted from ${geo.ip}:${geo.port}`,
      sourceId: 'fw-edge-01',
      sourceKind: 'firewall',
      outcome: 'allowed',
      srcIp: geo.ip,
      srcPort: geo.port,
      dstIp: '52.16.44.10',
      dstPort: 443,
      service: 'ssl',
      country: geo.country,
      city: geo.city,
      bytesIn: int(2_000, 120_000),
      action: 'allow',
    };
  }
  if (roll < 0.94) {
    const geo = externalGeo();
    const port = pick([21, 22, 23, 80, 445, 3389, 8080, 9200]);
    return {
      ts: now,
      severity: 'low',
      eventType: 'conn_denied',
      message: `Denied inbound TCP/${port} from ${geo.ip} (policy: edge-block)`,
      sourceId: 'fw-edge-01',
      sourceKind: 'firewall',
      outcome: 'blocked',
      srcIp: geo.ip,
      srcPort: geo.port,
      dstIp: '52.16.44.10',
      dstPort: port,
      service: svc,
      country: geo.country,
      city: geo.city,
      action: 'deny',
    };
  }
  const geo = externalGeo();
  return {
    ts: now,
    severity: 'medium',
    eventType: 'threat_blocked',
    message: `Threat prevented: ${pick(THREAT_SIGNATURES)} from ${geo.ip}`,
    sourceId: 'fw-edge-01',
    sourceKind: 'firewall',
    outcome: 'blocked',
    srcIp: geo.ip,
    srcPort: geo.port,
    dstIp: '52.16.44.10',
    dstPort: 443,
    service: 'ssl',
    country: geo.country,
    city: geo.city,
    mitre: { id: 'T1071.001', tactic: 'Command and Control', technique: 'Web Protocols' },
    action: 'block',
  };
}

function noiseEndpoint(now: number): Draft {
  const host = internalHost();
  const user = pick(USERS);
  const roll = Math.random();

  if (roll < 0.58) {
    return {
      ts: now,
      severity: 'info',
      eventType: 'process_start',
      message: `Process started: ${pick(PROCESS_NAMES)} (PID ${int(1000, 9999)}) on ${host.host}`,
      sourceId: 'edr-crowdstrike',
      sourceKind: 'endpoint',
      outcome: 'allowed',
      host: host.host,
      srcIp: host.ip,
      user,
      service: 'process',
      action: 'process_start',
    };
  }
  if (roll < 0.8) {
    return {
      ts: now,
      severity: 'low',
      eventType: 'file_write',
      message: `File written: C:\\Users\\${user}\\AppData\\Local\\Temp\\${randomHex(6)}.tmp on ${host.host}`,
      sourceId: 'edr-crowdstrike',
      sourceKind: 'endpoint',
      outcome: 'allowed',
      host: host.host,
      srcIp: host.ip,
      user,
      service: 'file',
    };
  }
  if (roll < 0.92) {
    return {
      ts: now,
      severity: 'medium',
      eventType: 'suspicious_process',
      message: `Office application spawned powershell.exe with encoded arguments on ${host.host}`,
      sourceId: 'edr-crowdstrike',
      sourceKind: 'endpoint',
      outcome: 'allowed',
      host: host.host,
      srcIp: host.ip,
      user,
      service: 'process',
      mitre: { id: 'T1059.001', tactic: 'Execution', technique: 'PowerShell' },
    };
  }
  if (roll < 0.98) {
    return {
      ts: now,
      severity: 'medium',
      eventType: 'threat_blocked',
      message: `Detection blocked: ${pick(MALWARE_NAMES)} quarantined on ${host.host}`,
      sourceId: 'edr-crowdstrike',
      sourceKind: 'endpoint',
      outcome: 'blocked',
      host: host.host,
      srcIp: host.ip,
      user,
      service: 'malware',
      mitre: { id: 'T1204.002', tactic: 'Execution', technique: 'Malicious File' },
    };
  }
  const geo = externalGeo();
  return {
    ts: now,
    severity: 'low',
    eventType: 'remote_logon',
    message: `Remote logon for ${user} on ${host.host} from ${geo.ip}`,
    sourceId: 'edr-crowdstrike',
    sourceKind: 'endpoint',
    outcome: 'success',
    host: host.host,
    srcIp: geo.ip,
    user,
    service: 'identity',
    country: geo.country,
    city: geo.city,
  };
}

function noiseIdentity(now: number): Draft {
  const user = pick(USERS);
  const host = internalHost();
  const roll = Math.random();
  const geo = externalGeo();

  if (roll < 0.62) {
    const internal = chance(0.92);
    return {
      ts: now,
      severity: 'info',
      eventType: 'signin_success',
      message: `Successful sign-in for ${user} via Okta Verify${internal ? '' : ` from ${geo.city}, ${geo.country}`}`,
      sourceId: 'idp-okta',
      sourceKind: 'identity',
      outcome: 'success',
      srcIp: internal ? host.ip : geo.ip,
      user,
      host: internal ? host.host : undefined,
      service: 'okta',
      country: internal ? undefined : geo.country,
      city: internal ? undefined : geo.city,
      action: 'signin',
    };
  }
  if (roll < 0.84) {
    const external = chance(0.8);
    return {
      ts: now,
      severity: 'low',
      eventType: 'auth_failure',
      message: external
        ? `Failed sign-in for ${user} from ${geo.ip} (invalid password)`
        : `Failed sign-in for ${user} (invalid password)`,
      sourceId: 'idp-okta',
      sourceKind: 'identity',
      outcome: 'failure',
      srcIp: external ? geo.ip : host.ip,
      user,
      service: 'okta',
      country: external ? geo.country : undefined,
      city: external ? geo.city : undefined,
      action: 'signin',
    };
  }
  if (roll < 0.94) {
    return {
      ts: now,
      severity: 'medium',
      eventType: 'mfa_denied',
      message: `MFA challenge denied for ${user} (push notification)`,
      sourceId: 'idp-okta',
      sourceKind: 'identity',
      outcome: 'failure',
      srcIp: host.ip,
      user,
      host: host.host,
      service: 'mfa',
      action: 'mfa_challenge',
    };
  }
  return {
    ts: now,
    severity: 'low',
    eventType: 'device_enrolled',
    message: `New device enrolled for ${user}: ${pick(['Windows 11', 'macOS 15', 'Ubuntu 24.04'])} / Chrome 128`,
    sourceId: 'idp-okta',
    sourceKind: 'identity',
    outcome: 'success',
    srcIp: host.ip,
    user,
    service: 'okta',
  };
}

function noiseCloud(now: number): Draft {
  const k8s = chance(0.18);
  if (k8s) {
    const pod = `api-${randomHex(4)}`;
    return {
      ts: now,
      severity: chance(0.9) ? 'info' : 'low',
      eventType: 'k8s_audit',
      message: `Pod exec: ${pick(SERVICE_ACCOUNTS)} → ${pod} (namespace: prod)`,
      sourceId: 'k8s-audit',
      sourceKind: 'cloud',
      outcome: 'success',
      user: pick(SERVICE_ACCOUNTS),
      service: 'k8s',
      host: 'K8S-NODE-3',
      action: 'pod_exec',
    };
  }
  const svc = pick(SERVICE_ACCOUNTS);
  const roll = Math.random();

  if (roll < 0.58) {
    return {
      ts: now,
      severity: 'info',
      eventType: 'assume_role',
      message: `AssumeRole succeeded for ${svc} (role: ${pick(AWS_ROLES)})`,
      sourceId: 'aws-cloudtrail',
      sourceKind: 'cloud',
      outcome: 'success',
      user: svc,
      service: 'sts',
      action: 'AssumeRole',
    };
  }
  if (roll < 0.85) {
    return {
      ts: now,
      severity: 'info',
      eventType: 's3_access',
      message: `S3 GetObject s3://${pick(AWS_BUCKETS)}/${randomHex(4)}/export-${int(100, 999)}.parquet 200`,
      sourceId: 'aws-cloudtrail',
      sourceKind: 'cloud',
      outcome: 'success',
      user: svc,
      service: 's3',
      bytesOut: int(10_000, 24_000_000),
      action: 'GetObject',
    };
  }
  if (roll < 0.94) {
    return {
      ts: now,
      severity: 'info',
      eventType: 'console_login',
      message: `Console login succeeded for ${svc} from ${internalHost().ip}`,
      sourceId: 'aws-cloudtrail',
      sourceKind: 'cloud',
      outcome: 'success',
      user: svc,
      service: 'console',
      srcIp: internalHost().ip,
      action: 'ConsoleLogin',
    };
  }
  return {
    ts: now,
    severity: 'medium',
    eventType: 'sg_change',
    message: `Security group sg-${randomHex(4)} modified: ingress TCP/3389 from 0.0.0.0/0`,
    sourceId: 'aws-cloudtrail',
    sourceKind: 'cloud',
    outcome: 'success',
    user: svc,
    service: 'ec2',
    action: 'AuthorizeSecurityGroupIngress',
  };
}

function noiseDns(now: number): Draft {
  const host = internalHost();
  const roll = Math.random();
  const benign = pick(BENIGN_DOMAINS);

  if (roll < 0.8) {
    return {
      ts: now,
      severity: 'info',
      eventType: 'dns_query',
      message: `A record resolved for ${benign} → ${pick(PUBLIC_DESTINATIONS)}`,
      sourceId: 'dns-umbrella',
      sourceKind: 'dns',
      outcome: 'allowed',
      srcIp: host.ip,
      host: host.host,
      service: 'dns',
      action: 'query',
    };
  }
  if (roll < 0.92) {
    return {
      ts: now,
      severity: 'low',
      eventType: 'dns_blocked',
      message: `Blocked DNS request to ${pick(MALICIOUS_DOMAINS)} (category: malware)`,
      sourceId: 'dns-umbrella',
      sourceKind: 'dns',
      outcome: 'blocked',
      srcIp: host.ip,
      host: host.host,
      service: 'dns',
      action: 'query',
    };
  }
  return {
    ts: now,
    severity: 'low',
    eventType: 'dns_nxdomain',
    message: `NXDOMAIN response for ${randomHex(6)}.${benign}`,
    sourceId: 'dns-umbrella',
    sourceKind: 'dns',
    outcome: 'failure',
    srcIp: host.ip,
    host: host.host,
    service: 'dns',
  };
}

function noiseProxy(now: number): Draft {
  const host = internalHost();
  const user = pick(USERS);
  const roll = Math.random();

  if (roll < 0.7) {
    const domain = pick(BENIGN_DOMAINS);
    const bytes = int(4_000, 2_400_000);
    return {
      ts: now,
      severity: 'info',
      eventType: 'web_request',
      message: `GET https://${domain}${domainPath()} 200 (${formatBytes(bytes)})`,
      sourceId: 'proxy-zscaler',
      sourceKind: 'proxy',
      outcome: 'allowed',
      srcIp: host.ip,
      host: host.host,
      user,
      dstIp: pick(PUBLIC_DESTINATIONS),
      dstPort: 443,
      service: 'https',
      bytesIn: bytes,
      action: 'GET',
    };
  }
  if (roll < 0.86) {
    const domain = pick(BENIGN_DOMAINS);
    return {
      ts: now,
      severity: 'info',
      eventType: 'web_request',
      message: `POST https://${domain}/api/v1/events (${formatBytes(int(2_000, 240_000))})`,
      sourceId: 'proxy-zscaler',
      sourceKind: 'proxy',
      outcome: 'allowed',
      srcIp: host.ip,
      host: host.host,
      user,
      dstPort: 443,
      service: 'https',
      action: 'POST',
    };
  }
  if (roll < 0.95) {
    const domain = pick(MALICIOUS_DOMAINS);
    return {
      ts: now,
      severity: 'low',
      eventType: 'web_blocked',
      message: `Blocked request to ${domain} (policy: advanced-threat)`,
      sourceId: 'proxy-zscaler',
      sourceKind: 'proxy',
      outcome: 'blocked',
      srcIp: host.ip,
      host: host.host,
      user,
      service: 'https',
      action: 'CONNECT',
    };
  }
  const domain = pick(BENIGN_DOMAINS);
  const bytes = int(8_000_000, 42_000_000);
  return {
    ts: now,
    severity: 'low',
    eventType: 'large_download',
    message: `Large download from ${domain} (${formatBytes(bytes)}) by ${user}`,
    sourceId: 'proxy-zscaler',
    sourceKind: 'proxy',
    outcome: 'allowed',
    srcIp: host.ip,
    host: host.host,
    user,
    service: 'https',
    bytesIn: bytes,
    action: 'GET',
  };
}

export function generateNoiseEvent(now: number): LogEvent {
  const source = pickWeighted(SOURCE_SEEDS);
  let draft: Draft;
  switch (source.kind) {
    case 'firewall':
      draft = noiseFirewall(now);
      break;
    case 'endpoint':
      draft = noiseEndpoint(now);
      break;
    case 'identity':
      draft = noiseIdentity(now);
      break;
    case 'cloud':
      draft = noiseCloud(now);
      break;
    case 'dns':
      draft = noiseDns(now);
      break;
    case 'proxy':
      draft = noiseProxy(now);
      break;
  }
  return toLogEvent(draft);
}

export function generateNoiseBatch(now: number, count: number): LogEvent[] {
  const events: LogEvent[] = [];
  for (let i = 0; i < count; i += 1) {
    events.push(generateNoiseEvent(now - int(0, 900)));
  }
  return events.sort((a, b) => a.ts - b.ts);
}

export interface ScenarioResult {
  key: string;
  label: string;
  events: LogEvent[];
}

const SCENARIO_LABELS: Record<string, string> = {
  brute_force: 'Brute-force sign-in campaign',
  port_scan: 'External port scan',
  malware: 'Ransomware execution',
  exfiltration: 'Data exfiltration attempt',
  c2: 'C2 beaconing',
  cloud_iam: 'Cloud IAM abuse',
};

export function scenarioLabel(scenario: string): string {
  return SCENARIO_LABELS[scenario] ?? scenario;
}

export function buildScenarioEvents(scenario: string, now: number): ScenarioResult {
  const events: LogEvent[] = [];
  const push = (draft: Draft) => events.push(toLogEvent(draft));
  const geo = externalGeo();

  switch (scenario) {
    case 'brute_force': {
      const targetUser = 'j.mensah';
      for (let i = 0; i < 14; i += 1) {
        push({
          ts: now - 60_000 + i * 3_500,
          severity: i > 9 ? 'medium' : 'low',
          eventType: 'auth_failure',
          message: `Failed sign-in for ${targetUser} (invalid password) from ${geo.ip}`,
          sourceId: 'idp-okta',
          sourceKind: 'identity',
          outcome: 'failure',
          srcIp: geo.ip,
          srcPort: geo.port,
          user: targetUser,
          host: 'FIN-WS-0142',
          service: 'okta',
          country: geo.country,
          city: geo.city,
          action: 'signin',
        });
      }
      push({
        ts: now - 6_000,
        severity: 'high',
        eventType: 'signin_success',
        message: `Successful sign-in for ${targetUser} after 14 failures from ${geo.ip}`,
        sourceId: 'idp-okta',
        sourceKind: 'identity',
        outcome: 'success',
        srcIp: geo.ip,
        srcPort: geo.port,
        user: targetUser,
        host: 'FIN-WS-0142',
        service: 'okta',
        country: geo.country,
        city: geo.city,
        action: 'signin',
        mitre: { id: 'T1110', tactic: 'Credential Access', technique: 'Brute Force' },
      });
      break;
    }
    case 'port_scan': {
      for (let i = 0; i < 24; i += 1) {
        const port = [21, 22, 23, 25, 53, 80, 135, 139, 443, 445, 1433, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 9200][i % 19];
        push({
          ts: now - 45_000 + i * 1_400,
          severity: 'low',
          eventType: 'conn_denied',
          message: `Denied inbound TCP/${port} from ${geo.ip} (policy: edge-block, scan suspicion)`,
          sourceId: 'fw-edge-01',
          sourceKind: 'firewall',
          outcome: 'blocked',
          srcIp: geo.ip,
          srcPort: int(1024, 65000),
          dstIp: '52.16.44.10',
          dstPort: port,
          service: 'tcp',
          country: geo.country,
          city: geo.city,
          action: 'deny',
          mitre: { id: 'T1046', tactic: 'Discovery', technique: 'Network Service Discovery' },
        });
      }
      break;
    }
    case 'malware': {
      const host = 'FIN-WS-0142';
      push({
        ts: now - 90_000,
        severity: 'high',
        eventType: 'suspicious_process',
        message: `Process tree anomaly: winword.exe → powershell.exe -enc on ${host}`,
        sourceId: 'edr-crowdstrike',
        sourceKind: 'endpoint',
        outcome: 'allowed',
        host,
        srcIp: '10.20.14.42',
        user: 'j.mensah',
        service: 'process',
        mitre: { id: 'T1059.001', tactic: 'Execution', technique: 'PowerShell' },
      });
      push({
        ts: now - 70_000,
        severity: 'critical',
        eventType: 'shadow_copy_delete',
        message: `Shadow copy deletion attempted: vssadmin delete shadows /all /quiet on ${host}`,
        sourceId: 'edr-crowdstrike',
        sourceKind: 'endpoint',
        outcome: 'blocked',
        host,
        srcIp: '10.20.14.42',
        user: 'j.mensah',
        service: 'process',
        mitre: { id: 'T1490', tactic: 'Impact', technique: 'Inhibit System Recovery' },
      });
      push({
        ts: now - 50_000,
        severity: 'critical',
        eventType: 'malware_detected',
        message: `Ransomware behavior detected and quarantined on ${host}: LockBit.Ransom`,
        sourceId: 'edr-crowdstrike',
        sourceKind: 'endpoint',
        outcome: 'blocked',
        host,
        srcIp: '10.20.14.42',
        user: 'j.mensah',
        service: 'malware',
        mitre: { id: 'T1486', tactic: 'Impact', technique: 'Data Encrypted for Impact' },
      });
      push({
        ts: now - 48_000,
        severity: 'high',
        eventType: 'file_write',
        message: `Mass file rename detected: 1,284 files renamed to .locked on ${host}`,
        sourceId: 'edr-crowdstrike',
        sourceKind: 'endpoint',
        outcome: 'allowed',
        host,
        srcIp: '10.20.14.42',
        user: 'j.mensah',
        service: 'file',
      });
      break;
    }
    case 'exfiltration': {
      const domain = 'files.sharepoint-sync.net';
      const bytes = 64_200_000 + int(0, 8_000_000);
      push({
        ts: now - 130_000,
        severity: 'medium',
        eventType: 'web_request',
        message: `Outbound session from DB-SRV-02 exceeded baseline by 18x`,
        sourceId: 'proxy-zscaler',
        sourceKind: 'proxy',
        outcome: 'allowed',
        srcIp: '10.20.2.24',
        host: 'DB-SRV-02',
        user: 'svc-backup',
        dstIp: geo.ip,
        dstPort: 443,
        service: 'https',
        country: geo.country,
        city: geo.city,
        bytesOut: 2_400_000,
        action: 'POST',
      });
      push({
        ts: now - 90_000,
        severity: 'high',
        eventType: 'archive_created',
        message: `Archive created: customers_2026Q3.7z (${formatBytes(bytes)}) on DB-SRV-02`,
        sourceId: 'edr-crowdstrike',
        sourceKind: 'endpoint',
        outcome: 'allowed',
        host: 'DB-SRV-02',
        srcIp: '10.20.2.24',
        user: 'svc-backup',
        service: 'file',
        bytesOut: bytes,
      });
      push({
        ts: now - 60_000,
        severity: 'critical',
        eventType: 'data_upload',
        message: `${formatBytes(bytes)} uploaded to ${domain} (uncategorized) over HTTPS`,
        sourceId: 'proxy-zscaler',
        sourceKind: 'proxy',
        outcome: 'allowed',
        srcIp: '10.20.2.24',
        host: 'DB-SRV-02',
        user: 'svc-backup',
        dstIp: geo.ip,
        dstPort: 443,
        service: 'https',
        country: geo.country,
        city: geo.city,
        bytesOut: bytes,
        mitre: { id: 'T1041', tactic: 'Exfiltration', technique: 'Exfiltration Over C2 Channel' },
        action: 'POST',
      });
      break;
    }
    case 'c2': {
      const domain = 'api.beacon-sync.io';
      for (let i = 0; i < 6; i += 1) {
        push({
          ts: now - 120_000 + i * 18_000,
          severity: 'high',
          eventType: 'c2_beacon',
          message: `Periodic HTTPS POST to ${domain} (uncategorized) from ENG-MBP-0088`,
          sourceId: 'proxy-zscaler',
          sourceKind: 'proxy',
          outcome: 'allowed',
          srcIp: '10.20.8.88',
          host: 'ENG-MBP-0088',
          user: 'a.owusu',
          dstIp: geo.ip,
          dstPort: 443,
          service: 'https',
          country: geo.country,
          city: geo.city,
          bytesOut: int(400, 2_400),
          mitre: { id: 'T1071.001', tactic: 'Command and Control', technique: 'Web Protocols' },
          action: 'POST',
        });
      }
      push({
        ts: now - 15_000,
        severity: 'medium',
        eventType: 'dns_query',
        message: `TXT query for ${randomHex(12)}.${domain} from ENG-MBP-0088`,
        sourceId: 'dns-umbrella',
        sourceKind: 'dns',
        outcome: 'allowed',
        srcIp: '10.20.8.88',
        host: 'ENG-MBP-0088',
        user: 'a.owusu',
        service: 'dns',
      });
      break;
    }
    case 'cloud_iam': {
      push({
        ts: now - 80_000,
        severity: 'high',
        eventType: 'iam_change',
        message: `CreateAccessKey for user deploy-bot requested by svc-terraform from ${geo.ip}`,
        sourceId: 'aws-cloudtrail',
        sourceKind: 'cloud',
        outcome: 'success',
        user: 'svc-terraform',
        srcIp: geo.ip,
        service: 'iam',
        country: geo.country,
        city: geo.city,
        mitre: { id: 'T1098', tactic: 'Persistence', technique: 'Account Manipulation' },
        action: 'CreateAccessKey',
      });
      push({
        ts: now - 50_000,
        severity: 'high',
        eventType: 'iam_change',
        message: `AttachUserPolicy: AdministratorAccess attached to deploy-bot`,
        sourceId: 'aws-cloudtrail',
        sourceKind: 'cloud',
        outcome: 'success',
        user: 'svc-terraform',
        srcIp: geo.ip,
        service: 'iam',
        country: geo.country,
        city: geo.city,
        mitre: { id: 'T1098', tactic: 'Persistence', technique: 'Account Manipulation' },
        action: 'AttachUserPolicy',
      });
      push({
        ts: now - 30_000,
        severity: 'high',
        eventType: 'root_login',
        message: 'Root console login without MFA from 198.98.56.33',
        sourceId: 'aws-cloudtrail',
        sourceKind: 'cloud',
        outcome: 'success',
        user: 'root',
        srcIp: '198.98.56.33',
        service: 'console',
        country: 'United States',
        city: 'Ashburn',
        mitre: { id: 'T1078', tactic: 'Privilege Escalation', technique: 'Valid Accounts' },
        action: 'ConsoleLogin',
      });
      break;
    }
    default: {
      events.push(...generateNoiseBatch(now, 6));
    }
  }

  return {
    key: scenario,
    label: scenarioLabel(scenario),
    events: events.sort((a, b) => a.ts - b.ts),
  };
}

export function scenarioKinds(): Record<string, string[]> {
  return {
    brute_force: ['auth_failure', 'signin_success'],
    port_scan: ['conn_denied'],
    malware: ['malware_detected'],
    exfiltration: ['data_upload'],
    c2: ['c2_beacon'],
    cloud_iam: ['iam_change', 'root_login'],
  };
}
