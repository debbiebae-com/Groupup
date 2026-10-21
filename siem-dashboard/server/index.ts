import express, { type Request, type Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SiemStore } from './engine/store.ts';
import { generateNoiseBatch, int } from './engine/events.ts';
import type { AlertStatus, Severity, SimScenario, SourceKind, StreamMessage } from '../shared/types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT ?? 4000);
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
app.use(express.json({ limit: '256kb' }));

const store = new SiemStore();

// ------------------------------------------------------------------ streaming

interface Client {
  id: number;
  res: Response;
}

const clients = new Map<number, Client>();
let nextClientId = 1;

function broadcast(message: StreamMessage): void {
  const payload = `event: message\ndata: ${JSON.stringify(message)}\n\n`;
  for (const client of clients.values()) {
    try {
      client.res.write(payload);
    } catch {
      clients.delete(client.id);
    }
  }
}

store.on('message', (message: StreamMessage) => broadcast(message));

// ----------------------------------------------------------------------- api

const sevValues: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
const sourceValues: SourceKind[] = ['firewall', 'endpoint', 'identity', 'cloud', 'dns', 'proxy'];
const statusValues: AlertStatus[] = ['open', 'investigating', 'resolved'];

function parseList<T extends string>(value: unknown, allowed: T[]): T[] {
  if (typeof value !== 'string' || !value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry): entry is T => allowed.includes(entry as T));
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime(), clients: clients.size });
});

app.get('/api/meta', (_req, res) => {
  res.json({
    analysts: store.analysts(),
    product: 'AEGIS SIEM',
    version: '4.8.1',
    scenarios: [
      { id: 'brute_force', label: 'Brute-force sign-in campaign', description: '14 failed logins against an executive account, then success.' },
      { id: 'port_scan', label: 'External port scan', description: '24 denied inbound connections across 19 ports.' },
      { id: 'malware', label: 'Ransomware execution', description: 'EDR detects shadow copy deletion and mass encryption.' },
      { id: 'exfiltration', label: 'Data exfiltration attempt', description: '64 MB uploaded to uncategorized infrastructure.' },
      { id: 'c2', label: 'C2 beaconing', description: 'Six periodic beacons from an engineering laptop.' },
      { id: 'cloud_iam', label: 'Cloud IAM abuse', description: 'Access key creation and admin policy attachment.' },
    ],
  });
});

app.get('/api/summary', (_req, res) => {
  res.json(store.summary());
});

app.get('/api/overview', (req, res) => {
  const range = ['1h', '6h', '24h', '7d'].includes(String(req.query.range)) ? String(req.query.range) : '24h';
  res.json(store.overview(range as '1h' | '6h' | '24h' | '7d'));
});

app.get('/api/logs', (req, res) => {
  const severity = parseList(req.query.severity, sevValues);
  const source = parseList(req.query.source, sourceValues);
  const minutes = Number(req.query.minutes ?? 15);
  const limit = Number(req.query.limit ?? 100);
  const result = store.queryLogs({
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    severity,
    sourceKind: source,
    sinceMinutes: Number.isFinite(minutes) ? minutes : 15,
    limit: Number.isFinite(limit) ? limit : 100,
    cursor: typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
  });
  res.json(result);
});

app.get('/api/logs/export', (req, res) => {
  const severity = parseList(req.query.severity, sevValues);
  const source = parseList(req.query.source, sourceValues);
  const minutes = Number(req.query.minutes ?? 60);
  const result = store.queryLogs({
    q: typeof req.query.q === 'string' ? req.query.q : undefined,
    severity,
    sourceKind: source,
    sinceMinutes: Number.isFinite(minutes) ? minutes : 60,
    limit: 500,
  });

  const header = ['timestamp', 'severity', 'event_type', 'source', 'source_kind', 'src_ip', 'dst_ip', 'host', 'user', 'outcome', 'message'];
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows = result.events.map((event) =>
    [
      new Date(event.ts).toISOString(),
      event.severity,
      event.eventType,
      event.sourceId,
      event.sourceKind,
      event.srcIp,
      event.dstIp,
      event.host,
      event.user,
      event.outcome,
      event.message,
    ]
      .map(escape)
      .join(','),
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="aegis-logs.csv"');
  res.send([header.join(','), ...rows].join('\n'));
});

app.get('/api/alerts', (req, res) => {
  res.json(
    store.listAlerts({
      status: parseList(req.query.status, statusValues),
      severity: parseList(req.query.severity, sevValues),
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
    }),
  );
});

app.get('/api/alerts/:id', (req, res) => {
  const alert = store.getAlert(req.params.id);
  if (!alert) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }
  res.json(alert);
});

app.patch('/api/alerts/:id', (req, res) => {
  const status = typeof req.body?.status === 'string' ? req.body.status : undefined;
  if (status && !statusValues.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }
  const alert = store.updateAlert(req.params.id, {
    status,
    assignee: typeof req.body?.assignee === 'string' ? req.body.assignee : undefined,
  });
  if (!alert) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }
  broadcast({ type: 'alert_update', alert });
  res.json(alert);
});

app.get('/api/rules', (_req, res) => {
  res.json(store.listRules());
});

app.patch('/api/rules/:id', (req, res) => {
  if (typeof req.body?.enabled !== 'boolean') {
    res.status(400).json({ error: 'enabled must be a boolean' });
    return;
  }
  const rule = store.setRuleEnabled(req.params.id, req.body.enabled);
  if (!rule) {
    res.status(404).json({ error: 'Rule not found' });
    return;
  }
  res.json(rule);
});

app.get('/api/sources', (_req, res) => {
  res.json(store.listSources());
});

app.get('/api/activity', (_req, res) => {
  res.json(store.logActivity(Date.now()));
});

app.post('/api/simulate', (req, res) => {
  const scenario = String(req.body?.scenario ?? '') as SimScenario;
  const allowed: SimScenario[] = ['brute_force', 'port_scan', 'malware', 'exfiltration', 'c2', 'cloud_iam'];
  if (!allowed.includes(scenario)) {
    res.status(400).json({ error: 'Unknown scenario' });
    return;
  }
  const result = store.simulate(scenario);
  res.json({ ok: true, label: result.label, events: result.events.length, alerts: result.alerts });
});

app.get('/api/stream', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 2500\n\n');

  const client: Client = { id: nextClientId, res };
  nextClientId += 1;
  clients.set(client.id, client);

  const initial: StreamMessage[] = [
    { type: 'summary', summary: store.summary() },
    { type: 'sources', sources: store.listSources() },
  ];
  for (const message of initial) {
    res.write(`event: message\ndata: ${JSON.stringify(message)}\n\n`);
  }

  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 20_000);

  req.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(client.id);
  });
});

// ------------------------------------------------------------------ lifetime

let lastSummary = 0;

setInterval(() => {
  const now = Date.now();
  store.advance(now);

  const batch = generateNoiseBatch(now, int(5, 11));
  const alerts = store.ingest(batch);

  broadcast({
    type: 'logs',
    logs: batch,
    eps: store.currentEps(),
    totalLogs: store.summary().totalLogs,
  });

  for (const alert of alerts) {
    broadcast({ type: 'alert', alert });
  }

  if (now - lastSummary > 2_500) {
    lastSummary = now;
    broadcast({ type: 'summary', summary: store.summary() });
  }

  store.maybeAutoScenario(now);
}, 1_100);

setInterval(() => {
  const now = Date.now();
  store.tickSources(now);
  broadcast({ type: 'sources', sources: store.listSources() });
}, 5_000);

// ----------------------------------------------------------------- frontend

async function attachFrontend(): Promise<void> {
  if (isProduction) {
    const dist = path.join(ROOT, 'dist');
    if (fs.existsSync(dist)) {
      app.use(express.static(dist, { index: false, maxAge: '1h' }));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(dist, 'index.html'));
      });
    } else {
      app.get('/', (_req, res) => {
        res.status(500).send('Frontend build missing. Run `npm run build` first.');
      });
    }
    return;
  }

  const { createServer } = await import('vite');
  const vite = await createServer({
    root: ROOT,
    appType: 'spa',
    server: {
      middlewareMode: true,
      hmr: false,
    },
    resolve: {
      alias: {
        '@': path.join(ROOT, 'src'),
        '@shared': path.join(ROOT, 'shared'),
      },
    },
  });
  app.use(vite.middlewares);
}

attachFrontend()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[aegis] SIEM console listening on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'dev'})`);
    });
  })
  .catch((error) => {
    console.error('[aegis] failed to start', error);
    process.exit(1);
  });
