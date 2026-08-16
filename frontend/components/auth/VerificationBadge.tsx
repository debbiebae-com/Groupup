"use client";

import { Check } from "lucide-react";
import { useAuthStore } from "@/lib/store";

export function VerificationBadge() {
  const status = useAuthStore((s) => s.user?.verificationStatus) ?? "UNVERIFIED";

  if (status === "VERIFIED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-verified-teal px-2.5 py-0.5 text-xs font-medium text-white">
        <Check className="h-3 w-3" />
        Verified Student
      </span>
    );
  }
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center rounded-full bg-match-amber px-2.5 py-0.5 text-xs font-medium text-black">
        Pending Verification
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
      Unverified
    </span>
  );
}
