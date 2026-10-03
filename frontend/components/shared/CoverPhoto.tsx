"use client";

import Image from "next/image";
import { useState } from "react";

export function CoverPhoto({
  src,
  name,
  alt,
  className = "",
  priority = false,
}: {
  src?: string | null;
  name: string;
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div
      role="img"
      aria-label={alt ?? name}
      className={`relative isolate overflow-hidden bg-gradient-to-br from-[#ffe5d8] via-[#f8dce5] to-[#e5d8ff] ${className}`}
    >
      {src && !failed ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 360px"
          unoptimized
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          onError={() => setFailed(true)}
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 grid place-items-center text-6xl font-black tracking-[-0.08em] text-white/75">
          {initials || "G"}
        </div>
      )}
    </div>
  );
}
