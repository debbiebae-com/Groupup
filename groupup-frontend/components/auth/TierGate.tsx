"use client";

import { useAuthStore } from "@/lib/store";

export function TierGate({
  requiredTier,
  children,
  fallback,
}: {
  requiredTier: 1 | 2 | 3;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const tier = useAuthStore((s) => s.tier);

  if (tier >= requiredTier) {
    return <>{children}</>;
  }

  return (
    fallback ?? (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-lg border p-8">
          <h2 className="text-lg font-semibold">Verification required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete verification and profile setup to access this feature.
          </p>
          <a
            href="/auth/verify"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Verify my email
          </a>
        </div>
      </div>
    )
  );
}