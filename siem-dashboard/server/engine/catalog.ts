import type { Severity, SourceKind } from '../../shared/types.ts';

export interface SourceSeed {
  id: string;
  name: string;
  kind: SourceKind;
  vendor: string;
  weight: number;
  status: 'healthy' | 'degraded' | 'offline';
  errorRatePct: number;
}

export const SOURCE_SEEDS: SourceSeed[] = [
  {
    id: 'fw-edge-01',
    name: 'fw-edge-01',
    kind: 'firewall',
    vendor: 'Palo Alto PA-5220',
    weight: 0.24,
    status: 'healthy',
    errorRatePct: 0.02,
  },
  {
    id: 'edr-crowdstrike',
    name: 'edr-fleet',
    kind: 'endpoint',
    vendor: 'CrowdStrike Falcon',
    weight: 0.17,
    status: 'healthy',
    errorRatePct: 0.04,
  },
  {
    id: 'idp-okta',
    name: 'idp-okta',
    kind: 'identity',
    vendor: 'Okta Workforce',
    weight: 0.16,
    status: 'healthy',
    errorRatePct: 0.01,
  },
  {
    id: 'aws-cloudtrail',
    name: 'aws-cloudtrail',
    kind: 'cloud',
    vendor: 'AWS CloudTrail',
    weight: 0.18,
    status: 'healthy',
    errorRatePct: 0.03,
  },
  {
    id: 'dns-umbrella',
    name: 'dns-umbrella',
    kind: 'dns',
    vendor: 'Cisco Umbrella',
    weight: 0.12,
    status: 'degraded',
    errorRatePct: 2.1,
  },
  {
    id: 'proxy-zscaler',
    name: 'proxy-zscaler',
    kind: 'proxy',
    vendor: 'Zscaler Internet Access',
    weight: 0.08,
    status: 'healthy',
    errorRatePct: 0.06,
  },
  {
    id: 'k8s-audit',
    name: 'k8s-audit',
    kind: 'cloud',
    vendor: 'Kubernetes Audit Log',
    weight: 0.05,
    status: 'healthy',
    errorRatePct: 0.01,
  },
  {
    id: 'vpn-asa-legacy',
    name: 'vpn-asa-legacy',
    kind: 'firewall',
    vendor: 'Cisco ASA 5506-X',
    weight: 0,
    status: 'offline',
    errorRatePct: 0,
  },
];

export const SOURCE_BY_ID = new Map(SOURCE_SEEDS.map((source) => [source.id, source]));

export interface CountrySeed {
  country: string;
  flag: string;
  weight: number;
  cities: string[];
}

export const COUNTRIES: CountrySeed[] = [
  { country: 'Netherlands', flag: '🇳🇱', weight: 0.16, cities: ['Amsterdam', 'Rotterdam'] },
  { country: 'Russia', flag: '🇷🇺', weight: 0.15, cities: ['Moscow', 'Saint Petersburg'] },
  { country: 'China', flag: '🇨🇳', weight: 0.13, cities: ['Beijing', 'Shanghai'] },
  { country: 'United States', flag: '🇺🇸', weight: 0.12, cities: ['Ashburn', 'San Jose'] },
  { country: 'Nigeria', flag: '🇳🇬', weight: 0.09, cities: ['Lagos', 'Abuja'] },
  { country: 'Brazil', flag: '🇧🇷', weight: 0.07, cities: ['São Paulo'] },
  { country: 'Germany', flag: '🇩🇪', weight: 0.06, cities: ['Frankfurt'] },
  { country: 'Iran', flag: '🇮🇷', weight: 0.05, cities: ['Tehran'] },
  { country: 'India', flag: '🇮🇳', weight: 0.05, cities: ['Mumbai', 'Bengaluru'] },
  { country: 'Romania', flag: '🇷🇴', weight: 0.04, cities: ['Bucharest'] },
  { country: 'Ghana', flag: '🇬🇭', weight: 0.03, cities: ['Accra', 'Kumasi'] },
  { country: 'United Kingdom', flag: '🇬🇧', weight: 0.02, cities: ['London'] },
  { country: 'Vietnam', flag: '🇻🇳', weight: 0.02, cities: ['Hanoi'] },
  { country: 'Singapore', flag: '🇸🇬', weight: 0.01, cities: ['Singapore'] },
];

export const COUNTRY_BY_NAME = new Map(COUNTRIES.map((country) => [country.country, country]));

export const EXTERNAL_IPS: Record<string, string[]> = {
  Netherlands: ['185.220.101.44', '45.137.21.9', '91.211.88.14'],
  Russia: ['45.9.148.21', '194.26.29.113', '5.188.206.74'],
  China: ['116.31.116.7', '61.177.172.14', '222.186.30.112'],
  'United States': ['104.244.72.18', '198.98.56.33', '23.129.64.190'],
  Nigeria: ['105.112.42.18', '197.210.53.7', '41.58.44.92'],
  Brazil: ['177.54.144.22', '191.96.42.15'],
  Germany: ['49.12.88.201', '159.69.22.9'],
  Iran: ['185.51.200.55', '5.144.130.22'],
  India: ['103.145.13.7', '43.241.63.18'],
  Romania: ['86.104.193.11', '188.119.113.42'],
  Ghana: ['154.160.20.14', '129.205.32.7'],
  'United Kingdom': ['51.89.14.22', '185.86.150.9'],
  Vietnam: ['113.161.76.8', '103.90.224.11'],
  Singapore: ['103.15.28.18', '128.199.100.6'],
};

export const INTERNAL_HOSTS = [
  { host: 'FIN-WS-0142', ip: '10.20.14.42', dept: 'Finance' },
  { host: 'ENG-MBP-0088', ip: '10.20.8.88', dept: 'Engineering' },
  { host: 'DC-SRV-01', ip: '10.20.1.10', dept: 'Infrastructure' },
  { host: 'K8S-NODE-3', ip: '10.20.30.13', dept: 'Platform' },
  { host: 'HR-LT-2210', ip: '10.20.22.110', dept: 'People' },
  { host: 'DB-SRV-02', ip: '10.20.2.24', dept: 'Data' },
  { host: 'SEC-JUMP-01', ip: '10.20.99.5', dept: 'Security' },
];

export const USERS = [
  'j.mensah',
  'a.owusu',
  'k.appiah',
  's.nkrumah',
  'm.boateng',
  't.adjei',
  'r.quaye',
  'e.asante',
];

export const SERVICE_ACCOUNTS = ['svc-deploy', 'svc-backup', 'svc-terraform'];

export const ANALYSTS = ['D. Mensah', 'A. Owusu', 'K. Appiah', 'S. Nkrumah'];

export const INTERNAL_SERVICES: Record<SourceKind, string[]> = {
  firewall: ['ssl', 'ssh', 'rdp', 'smb', 'dns', 'http'],
  endpoint: ['process', 'file', 'registry', 'network'],
  identity: ['okta', 'mfa', 'sso'],
  cloud: ['iam', 's3', 'ec2', 'lambda', 'sts'],
  dns: ['dns', 'doh'],
  proxy: ['http', 'https', 'ftp'],
};

export const MALICIOUS_DOMAINS = [
  'update-checker.cdn-delivery.net',
  'login-portal.secure-authz.com',
  'api.beacon-sync.io',
  'cdn.static-assets.ru',
  'files.sharepoint-sync.net',
];

export const BENIGN_DOMAINS = [
  'api.github.com',
  'login.microsoftonline.com',
  'api.stripe.com',
  'cdn.jsdelivr.net',
  's3.amazonaws.com',
  'registry.npmjs.org',
  'graph.facebook.com',
  'slack.com',
  'api.linear.app',
  'fonts.gstatic.com',
];

export type RuleKind =
  | 'brute_force'
  | 'port_scan'
  | 'malware'
  | 'c2'
  | 'exfil'
  | 'impossible_travel'
  | 'cloud_iam'
  | 'dns_tunnel'
  | 'lateral'
  | 'canary'
  | 'root_login'
  | 'dormant'
  | 'legacy_tls';

export interface RuleSeed {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  enabled: boolean;
  mitre: { id: string; tactic: string; technique: string };
  threshold: string;
  logSource: string;
  kind: RuleKind;
  seedMatches: number;
}

export const RULE_SEEDS: RuleSeed[] = [
  {
    id: 'rule-bruteforce',
    name: 'Brute-force sign-in attack',
    description:
      'Detects repeated failed authentication attempts against the identity provider from a single source address, followed by a successful sign-in.',
    severity: 'high',
    enabled: true,
    mitre: { id: 'T1110', tactic: 'Credential Access', technique: 'Brute Force' },
    threshold: '> 6 failures from one IP in 2 minutes',
    logSource: 'Identity · Okta',
    kind: 'brute_force',
    seedMatches: 14,
  },
  {
    id: 'rule-portscan',
    name: 'Network port scan',
    description:
      'Correlates denied inbound connections across multiple destination ports from a single external source within a short window.',
    severity: 'medium',
    enabled: true,
    mitre: { id: 'T1046', tactic: 'Discovery', technique: 'Network Service Discovery' },
    threshold: '> 15 denied connections from one IP in 60 seconds',
    logSource: 'Firewall · Palo Alto',
    kind: 'port_scan',
    seedMatches: 31,
  },
  {
    id: 'rule-malware',
    name: 'Ransomware behavior on endpoint',
    description:
      'High-confidence EDR verdict for ransomware-like behavior, including mass file encryption and shadow copy deletion attempts.',
    severity: 'critical',
    enabled: true,
    mitre: { id: 'T1486', tactic: 'Impact', technique: 'Data Encrypted for Impact' },
    threshold: 'EDR verdict = malicious (high confidence)',
    logSource: 'Endpoint · CrowdStrike',
    kind: 'malware',
    seedMatches: 3,
  },
  {
    id: 'rule-c2',
    name: 'C2 beaconing to untrusted host',
    description:
      'Flags periodic outbound callbacks with jitter to uncategorized or newly registered infrastructure indicative of command-and-control.',
    severity: 'high',
    enabled: true,
    mitre: { id: 'T1071.001', tactic: 'Command and Control', technique: 'Web Protocols' },
    threshold: '3+ periodic callbacks (±10% jitter) in 5 minutes',
    logSource: 'Web Proxy · Zscaler',
    kind: 'c2',
    seedMatches: 9,
  },
  {
    id: 'rule-exfil',
    name: 'Large data upload to untrusted destination',
    description:
      'Detects unusually large outbound transfers from database or file servers to destinations with low reputation scores.',
    severity: 'critical',
    enabled: true,
    mitre: { id: 'T1041', tactic: 'Exfiltration', technique: 'Exfiltration Over C2 Channel' },
    threshold: '> 50 MB outbound to an uncategorized domain',
    logSource: 'Web Proxy · Zscaler',
    kind: 'exfil',
    seedMatches: 2,
  },
  {
    id: 'rule-impossible-travel',
    name: 'Impossible travel sign-in',
    description:
      'Two successful authentications for the same identity from geographically distant locations within a time window that precludes physical travel.',
    severity: 'medium',
    enabled: true,
    mitre: { id: 'T1078', tactic: 'Defense Evasion', technique: 'Valid Accounts' },
    threshold: 'Distance > 500 km within 30 minutes',
    logSource: 'Identity · Okta',
    kind: 'impossible_travel',
    seedMatches: 6,
  },
  {
    id: 'rule-cloud-iam',
    name: 'Cloud IAM privilege change',
    description:
      'Monitors for CreateAccessKey, AttachUserPolicy, and CreateLoginProfile calls made outside of the approved change window.',
    severity: 'high',
    enabled: true,
    mitre: { id: 'T1098', tactic: 'Persistence', technique: 'Account Manipulation' },
    threshold: 'IAM mutation from a non-baselined principal',
    logSource: 'Cloud · AWS CloudTrail',
    kind: 'cloud_iam',
    seedMatches: 8,
  },
  {
    id: 'rule-dns-tunnel',
    name: 'DNS tunneling suspected',
    description:
      'Identifies high-entropy subdomain labels and abnormally long DNS queries consistent with data encoding over DNS.',
    severity: 'medium',
    enabled: true,
    mitre: { id: 'T1071.004', tactic: 'Command and Control', technique: 'DNS' },
    threshold: '> 40 high-entropy queries in 60 seconds',
    logSource: 'DNS · Cisco Umbrella',
    kind: 'dns_tunnel',
    seedMatches: 5,
  },
  {
    id: 'rule-lateral',
    name: 'Lateral movement via SMB',
    description:
      'Correlates failed SMB authentication against administrative shares across multiple hosts from a single source.',
    severity: 'high',
    enabled: true,
    mitre: { id: 'T1021.002', tactic: 'Lateral Movement', technique: 'SMB / Windows Admin Shares' },
    threshold: 'Failed SMB auth across 3+ hosts in 5 minutes',
    logSource: 'Endpoint · CrowdStrike',
    kind: 'lateral',
    seedMatches: 7,
  },
  {
    id: 'rule-canary',
    name: 'Canary token accessed',
    description:
      'A decoy document or honeytoken was opened. Any interaction is treated as unauthorized access with high confidence.',
    severity: 'critical',
    enabled: true,
    mitre: { id: 'T1486', tactic: 'Impact', technique: 'Data Encrypted for Impact' },
    threshold: 'Decoy file opened on a file server',
    logSource: 'Endpoint · CrowdStrike',
    kind: 'canary',
    seedMatches: 1,
  },
  {
    id: 'rule-root',
    name: 'Root console login',
    description:
      'Detects AWS root account console authentication. Root access must only be used for a documented, approved break-glass procedure.',
    severity: 'high',
    enabled: true,
    mitre: { id: 'T1078', tactic: 'Privilege Escalation', technique: 'Valid Accounts' },
    threshold: 'Root account console login detected',
    logSource: 'Cloud · AWS CloudTrail',
    kind: 'root_login',
    seedMatches: 4,
  },
  {
    id: 'rule-dormant',
    name: 'Dormant account reactivation',
    description:
      'Alerts when an identity that has not authenticated in more than 90 days successfully signs in.',
    severity: 'low',
    enabled: false,
    mitre: { id: 'T1078', tactic: 'Initial Access', technique: 'Valid Accounts' },
    threshold: 'Successful sign-in after 90 days of inactivity',
    logSource: 'Identity · Okta',
    kind: 'dormant',
    seedMatches: 2,
  },
  {
    id: 'rule-legacy-tls',
    name: 'Deprecated TLS handshake',
    description:
      'Observes TLS 1.0 / 1.1 handshakes on the perimeter, which may indicate legacy clients or downgrade attempts.',
    severity: 'low',
    enabled: false,
    mitre: { id: 'T1040', tactic: 'Collection', technique: 'Network Sniffing' },
    threshold: 'TLS version < 1.2 on edge firewall',
    logSource: 'Firewall · Palo Alto',
    kind: 'legacy_tls',
    seedMatches: 11,
  },
];

export interface AlertSeed {
  id: string;
  ruleId: string;
  minutesAgo: number;
  status: 'open' | 'investigating' | 'resolved';
  assignee?: string;
  eventCount: number;
  entities: { type: 'ip' | 'user' | 'host' | 'service'; value: string; country?: string }[];
  timeline: { minutesAgo: number; severity: Severity; message: string; sourceId: string }[];
}

export const ALERT_SEEDS: AlertSeed[] = [
  {
    id: 'ALT-1042',
    ruleId: 'rule-malware',
    minutesAgo: 14,
    status: 'open',
    eventCount: 26,
    entities: [
      { type: 'host', value: 'FIN-WS-0142' },
      { type: 'user', value: 'j.mensah' },
      { type: 'ip', value: '10.20.14.42' },
    ],
    timeline: [
      { minutesAgo: 14, severity: 'high', message: 'Suspicious process tree: winword.exe → powershell.exe -enc on FIN-WS-0142', sourceId: 'edr-crowdstrike' },
      { minutesAgo: 13, severity: 'critical', message: 'Shadow copy deletion attempted: vssadmin delete shadows /all /quiet', sourceId: 'edr-crowdstrike' },
      { minutesAgo: 13, severity: 'critical', message: 'Mass file rename detected: 1,284 files with .locked extension', sourceId: 'edr-crowdstrike' },
      { minutesAgo: 12, severity: 'high', message: 'Ransom note dropped in 14 directories: README_RESTORE.txt', sourceId: 'edr-crowdstrike' },
    ],
  },
  {
    id: 'ALT-1041',
    ruleId: 'rule-c2',
    minutesAgo: 38,
    status: 'investigating',
    assignee: 'A. Owusu',
    eventCount: 47,
    entities: [
      { type: 'host', value: 'ENG-MBP-0088' },
      { type: 'ip', value: '185.220.101.44', country: 'Netherlands' },
      { type: 'user', value: 'a.owusu' },
    ],
    timeline: [
      { minutesAgo: 42, severity: 'medium', message: 'Beacon interval detected every 62s (±4%) from ENG-MBP-0088', sourceId: 'proxy-zscaler' },
      { minutesAgo: 38, severity: 'high', message: 'Periodic HTTPS POST to update-checker.cdn-delivery.net (uncategorized)', sourceId: 'proxy-zscaler' },
      { minutesAgo: 36, severity: 'high', message: 'TLS JA3 fingerprint matches known Cobalt Strike profile', sourceId: 'proxy-zscaler' },
    ],
  },
  {
    id: 'ALT-1040',
    ruleId: 'rule-exfil',
    minutesAgo: 66,
    status: 'open',
    eventCount: 12,
    entities: [
      { type: 'host', value: 'DB-SRV-02' },
      { type: 'user', value: 'svc-backup' },
      { type: 'ip', value: '45.137.21.9', country: 'Netherlands' },
    ],
    timeline: [
      { minutesAgo: 68, severity: 'medium', message: 'Outbound session from DB-SRV-02 exceeded baseline by 18x', sourceId: 'proxy-zscaler' },
      { minutesAgo: 66, severity: 'critical', message: '64.2 MB uploaded to files.sharepoint-sync.net over HTTPS', sourceId: 'proxy-zscaler' },
      { minutesAgo: 65, severity: 'high', message: 'Archive creation observed: customers_2026Q3.7z on DB-SRV-02', sourceId: 'edr-crowdstrike' },
    ],
  },
  {
    id: 'ALT-1039',
    ruleId: 'rule-bruteforce',
    minutesAgo: 112,
    status: 'investigating',
    assignee: 'K. Appiah',
    eventCount: 38,
    entities: [
      { type: 'ip', value: '45.9.148.21', country: 'Russia' },
      { type: 'user', value: 'j.mensah' },
    ],
    timeline: [
      { minutesAgo: 118, severity: 'medium', message: '28 failed sign-ins for j.mensah from 45.9.148.21', sourceId: 'idp-okta' },
      { minutesAgo: 112, severity: 'high', message: 'Successful sign-in after 31 failures — MFA push denied twice', sourceId: 'idp-okta' },
      { minutesAgo: 110, severity: 'high', message: 'New device enrolled: Windows 11 / unmanged endpoint', sourceId: 'idp-okta' },
    ],
  },
  {
    id: 'ALT-1038',
    ruleId: 'rule-cloud-iam',
    minutesAgo: 178,
    status: 'open',
    eventCount: 6,
    entities: [
      { type: 'user', value: 'svc-terraform' },
      { type: 'service', value: 'IAM' },
    ],
    timeline: [
      { minutesAgo: 181, severity: 'medium', message: 'CreateAccessKey for user deploy-bot from 103.15.28.18 (Singapore)', sourceId: 'aws-cloudtrail' },
      { minutesAgo: 178, severity: 'high', message: 'AttachUserPolicy: AdministratorAccess attached to deploy-bot', sourceId: 'aws-cloudtrail' },
      { minutesAgo: 177, severity: 'medium', message: 'Console login without MFA for deploy-bot', sourceId: 'aws-cloudtrail' },
    ],
  },
  {
    id: 'ALT-1037',
    ruleId: 'rule-portscan',
    minutesAgo: 254,
    status: 'resolved',
    assignee: 'D. Mensah',
    eventCount: 214,
    entities: [
      { type: 'ip', value: '61.177.172.14', country: 'China' },
      { type: 'service', value: 'fw-edge-01' },
    ],
    timeline: [
      { minutesAgo: 262, severity: 'medium', message: 'Sequential probes on ports 21-9000 from 61.177.172.14', sourceId: 'fw-edge-01' },
      { minutesAgo: 254, severity: 'medium', message: '214 denied connections in 4 minutes; source blocked at edge', sourceId: 'fw-edge-01' },
    ],
  },
  {
    id: 'ALT-1036',
    ruleId: 'rule-impossible-travel',
    minutesAgo: 322,
    status: 'resolved',
    assignee: 'D. Mensah',
    eventCount: 4,
    entities: [
      { type: 'user', value: 's.nkrumah' },
      { type: 'ip', value: '104.244.72.18', country: 'United States' },
      { type: 'ip', value: '154.160.20.14', country: 'Ghana' },
    ],
    timeline: [
      { minutesAgo: 330, severity: 'medium', message: 'Sign-in from Accra, Ghana (154.160.20.14)', sourceId: 'idp-okta' },
      { minutesAgo: 322, severity: 'medium', message: 'Sign-in from Ashburn, USA (104.244.72.18) 8 minutes later', sourceId: 'idp-okta' },
    ],
  },
  {
    id: 'ALT-1035',
    ruleId: 'rule-lateral',
    minutesAgo: 436,
    status: 'resolved',
    assignee: 'A. Owusu',
    eventCount: 19,
    entities: [
      { type: 'host', value: 'DC-SRV-01' },
      { type: 'host', value: 'HR-LT-2210' },
      { type: 'user', value: 'm.boateng' },
    ],
    timeline: [
      { minutesAgo: 441, severity: 'high', message: 'Failed SMB authentication to IPC$ on 4 hosts within 3 minutes', sourceId: 'edr-crowdstrike' },
      { minutesAgo: 436, severity: 'high', message: 'NTLM relay attempt blocked by endpoint policy', sourceId: 'edr-crowdstrike' },
    ],
  },
  {
    id: 'ALT-1034',
    ruleId: 'rule-dns-tunnel',
    minutesAgo: 690,
    status: 'open',
    eventCount: 118,
    entities: [
      { type: 'host', value: 'K8S-NODE-3' },
      { type: 'ip', value: '116.31.116.7', country: 'China' },
    ],
    timeline: [
      { minutesAgo: 694, severity: 'medium', message: '1,200+ TXT queries with 52-char random labels from K8S-NODE-3', sourceId: 'dns-umbrella' },
      { minutesAgo: 690, severity: 'medium', message: 'Queries fan out to 14 NS records under exfil-cdn.net', sourceId: 'dns-umbrella' },
    ],
  },
  {
    id: 'ALT-1033',
    ruleId: 'rule-root',
    minutesAgo: 845,
    status: 'resolved',
    assignee: 'K. Appiah',
    eventCount: 3,
    entities: [
      { type: 'user', value: 'root' },
      { type: 'ip', value: '198.98.56.33', country: 'United States' },
    ],
    timeline: [
      { minutesAgo: 846, severity: 'high', message: 'Root console login without MFA from 198.98.56.33', sourceId: 'aws-cloudtrail' },
      { minutesAgo: 845, severity: 'high', message: 'Break-glass procedure confirmed by cloud platform team; root credentials rotated', sourceId: 'aws-cloudtrail' },
    ],
  },
  {
    id: 'ALT-1032',
    ruleId: 'rule-canary',
    minutesAgo: 1260,
    status: 'resolved',
    assignee: 'D. Mensah',
    eventCount: 2,
    entities: [
      { type: 'host', value: 'DC-SRV-01' },
      { type: 'user', value: 'svc-backup' },
    ],
    timeline: [
      { minutesAgo: 1262, severity: 'critical', message: 'Decoy file Q3_board_pack.docx opened on DC-SRV-01', sourceId: 'edr-crowdstrike' },
      { minutesAgo: 1260, severity: 'medium', message: 'Access originated from scheduled backup job; verified with platform owner', sourceId: 'edr-crowdstrike' },
    ],
  },
  {
    id: 'ALT-1031',
    ruleId: 'rule-portscan',
    minutesAgo: 1640,
    status: 'resolved',
    assignee: 'S. Nkrumah',
    eventCount: 41,
    entities: [
      { type: 'ip', value: '194.26.29.113', country: 'Russia' },
      { type: 'service', value: 'fw-edge-01' },
    ],
    timeline: [
      { minutesAgo: 1645, severity: 'medium', message: 'Stealth SYN scan on ports 22, 80, 443, 3389', sourceId: 'fw-edge-01' },
      { minutesAgo: 1640, severity: 'medium', message: 'Source blocked by edge ACL; no successful connections observed', sourceId: 'fw-edge-01' },
    ],
  },
];
