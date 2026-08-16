"use client";

import { X, Heart } from "lucide-react";

export function SwipeButtons({
  onLike,
  onPass,
}: {
  onLike: () => void;
  onPass: () => void;
}) {
  return (
    <div className="flex justify-center gap-4">
      <button
        onClick={onPass}
        aria-label="Pass"
        className="flex h-14 w-14 items-center justify-center rounded-full border border-swipe-reject text-swipe-reject hover:bg-swipe-reject/10"
      >
        <X className="h-6 w-6" />
      </button>
      <button
        onClick={onLike}
        aria-label="Like"
        className="flex h-14 w-14 items-center justify-center rounded-full border border-swipe-accept text-swipe-accept hover:bg-swipe-accept/10"
      >
        <Heart className="h-6 w-6" />
      </button>
    </div>
  );
}