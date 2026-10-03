"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, Check, LoaderCircle, MapPin, Sparkles } from "lucide-react";
import { ProfileUpdatePayloadSchema } from "@/lib/schemas";
import { getMyProfile, updateMyProfile } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { IntentSelector } from "./IntentSelector";
import { Photo } from "@/components/shared/Photo";

type FormValues = z.infer<typeof ProfileUpdatePayloadSchema>;

const defaultValues: FormValues = {
  displayName: "",
  bio: "",
  cleanliness: 5,
  socialEnergy: 5,
  sleepSchedule: "FLEXIBLE",
  nonNegotiables: [],
  budget: { min: 300, max: 900, currency: "USD" },
  groupIntent: "SOLO_NEW",
  university: "National University",
  campus: "Main Campus",
};
const negotiableOptions = ["no smoking", "pets welcome", "quiet hours", "shared groceries", "guests with notice", "clean kitchen"];
const sleepOptions = [
  { value: "EARLY_BIRD", label: "Early bird", icon: "🌤️", detail: "Mornings are my thing" },
  { value: "FLEXIBLE", label: "It depends", icon: "🌿", detail: "I go with the flow" },
  { value: "NIGHT_OWL", label: "Night owl", icon: "🌙", detail: "My best hours are late" },
] as const;

function SectionHeading({ number, title, detail }: { number: string; title: string; detail: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#fff0f2] text-[11px] font-extrabold text-[#d94368]">{number}</span>
      <div><h2 className="text-sm font-extrabold text-[#3e3834]">{title}</h2><p className="mt-1 text-[11px] leading-4 text-[#938b86]">{detail}</p></div>
    </div>
  );
}

export function ProfileForm() {
  const user = useAuthStore((state) => state.user);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(ProfileUpdatePayloadSchema), defaultValues });

  const displayName = watch("displayName");
  const groupIntent = watch("groupIntent");
  const nonNegotiables = watch("nonNegotiables") ?? [];
  const sleepSchedule = watch("sleepSchedule");
  const cleanliness = watch("cleanliness");
  const socialEnergy = watch("socialEnergy");

  useEffect(() => {
    let cancelled = false;
    getMyProfile()
      .then(({ profile }) => {
        if (!cancelled) reset({
          displayName: profile.displayName,
          bio: profile.bio,
          cleanliness: profile.cleanliness,
          socialEnergy: profile.socialEnergy,
          sleepSchedule: profile.sleepSchedule,
          nonNegotiables: profile.nonNegotiables,
          budget: profile.budget,
          groupIntent: profile.groupIntent,
          university: profile.university,
          campus: profile.campus,
        });
      })
      .catch(() => {
        if (!cancelled) reset({ ...defaultValues, displayName: user?.displayName ?? "" });
      })
      .finally(() => { if (!cancelled) setLoadingProfile(false); });
    return () => { cancelled = true; };
  }, [reset, user?.displayName]);

  function toggleNegotiable(tag: string) {
    const next = nonNegotiables.includes(tag) ? nonNegotiables.filter((item) => item !== tag) : [...nonNegotiables, tag];
    setValue("nonNegotiables", next, { shouldDirty: true, shouldValidate: true });
  }

  async function onSubmit(data: FormValues) {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await updateMyProfile(data);
      setSaved(true);
      await useAuthStore.getState().hydrate();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Your profile couldn't be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-6 sm:py-11">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="eyebrow flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Your people, your story</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.065em] text-[#2e2a28] sm:text-5xl">Make your profile <span className="text-gradient">feel like you.</span></h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#817a76]">The little things help the right roommates picture life with you.</p></div>
        <div className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 shadow-sm"><BadgeCheck className="h-4 w-4 text-[#26977f]" /><span className="text-[11px] font-semibold text-[#6e6763]">Only share what feels comfortable</span></div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_310px] lg:gap-7">
        <form onSubmit={handleSubmit(onSubmit)} className="surface-card p-5 sm:p-8">
          {loadingProfile && <div className="mb-5 flex items-center gap-2 rounded-2xl bg-[#faf8f6] px-4 py-3 text-xs text-[#8a837f]"><LoaderCircle className="h-4 w-4 animate-spin" /> Loading your profile…</div>}

          <section>
            <SectionHeading number="01" title="The introduction" detail="A little context makes a first hello easier." />
            <div className="grid gap-4 sm:grid-cols-[1fr_1.6fr]">
              <label className="block"><span className="mb-1.5 block text-[11px] font-bold text-[#5f5854]">Name you go by</span><input {...register("displayName")} maxLength={60} placeholder="e.g. Jordan" className="w-full rounded-xl border border-[#eee8e4] bg-[#fcfbfa] px-3.5 py-3 text-sm outline-none focus:border-[#e894a4]" />{errors.displayName && <span className="mt-1 block text-[10px] text-[#c14350]">{errors.displayName.message}</span>}</label>
              <label className="block"><span className="mb-1.5 block text-[11px] font-bold text-[#5f5854]">A few words about you</span><textarea {...register("bio")} maxLength={300} rows={3} placeholder="What does a good day at home look like?" className="w-full resize-y rounded-xl border border-[#eee8e4] bg-[#fcfbfa] px-3.5 py-3 text-sm leading-5 outline-none focus:border-[#e894a4]" />{errors.bio && <span className="mt-1 block text-[10px] text-[#c14350]">{errors.bio.message}</span>}</label>
            </div>
          </section>

          <div className="my-7 border-t border-[#f0ece9]" />
          <section>
            <SectionHeading number="02" title="Your everyday rhythm" detail="No perfect answers—just what feels true for you." />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#faf8f6] p-4"><div className="flex items-center justify-between"><label htmlFor="cleanliness" className="text-xs font-bold text-[#514a46]">Shared-space tidy</label><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#ad7550]">{cleanliness}/10</span></div><input id="cleanliness" type="range" min={1} max={10} step={1} {...register("cleanliness", { valueAsNumber: true })} className="mt-4 w-full accent-[#e74369]" /><div className="mt-1 flex justify-between text-[9px] text-[#a49c97]"><span>Relaxed about it</span><span>Love it spotless</span></div></div>
              <div className="rounded-2xl bg-[#faf8f6] p-4"><div className="flex items-center justify-between"><label htmlFor="socialEnergy" className="text-xs font-bold text-[#514a46]">At-home social energy</label><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#8a61b2]">{socialEnergy}/10</span></div><input id="socialEnergy" type="range" min={1} max={10} step={1} {...register("socialEnergy", { valueAsNumber: true })} className="mt-4 w-full accent-[#a85ccc]" /><div className="mt-1 flex justify-between text-[9px] text-[#a49c97]"><span>Mostly recharge solo</span><span>People are welcome</span></div></div>
            </div>
            <div className="mt-4"><p className="mb-2 text-[11px] font-bold text-[#5f5854]">When do you feel most like yourself?</p><div className="grid gap-2 sm:grid-cols-3">{sleepOptions.map((option) => { const active = sleepSchedule === option.value; return <button key={option.value} type="button" onClick={() => setValue("sleepSchedule", option.value, { shouldDirty: true })} aria-pressed={active} className={`flex items-center gap-2.5 rounded-2xl border p-3 text-left transition ${active ? "border-[#e99cab] bg-[#fff4f5]" : "border-[#eee8e4] bg-white hover:bg-[#fcfaf8]"}`}><span className="text-xl">{option.icon}</span><span><span className="block text-[11px] font-bold text-[#514a46]">{option.label}</span><span className="mt-0.5 block text-[9px] text-[#96908b]">{option.detail}</span></span></button>; })}</div></div>
          </section>

          <div className="my-7 border-t border-[#f0ece9]" />
          <section>
            <SectionHeading number="03" title="Your must-haves" detail="Share the things you need your next home to respect." />
            <div className="flex flex-wrap gap-2">{negotiableOptions.map((tag) => { const active = nonNegotiables.includes(tag); return <button key={tag} type="button" onClick={() => toggleNegotiable(tag)} aria-pressed={active} className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[11px] font-semibold transition ${active ? "border-[#e89aaa] bg-[#fff2f4] text-[#c63d5f]" : "border-[#ece6e2] bg-white text-[#77706c] hover:bg-[#faf7f5]"}`}>{active && <Check className="h-3 w-3" />}{tag}</button>; })}</div>
          </section>

          <div className="my-7 border-t border-[#f0ece9]" />
          <section>
            <SectionHeading number="04" title="Your budget & group plan" detail="A little clarity now can make things easier later." />
            <div className="grid gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-[11px] font-bold text-[#5f5854]">Monthly budget from</span><div className="flex items-center rounded-xl border border-[#eee8e4] bg-[#fcfbfa] px-3.5"><span className="text-sm text-[#9b928d]">$</span><input type="number" min={0} {...register("budget.min", { valueAsNumber: true })} className="w-full bg-transparent px-2 py-3 text-sm outline-none" /></div></label><label className="block"><span className="mb-1.5 block text-[11px] font-bold text-[#5f5854]">Up to</span><div className="flex items-center rounded-xl border border-[#eee8e4] bg-[#fcfbfa] px-3.5"><span className="text-sm text-[#9b928d]">$</span><input type="number" min={0} {...register("budget.max", { valueAsNumber: true })} className="w-full bg-transparent px-2 py-3 text-sm outline-none" /></div></label></div>
            <div className="mt-5"><p className="mb-2 text-[11px] font-bold text-[#5f5854]">What are you looking to do?</p><IntentSelector value={groupIntent} onChange={(value) => setValue("groupIntent", value, { shouldDirty: true })} /></div>
          </section>

          <div className="my-7 border-t border-[#f0ece9]" />
          <section>
            <SectionHeading number="05" title="Where you call campus" detail="Help the right people find you nearby." />
            <div className="grid gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-[11px] font-bold text-[#5f5854]">University</span><input {...register("university")} className="w-full rounded-xl border border-[#eee8e4] bg-[#fcfbfa] px-3.5 py-3 text-sm outline-none focus:border-[#e894a4]" /></label><label className="block"><span className="mb-1.5 block text-[11px] font-bold text-[#5f5854]">Campus or neighborhood</span><input {...register("campus")} className="w-full rounded-xl border border-[#eee8e4] bg-[#fcfbfa] px-3.5 py-3 text-sm outline-none focus:border-[#e894a4]" /></label></div>
          </section>

          {saved && <p role="status" className="mt-5 flex items-center gap-2 rounded-2xl bg-[#f0faf6] px-4 py-3 text-xs font-bold text-[#25856f]"><Check className="h-4 w-4" /> Profile saved. Your people can now get to know you.</p>}
          {error && <p role="alert" className="mt-5 rounded-2xl bg-[#fff3f2] px-4 py-3 text-xs font-medium text-[#b8424e]">{error}</p>}
          <div className="mt-7 flex flex-col-reverse items-center justify-between gap-3 border-t border-[#f0ece9] pt-5 sm:flex-row"><p className="text-[10px] leading-4 text-[#9a928d]">Your profile is yours. You can change it whenever you like.</p><button type="submit" disabled={saving || loadingProfile} className="instagram-gradient inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-bold text-white shadow-[0_8px_20px_rgba(226,67,105,0.18)] transition hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? "Saving your story…" : "Save my profile"}</button></div>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="surface-card overflow-hidden">
            <div className="instagram-gradient h-20" />
            <div className="px-5 pb-5">
              <Photo src="/images/demo/people/portrait-13.jpg" name={displayName || user?.displayName || "You"} size="xl" className="-mt-11 border-[4px] border-white shadow-md" />
              <p className="mt-3 text-lg font-extrabold tracking-[-0.04em] text-[#393330]">{displayName || user?.displayName || "Your name here"}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[#8e8782]"><MapPin className="h-3 w-3" /> {watch("university") || "Your university"} · {watch("campus") || "Your campus"}</p>
              <p className="mt-4 line-clamp-3 text-xs leading-5 text-[#77716d]">{watch("bio") || "A little about you will make the first hello easier."}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">{nonNegotiables.slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-[#fff2f4] px-2.5 py-1 text-[9px] font-semibold text-[#bc4761]">{tag}</span>)}</div>
            </div>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-[#fff0f2] to-[#f4eefe] p-5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/80 text-[#d94b70]"><Sparkles className="h-4 w-4" /></span><h3 className="mt-3 text-xs font-extrabold text-[#52444a]">A small detail goes a long way</h3><p className="mt-1.5 text-[10px] leading-5 text-[#897984]">Profiles with a thoughtful bio and clear preferences make better first conversations.</p></div>
        </aside>
      </div>
    </div>
  );
}
