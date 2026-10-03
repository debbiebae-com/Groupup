"use client";

import { Heart, X } from "lucide-react";

export function SwipeButtons({
  onLike,
  onPass,
}: {
  onLike: () => void;
  onPass: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-5">
      <button
        onClick={onPass}
        aria-label="Pass"
        className="grid h-[58px] w-[58px] place-items-center rounded-full border border-[#f2d9dc] bg-white text-[#d75b67] shadow-[0_8px_24px_rgba(40,31,27,0.08)] transition hover:-translate-y-1 hover:bg-[#fff3f4] hover:shadow-lg active:scale-95"
      >
        <X className="h-6 w-6" strokeWidth={2.5} />
      </button>
      <button
        onClick={onLike}
        aria-label="Like"
        className="instagram-gradient grid h-[68px] w-[68px] place-items-center rounded-full text-white shadow-[0_11px_27px_rgba(226,67,105,0.3)] transition hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(226,67,105,0.34)] active:scale-95"
      >
        <Heart className="h-7 w-7 fill-white" strokeWidth={2} />
      </button>
      <button
        onClick={onPass}
        aria-label="Skip"
        className="grid h-[58px] w-[58px] place-items-center rounded-full border border-[#ebe6e2] bg-white text-[#89817d] shadow-[0_8px_24px_rgba(40,31,27,0.06)] transition hover:-translate-y-1 hover:bg-[#f7f5f3] active:scale-95"
      >
        <span className="text-lg leading-none">↻</span>
      </button>
    </div>
  );
}
