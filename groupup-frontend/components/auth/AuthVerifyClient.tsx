"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useAuthStore } from "@/lib/store";

const EmailSchema = z.string().email().regex(/\.edu$/i, "Must be a .edu email");

export function AuthVerifyClient() {
  const router = useRouter();
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const loading = useAuthStore((s) => s.loading);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = EmailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    const result = await verifyEmail(email);
    if (result.ok) {
      router.push("/dashboard");
    } else {
      setError(result.error ?? "Verification failed");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-lg border p-8">
        <h1 className="text-xl font-semibold">Verify your student email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use your institutional <code>.edu</code> email to unlock matching,
          group chat, and video checks.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring/50 focus:ring-2"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify email"}
          </button>
        </form>
      </div>
    </div>
  );
}