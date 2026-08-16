"use client";

export function TypingIndicator({ typers }: { typers: string[] }) {
  if (typers.length === 0) return null;
  return (
    <p className="px-1 text-xs text-muted-foreground">
      {typers.join(", ")} {typers.length === 1 ? "is" : "are"} typing…
    </p>
  );
}