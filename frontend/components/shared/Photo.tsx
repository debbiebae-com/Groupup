"use client";

import Image from "next/image";
import { useState } from "react";

const sizes = {
  xs: "h-8 w-8 text-[10px]",
  sm: "h-10 w-10 text-xs",
  md: "h-12 w-12 text-sm",
  story: "h-14 w-14 text-base",
  lg: "h-20 w-20 text-xl",
  xl: "h-28 w-28 text-3xl",
};

export function Photo({
  src,
  name,
  alt,
  size = "md",
  className = "",
  priority = false,
}: {
  src?: string | null;
  name: string;
  alt?: string;
  size?: keyof typeof sizes;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div
      role="img"
      aria-label={alt ?? name}
      className={`relative isolate flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#ffe3d1] via-[#ffdce5] to-[#e5d6ff] font-semibold text-[#9b5265] ${sizes[size]} ${className}`}
    >
      {src && !failed ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="112px"
          unoptimized
          priority={priority}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initials || "G"}</span>
      )}
    </div>
  );
}
