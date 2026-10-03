"use client";

import { BadgeCheck, Clock3, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/lib/store";

export function VerificationBadge() {
  const status = useAuthStore((state) => state.user?.verificationStatus) ?? "UNVERIFIED";

  if (status === "VERIFIED") {
    return <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ccebe2] bg-[#effaf6] px-2.5 py-1 text-[10px] font-bold text-[#218570]"><BadgeCheck className="h-3.5 w-3.5" /> Verified student</span>;
  }
  if (status === "PENDING") {
    return <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f3e0bc] bg-[#fff8e9] px-2.5 py-1 text-[10px] font-bold text-[#a37331]"><Clock3 className="h-3.5 w-3.5" /> Verification pending</span>;
  }
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eee8e4] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#89827e]"><ShieldAlert className="h-3.5 w-3.5" /> Not verified</span>;
}
