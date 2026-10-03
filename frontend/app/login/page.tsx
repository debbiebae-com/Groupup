"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, Eye, EyeOff, Heart, LockKeyhole, Sparkles, UsersRound } from "lucide-react";
import { useAuthStore } from "@/lib/store";

const loginPhoto = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=88";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "register") setMode("register");
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const result = mode === "login"
      ? await login(email.trim(), password)
      : await register(email.trim(), password, displayName.trim());
    if (!result.ok) {
      setError(result.error ?? "Something went wrong. Try again.");
      return;
    }
    router.push(mode === "register" ? "/profile/edit" : "/profiles");
  }

  async function signInWithDemo() {
    setError(null);
    const result = await login("jordan@nationaluniversity.edu", "groupup-demo");
    if (!result.ok) {
      setError(result.error ?? "The demo account couldn't sign in.");
      return;
    }
    router.push("/profiles");
  }

  return (
    <div className="mx-auto grid max-w-[1120px] items-center gap-7 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
      <section className="relative hidden min-h-[650px] overflow-hidden rounded-[34px] bg-[#dacdc6] shadow-[0_26px_70px_rgba(58,42,38,0.16)] lg:block">
        <Image src={loginPhoto} alt="Students sharing a moment together" fill sizes="(max-width: 1024px) 0px, 560px" unoptimized className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#211719]/85 via-[#211719]/10 to-[#211719]/15" />
        <div className="absolute left-7 top-7 flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3.5 py-2 text-[10px] font-bold text-white backdrop-blur-md"><BadgeCheck className="h-4 w-4 text-[#9de5cf]" /> A little more human</div>
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur"><UsersRound className="h-5 w-5" /></span>
          <p className="mt-5 max-w-[440px] text-4xl font-black leading-[1.04] tracking-[-0.06em]">The right roommate makes a place feel like <span className="text-[#ffc9d7]">your place.</span></p>
          <p className="mt-3 max-w-[370px] text-sm leading-6 text-white/75">Start with the people. The rest of the story is yours to write together.</p>
          <div className="mt-6 flex items-center gap-3 text-xs font-semibold text-white/80"><span className="flex -space-x-2"><span className="h-7 w-7 rounded-full border-2 border-white/50 bg-[#efbda7]" /><span className="h-7 w-7 rounded-full border-2 border-white/50 bg-[#d9abd3]" /><span className="h-7 w-7 rounded-full border-2 border-white/50 bg-[#b2d9cb]" /></span>Made for better roommate beginnings</div>
        </div>
        <div className="absolute right-6 top-[38%] rounded-2xl border border-white/70 bg-white/95 p-3.5 shadow-xl">
          <div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#fff0f2] text-[#df496b]"><Heart className="h-4 w-4 fill-current" /></span><span><span className="block text-xs font-bold text-[#453d3a]">A good match</span><span className="mt-0.5 block text-[9px] text-[#928a86]">Feels like a shared rhythm</span></span></div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[460px]">
        <div className="surface-card p-6 sm:p-9">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#c45454]"><span className="instagram-gradient h-2 w-2 rounded-full" /> Your next chapter starts here</div>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.06em] text-[#2d2927]">{mode === "login" ? "Welcome back." : "Come on in."}</h1>
          <p className="mt-2 text-sm leading-6 text-[#827b77]">{mode === "login" ? "Pick up where your roommate story left off." : "Create a student profile and meet the people behind your next home."}</p>

          <div className="mt-6 grid grid-cols-2 gap-1 rounded-full bg-[#f4f1ef] p-1">
            <button type="button" onClick={() => { setMode("login"); setError(null); }} className={`rounded-full px-4 py-2.5 text-xs font-bold transition ${mode === "login" ? "bg-white text-[#383330] shadow-sm" : "text-[#89817d] hover:text-[#514a46]"}`}>Sign in</button>
            <button type="button" onClick={() => { setMode("register"); setError(null); }} className={`rounded-full px-4 py-2.5 text-xs font-bold transition ${mode === "register" ? "bg-white text-[#383330] shadow-sm" : "text-[#89817d] hover:text-[#514a46]"}`}>Create account</button>
          </div>

          <form onSubmit={onSubmit} className="mt-5 space-y-3.5">
            {mode === "register" && <label className="block"><span className="mb-1.5 block text-[10px] font-bold text-[#625b57]">What should we call you?</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required maxLength={60} placeholder="Your name" className="w-full rounded-xl border border-[#eee8e4] bg-[#fcfbfa] px-4 py-3 text-sm outline-none focus:border-[#e894a4]" /></label>}
            <label className="block"><span className="mb-1.5 block text-[10px] font-bold text-[#625b57]">Student email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@university.edu" className="w-full rounded-xl border border-[#eee8e4] bg-[#fcfbfa] px-4 py-3 text-sm outline-none focus:border-[#e894a4]" /></label>
            <label className="block"><span className="mb-1.5 block text-[10px] font-bold text-[#625b57]">Password</span><span className="flex items-center rounded-xl border border-[#eee8e4] bg-[#fcfbfa] pr-3 focus-within:border-[#e894a4]"><LockKeyhole className="ml-4 h-4 w-4 shrink-0 text-[#a59d98]" /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} placeholder="At least 8 characters" className="w-full bg-transparent px-3 py-3 text-sm outline-none" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} className="grid h-8 w-8 place-items-center rounded-full text-[#9c9490] hover:bg-[#f0ece9]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>
            {error && <p role="alert" className="rounded-xl bg-[#fff2f1] px-3.5 py-2.5 text-xs font-medium text-[#b8424e]">{error}</p>}
            <button type="submit" disabled={loading} className="instagram-gradient mt-2 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-white shadow-[0_9px_22px_rgba(226,67,105,0.2)] transition hover:-translate-y-0.5 disabled:opacity-60">{loading ? "One second…" : mode === "login" ? "Sign in" : "Create my profile"}<ArrowRight className="h-4 w-4" /></button>
          </form>

          <div className="my-5 flex items-center gap-3"><span className="h-px flex-1 bg-[#eee8e4]" /><span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#aaa19c]">Just looking around?</span><span className="h-px flex-1 bg-[#eee8e4]" /></div>
          <button onClick={() => void signInWithDemo()} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full border border-[#eee7e3] bg-white px-5 py-3 text-xs font-bold text-[#625a56] transition hover:bg-[#faf7f5] disabled:opacity-60"><Sparkles className="h-4 w-4 text-[#df496b]" /> Explore the demo as Jordan</button>
          <p className="mt-4 text-center text-[10px] leading-5 text-[#9a928d]">By continuing, you agree to keep the campus community kind and respectful.</p>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#8c8580]"><span>Need to verify your email?</span><Link href="/auth/verify" className="font-bold text-[#d94368] hover:underline">Verify student email</Link></div>
      </section>
    </div>
  );
}
