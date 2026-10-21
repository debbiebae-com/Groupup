import { useMemo } from 'react';

const TOKEN_REGEX =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"\s*:?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

function classify(token: string): string {
  const trimmed = token.trimEnd();
  if (trimmed.endsWith(':')) return 'text-accent';
  if (trimmed.startsWith('"')) return 'text-emerald-300/90';
  if (trimmed === 'true' || trimmed === 'false') return 'text-sev-medium';
  if (trimmed === 'null') return 'text-muted';
  return 'text-sev-low';
}

export function JsonView({ value }: { value: unknown }) {
  const parts = useMemo(() => JSON.stringify(value, null, 2).split(TOKEN_REGEX), [value]);

  return (
    <pre className="scrollbar-thin max-h-[420px] overflow-auto rounded-lg border border-edge/70 bg-[#05080d] p-3.5 font-mono text-[10.5px] leading-[1.65] text-muted">
      {parts.map((part, index) => {
        if (!part) return null;
        if (index % 2 === 0) return <span key={index}>{part}</span>;
        return (
          <span key={index} className={classify(part)}>
            {part}
          </span>
        );
      })}
    </pre>
  );
}
