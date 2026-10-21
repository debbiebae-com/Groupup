import { create } from 'zustand';
import type { Alert, LogEvent, Severity, SourceHealth, StreamMessage, Summary } from '@shared/types';

interface Toast {
  id: number;
  title: string;
  description?: string;
  severity: Severity | 'success';
  href?: string;
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: number) => void;
}

let toastId = 1;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: (toast) => {
    const id = toastId;
    toastId += 1;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }].slice(-4) }));
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

export function pushToast(toast: Omit<Toast, 'id'>): void {
  useToastStore.getState().push(toast);
}

const EMPTY_SUMMARY: Summary = {
  totalLogs: 0,
  openAlerts: 0,
  criticalAlerts: 0,
  connectedSources: 0,
  eps: 0,
};

interface LiveState {
  connected: boolean;
  paused: boolean;
  logs: LogEvent[];
  alertOverrides: Record<string, Alert>;
  summary: Summary;
  sources: SourceHealth[];
  eps: number;
  lastEventAt: number;
  setPaused: (paused: boolean) => void;
  togglePaused: () => void;
  connect: () => void;
  disconnect: () => void;
}

let source: EventSource | null = null;

export const useLiveStore = create<LiveState>()((set, get) => ({
  connected: false,
  paused: false,
  logs: [],
  alertOverrides: {},
  summary: EMPTY_SUMMARY,
  sources: [],
  eps: 0,
  lastEventAt: 0,
  setPaused: (paused) => set({ paused }),
  togglePaused: () => set((state) => ({ paused: !state.paused })),
  connect: () => {
    if (source) return;
    source = new EventSource('/api/stream');

    source.onopen = () => set({ connected: true });
    source.onerror = () => set({ connected: false });

    source.onmessage = (event) => {
      let message: StreamMessage;
      try {
        message = JSON.parse(event.data) as StreamMessage;
      } catch {
        return;
      }

      switch (message.type) {
        case 'summary':
          set({ summary: message.summary, eps: message.summary.eps });
          break;
        case 'sources':
          set({ sources: message.sources });
          break;
        case 'logs': {
          const state = get();
          if (state.paused) {
            set({ eps: message.eps, lastEventAt: Date.now() });
            return;
          }
          const existing = new Set(state.logs.map((log) => log.id));
          const fresh = [...message.logs]
            .sort((a, b) => b.ts - a.ts)
            .filter((log) => !existing.has(log.id));
          set({
            logs: [...fresh, ...state.logs].slice(0, 600),
            eps: message.eps,
            lastEventAt: Date.now(),
          });
          break;
        }
        case 'alert': {
          const state = get();
          set({ alertOverrides: { ...state.alertOverrides, [message.alert.id]: message.alert } });
          pushToast({
            title: `${message.alert.ruleName}`,
            description: `${
              message.alert.severity === 'critical' ? 'Critical' : message.alert.severity[0].toUpperCase() + message.alert.severity.slice(1)
            } · ${message.alert.id} · ${message.alert.description}`,
            severity: message.alert.severity,
            href: `/alerts?alert=${message.alert.id}`,
          });
          break;
        }
        case 'alert_update': {
          const state = get();
          set({ alertOverrides: { ...state.alertOverrides, [message.alert.id]: message.alert } });
          break;
        }
        default:
          break;
      }
    };
  },
  disconnect: () => {
    source?.close();
    source = null;
    set({ connected: false });
  },
}));

export function mergeAlerts(list: Alert[], overrides: Record<string, Alert>): Alert[] {
  const map = new Map(list.map((alert) => [alert.id, alert]));
  for (const alert of Object.values(overrides)) map.set(alert.id, alert);
  return Array.from(map.values());
}
