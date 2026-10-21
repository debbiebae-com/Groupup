import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <div className="label-caps mb-1.5 flex items-center gap-2">
          <span className="h-px w-3 bg-accent/60" />
          {eyebrow}
        </div>
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-bright">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
