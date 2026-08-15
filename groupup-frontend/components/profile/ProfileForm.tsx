"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ProfileUpdatePayloadSchema } from "@/lib/schemas";
import { updateMyProfile } from "@/lib/api";
import { IntentSelector } from "./IntentSelector";

type FormValues = z.infer<typeof ProfileUpdatePayloadSchema>;

const negotiableOptions = ["smoking", "pets", "dietary", "noise_tolerance", "guest_policy"];
const sleepOptions = [
  { value: "EARLY_BIRD", label: "Early bird" },
  { value: "NIGHT_OWL", label: "Night owl" },
  { value: "FLEXIBLE", label: "Flexible" },
] as const;

export function ProfileForm() {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(ProfileUpdatePayloadSchema),
    defaultValues: {
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
    },
  });

  const groupIntent = watch("groupIntent");
  const nonNegotiables = watch("nonNegotiables") ?? [];
  const sleepSchedule = watch("sleepSchedule");

  function toggleNegotiable(tag: string) {
    const current = nonNegotiables;
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    setValue("nonNegotiables", next);
  }

  async function onSubmit(data: FormValues) {
    setError(null);
    setSaved(false);
    try {
      await updateMyProfile(data);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-2">
        <label className="text-sm font-medium">Display name</label>
        <input
          {...register("displayName")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {errors.displayName && (
          <p className="text-sm text-destructive">{String(errors.displayName.message)}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Bio (max 300 chars)</label>
        <textarea
          {...register("bio")}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {errors.bio && (
          <p className="text-sm text-destructive">{String(errors.bio.message)}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Cleanliness (1–10): {watch("cleanliness")}</label>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          {...register("cleanliness", { valueAsNumber: true })}
          className="w-full"
        />
        {errors.cleanliness && (
          <p className="text-sm text-destructive">{String(errors.cleanliness.message)}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Social energy (1–10): {watch("socialEnergy")}</label>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          {...register("socialEnergy", { valueAsNumber: true })}
          className="w-full"
        />
        {errors.socialEnergy && (
          <p className="text-sm text-destructive">{String(errors.socialEnergy.message)}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Sleep schedule</label>
        <div className="flex gap-3">
          {sleepOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setValue("sleepSchedule", o.value)}
              className={`rounded-md border px-3 py-2 text-sm ${
                sleepSchedule === o.value
                  ? "border-match-amber bg-match-amber/10"
                  : "border-border"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Non-negotiables</label>
        <div className="flex flex-wrap gap-2">
          {negotiableOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleNegotiable(tag)}
              className={`rounded-full border px-3 py-1 text-xs ${
                nonNegotiables.includes(tag)
                  ? "border-verified-teal bg-verified-teal/10"
                  : "border-border"
              }`}
            >
              {tag.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Budget min (USD)</label>
          <input
            type="number"
            {...register("budget.min", { valueAsNumber: true })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Budget max (USD)</label>
          <input
            type="number"
            {...register("budget.max", { valueAsNumber: true })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Group intent</label>
        <IntentSelector value={groupIntent} onChange={(v) => setValue("groupIntent", v)} />
      </div>

      {saved && (
        <p className="text-sm font-medium text-verified-teal">Profile saved ✓</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Save profile
      </button>
    </form>
  );
}