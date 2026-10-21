import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Alert,
  AlertStatus,
  LogEvent,
  Overview,
  Rule,
  Severity,
  SimScenario,
  SourceHealth,
  Summary,
  TimeRange,
} from '@shared/types';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export const api = {
  summary: () => request<Summary>('/summary'),
  overview: (range: TimeRange) => request<Overview>(`/overview?range=${range}`),
  activity: () => request<{ ts: number; message: string; severity: Severity }[]>('/activity'),
  logs: (params: {
    q?: string;
    severity?: Severity[];
    source?: string[];
    minutes?: number;
    limit?: number;
    cursor?: string;
  }) => {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.severity?.length) query.set('severity', params.severity.join(','));
    if (params.source?.length) query.set('source', params.source.join(','));
    if (params.minutes) query.set('minutes', String(params.minutes));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.cursor) query.set('cursor', params.cursor);
    const suffix = query.toString();
    return request<{ events: LogEvent[]; nextCursor?: string; total: number; bufferStart: number }>(
      `/logs${suffix ? `?${suffix}` : ''}`,
    );
  },
  alerts: (params: { status?: AlertStatus[]; severity?: Severity[]; q?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status?.length) query.set('status', params.status.join(','));
    if (params.severity?.length) query.set('severity', params.severity.join(','));
    if (params.q) query.set('q', params.q);
    const suffix = query.toString();
    return request<Alert[]>(`/alerts${suffix ? `?${suffix}` : ''}`);
  },
  alert: (id: string) => request<Alert>(`/alerts/${id}`),
  updateAlert: (id: string, patch: { status?: AlertStatus; assignee?: string }) =>
    request<Alert>(`/alerts/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  rules: () => request<Rule[]>('/rules'),
  setRule: (id: string, enabled: boolean) =>
    request<Rule>(`/rules/${id}`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),
  sources: () => request<SourceHealth[]>('/sources'),
  simulate: (scenario: SimScenario) =>
    request<{ ok: boolean; label: string; events: number; alerts: Alert[] }>('/simulate', {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    }),
  meta: () =>
    request<{
      analysts: string[];
      product: string;
      version: string;
      scenarios: { id: SimScenario; label: string; description: string }[];
    }>('/meta'),
};

export function exportLogs(params: {
  q?: string;
  severity?: Severity[];
  source?: string[];
  minutes?: number;
}): void {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.severity?.length) query.set('severity', params.severity.join(','));
  if (params.source?.length) query.set('source', params.source.join(','));
  if (params.minutes) query.set('minutes', String(params.minutes));
  window.open(`${BASE}/logs/export?${query.toString()}`, '_blank');
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(key: string, fetcher: () => Promise<T>, intervalMs?: number): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((value) => value + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    const run = () => {
      fetcherRef
        .current()
        .then((result) => {
          if (!alive) return;
          setData(result);
          setError(null);
        })
        .catch((err: Error) => {
          if (!alive) return;
          setError(err.message);
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    };
    run();
    const timer = intervalMs && intervalMs > 0 ? window.setInterval(run, intervalMs) : undefined;
    return () => {
      alive = false;
      if (timer) window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, intervalMs, nonce]);

  return { data, loading, error, refetch };
}
