"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useAuthStore } from "@/lib/store";

const EmailSchema = z.string().email().regex(/\.edu$/i, "Must be a .edu email");

export function AuthVerifyClient() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const requestVerification = useAuthStore((s) => s.requestVerification);
  const confirmVerification = useAuthStore((s) => s.confirmVerification);
  const loading = useAuthStore((s) => s.loading);

  const [email, setEmail] = useState(user?.email ?? "");
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = EmailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    const result = await requestVerification(email);
    if (!result.ok) {
      setError(result.error ?? "Request failed");
      return;
    }
    setDevToken(result.devToken ?? null);
    if (result.devToken) setCode(result.devToken);
    setStep("code");
  }

  async function onConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError("Enter the verification code");
      return;
    }
    const result = await confirmVerification(email, code.trim());
    if (!result.ok) {
      setError(result.error ?? "Verification failed");
      return;
    }
    router.push("/profiles");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-lg border p-8">
        <h1 className="text-xl font-semibold">Verify your student email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {step === "email"
            ? "Enter your institutional .edu email to receive a verification code."
            : "The code has been pre-filled (dev mode). Click Verify."}
        </p>

        {step === "email" ? (
          <form onSubmit={onRequest} className="mt-6 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={onConfirm} className="mt-6 space-y-4">
            {devToken && (
              <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground break-all">
                Dev token: <span className="font-mono select-all">{devToken}</span>
              </p>
            )}
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Verification code"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="w-full text-sm text-muted-foreground underline"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}