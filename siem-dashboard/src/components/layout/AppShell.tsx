import { useEffect, useState, type ReactNode } from 'react';
import { useLiveStore } from '@/lib/live';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Toasts } from '@/components/ui/Toasts';

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const connect = useLiveStore((state) => state.connect);

  useEffect(() => {
    connect();
  }, [connect]);

  return (
    <div className="min-h-screen">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-h-screen flex-col lg:pl-[232px]">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-[1560px] flex-1 px-3.5 py-5 sm:px-5 lg:px-6">{children}</main>
        <footer className="mx-auto flex w-full max-w-[1560px] flex-wrap items-center justify-between gap-2 border-t border-edge/50 px-4 py-3 text-[10px] text-muted/70 sm:px-6">
          <span>AEGIS SIEM · detection engine v4.8.1 · synthetic telemetry for demonstration</span>
          <span className="font-mono">SOC-1 · Accra · UTC+0</span>
        </footer>
      </div>
      <Toasts />
    </div>
  );
}
