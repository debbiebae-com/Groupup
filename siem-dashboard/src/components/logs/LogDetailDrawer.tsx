import { useState, type ReactNode } from 'react';
import { Check, Copy, Crosshair, ExternalLink } from 'lucide-react';
import type { LogEvent } from '@shared/types';
import { SOURCE_KIND_LABEL } from '@shared/types';
import { pushToast } from '@/lib/live';
import { cn, classForOutcome, fmtBytes, fmtDateTime } from '@/lib/utils';
import { Button, Drawer, SeverityBadge } from '@/components/ui/primitives';
import { JsonView } from './JsonView';

function Field({ label, value, mono }: { label: string; value?: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase tracking-[0.14em] text-muted/70">{label}</div>
      <div className={cn('mt-1 truncate text-[11.5px] text-bright', mono && 'font-mono text-[11px]')}>{value || '—'}</div>
    </div>
  );
}

export function LogDetailDrawer({ event, onClose }: { event: LogEvent | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyRaw = async () => {
    if (!event) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(event.raw, null, 2));
      setCopied(true);
      pushToast({ title: 'Raw event copied', severity: 'success' });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      pushToast({ title: 'Clipboard unavailable', severity: 'medium' });
    }
  };

  return (
    <Drawer
      open={Boolean(event)}
      onClose={onClose}
      width="max-w-[720px]"
      title={
        event ? (
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px]">{event.eventType.replace(/_/g, ' ')}</span>
            <SeverityBadge severity={event.severity} />
          </span>
        ) : (
          'Event detail'
        )
      }
      subtitle={event ? `${fmtDateTime(event.ts)} · ${event.id}` : undefined}
      headerActions={
        event ? (
          <Button variant="ghost" size="sm" onClick={copyRaw} title="Copy raw JSON">
            {copied ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
            Raw
          </Button>
        ) : undefined
      }
    >
      {event && (
        <div className="space-y-5 p-5">
          <div className="rounded-lg border border-edge/70 bg-surface-2/60 p-3.5">
            <p className="text-[12.5px] leading-relaxed text-bright">{event.message}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted">
              <span className="font-mono">{fmtDateTime(event.ts)}</span>
              <span className="flex items-center gap-1">
                <span className={cn('h-1.5 w-1.5 rounded-full bg-current', classForOutcome(event.outcome))} />
                <span className={classForOutcome(event.outcome)}>{event.outcome}</span>
              </span>
              <span>{SOURCE_KIND_LABEL[event.sourceKind]}</span>
            </div>
          </div>

          <section>
            <h3 className="label-caps mb-2.5">Event attributes</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
              <Field label="Source" value={event.sourceId} mono />
              <Field label="Event type" value={event.eventType} mono />
              <Field label="Outcome" value={<span className={classForOutcome(event.outcome)}>{event.outcome}</span>} />
              <Field label="Host" value={event.host} mono />
              <Field label="Principal" value={event.user} mono />
              <Field label="Service" value={event.service} mono />
              <Field label="Source IP" value={event.srcIp} mono />
              <Field label="Destination IP" value={event.dstIp} mono />
              <Field
                label="Ports"
                value={
                  event.srcPort || event.dstPort
                    ? `${event.srcPort ?? '—'} → ${event.dstPort ?? '—'}`
                    : undefined
                }
                mono
              />
              <Field label="Geo origin" value={event.country ? `${event.city ?? ''}${event.city ? ', ' : ''}${event.country}` : undefined} />
              <Field label="Bytes in" value={fmtBytes(event.bytesIn)} mono />
              <Field label="Bytes out" value={fmtBytes(event.bytesOut)} mono />
            </div>
          </section>

          {event.mitre && (
            <section className="rounded-lg border border-edge/70 bg-surface-2/40 p-3">
              <div className="mb-2 flex items-center gap-2">
                <Crosshair size={12} className="text-accent" />
                <span className="label-caps">MITRE ATT&amp;CK mapping</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="rounded border border-accent/25 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                  {event.mitre.id}
                </span>
                <span className="text-muted">{event.mitre.tactic}</span>
                <span className="text-muted/40">/</span>
                <span className="text-bright">{event.mitre.technique}</span>
              </div>
            </section>
          )}

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="label-caps">Raw event</h3>
              <span className="flex items-center gap-1 text-[9.5px] text-muted">
                ECS-normalized <ExternalLink size={9} />
              </span>
            </div>
            <JsonView value={event.raw} />
          </section>
        </div>
      )}
    </Drawer>
  );
}
