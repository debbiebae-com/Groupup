"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, MailCheck, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/lib/store";

const EmailSchema = z.string().email().regex(/\.edu$/i, "Use your university .edu email.");

export function AuthVerifyClient() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const requestVerification = useAuthStore((state) => state.requestVerification);
  const confirmVerification = useAuthStore((state) => state.confirmVerification);
  const loading = useAuthStore((state) => state.loading);
  const [email, setEmail] = useState(user?.email ?? "");
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const parsed = EmailSchema.safeParse(email.trim());
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your email address.");
      return;
    }
    const result = await requestVerification(email.trim());
    if (!result.ok) {
      setError(result.error ?? "We couldn't send a code right now.");
      return;
    }
    setDevToken(result.devToken ?? null);
    if (result.devToken) setCode(result.devToken);
    setStep("code");
  }

  async function onConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const result = await confirmVerification(email.trim(), code.trim());
    if (!result.ok) {
      setError(result.error ?? "That code didn't work. Try again.");
      return;
    }
    router.push("/profiles");
  }

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-9 sm:px-6 sm:py-14">
      <div className="grid overflow-hidden rounded-[32px] border border-white bg-white shadow-[0_25px_75px_rgba(58,42,38,0.1)] lg:grid-cols-[0.85fr_1.15fr]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#f07b53] via-[#e64a72] to-[#a651c8] p-9 text-white lg:flex lg:min-h-[570px] lg:flex-col lg:justify-between">
          <div className="absolute -right-16 top-16 h-64 w-64 rounded-full border border-white/20" /><div className="absolute -right-4 top-28 h-40 w-40 rounded-full border border-white/20" /><div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
          <div className="relative"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><ShieldCheck className="h-5 w-5" /></span><p className="mt-7 text-[10px] font-bold uppercase tracking-[0.19em] text-white/75">Good people, good beginnings</p><h1 className="mt-3 max-w-sm text-4xl font-black leading-[1.04] tracking-[-0.06em]">A little trust makes a big difference.</h1><p className="mt-4 max-w-sm text-sm leading-6 text-white/80">A verified student email keeps the roommate community more connected to campus life.</p></div>
          <div className="relative rounded-2xl border border-white/25 bg-white/10 p-4 backdrop-blur"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-white/15"><BadgeCheck className="h-5 w-5" /></span><div><p className="text-xs font-bold">A more thoughtful community</p><p className="mt-1 text-[10px] text-white/75">Your email stays private.</p></div></div></div>
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-[#89817d] hover:text-[#d94368]"><ArrowLeft className="h-3.5 w-3.5" /> Back to sign in</Link>
          <span className="mt-8 grid h-12 w-12 place-items-center rounded-2xl bg-[#eff9f6] text-[#26947c]">{step === "email" ? <MailCheck className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}</span>
          <p className="eyebrow mt-5">Student community</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-[-0.06em] text-[#302c29]">{step === "email" ? "Verify your campus email." : "Check your inbox."}</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-[#827b77]">{step === "email" ? "We’ll send a short verification code to your .edu address. It’s quick, private and helps keep the community connected to campus." : `Enter the code sent to ${email}. It expires in 15 minutes.`}</p>

          {step === "email" ? (
            <form onSubmit={onRequest} className="mt-7 space-y-3.5">
              <label className="block"><span className="mb-1.5 block text-[10px] font-bold text-[#625b57]">University email</span><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@university.edu" className="w-full rounded-xl border border-[#eee8e4] bg-[#fcfbfa] px-4 py-3 text-sm outline-none focus:border-[#e894a4]" /></label>
              {error && <p role="alert" className="rounded-xl bg-[#fff2f1] px-3.5 py-2.5 text-xs font-medium text-[#b8424e]">{error}</p>}
              <button type="submit" disabled={loading} className="instagram-gradient flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-white disabled:opacity-60">{loading ? "Sending your code…" : "Send verification code"}<ArrowRight className="h-4 w-4" /></button>
            </form>
          ) : (
            <form onSubmit={onConfirm} className="mt-7 space-y-3.5">
              {devToken && <div className="rounded-2xl border border-[#d9eee7] bg-[#f3fbf8] p-3.5"><p className="text-[10px] font-bold text-[#398574]">Local demo code</p><p className="mt-1 font-mono text-lg font-extrabold tracking-[0.12em] text-[#267f70]">{devToken}</p></div>}
              <label className="block"><span className="mb-1.5 block text-[10px] font-bold text-[#625b57]">Verification code</span><input autoFocus value={code} onChange={(event) => setCode(event.target.value)} required placeholder="Enter your code" className="w-full rounded-xl border border-[#eee8e4] bg-[#fcfbfa] px-4 py-3 text-center font-mono text-lg tracking-[0.16em] outline-none focus:border-[#e894a4]" /></label>
              {error && <p role="alert" className="rounded-xl bg-[#fff2f1] px-3.5 py-2.5 text-xs font-medium text-[#b8424e]">{error}</p>}
              <button type="submit" disabled={loading} className="instagram-gradient flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-white disabled:opacity-60">{loading ? "Verifying…" : "Verify my email"}<ArrowRight className="h-4 w-4" /></button>
              <button type="button" onClick={() => { setError(null); setStep("email"); }} className="w-full rounded-full px-5 py-2.5 text-xs font-bold text-[#817a76] hover:bg-[#faf7f5]">Use a different email</button>
            </form>
          )}
          <p className="mt-6 text-[10px] leading-5 text-[#a09994]">We use your email to confirm you’re connected to a university. It won’t appear on your public profile.</p>
        </section>
      </div>
    </div>
  );
}
