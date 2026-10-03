"use client";

import { useState } from "react";
import { Check, ClipboardCheck, X } from "lucide-react";

const items = [
  "Budget split agreement",
  "Noise / quiet hours",
  "Guest policy",
  "Cleaning / chores",
  "Lease timeline expectation",
];

export function GroupAgreementTemplate({ onClose }: { onClose: () => void }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const completed = Object.values(checked).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#23171c]/55 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[440px] overflow-hidden rounded-[28px] bg-white p-6 shadow-[0_30px_100px_rgba(15,10,12,0.28)] sm:p-8">
        <button onClick={onClose} aria-label="Close" className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-[#f5f2f0] text-[#77716f] hover:bg-[#fff0f2] hover:text-[#d94368]"><X className="h-4 w-4" /></button>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f2eaff] text-[#8b58c0]"><ClipboardCheck className="h-5 w-5" /></span>
        <p className="eyebrow mt-5">Before you find a place</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.05em] text-[#302c29]">Group agreement template</h2>
        <p className="mt-2 pr-5 text-xs leading-5 text-[#817a76]">A non-binding checklist to get the important conversations started—together.</p>
        <div className="mt-5 space-y-2">
          {items.map((item) => {
            const isChecked = !!checked[item];
            return (
              <label key={item} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition ${isChecked ? "border-[#d5eee7] bg-[#f3fbf8]" : "border-[#f0ece9] bg-white hover:bg-[#fcfaf8]"}`}>
                <input type="checkbox" checked={isChecked} onChange={(event) => setChecked((current) => ({ ...current, [item]: event.target.checked }))} className="sr-only" />
                <span className={`grid h-6 w-6 place-items-center rounded-full border ${isChecked ? "border-[#299a7e] bg-[#299a7e] text-white" : "border-[#ddd6d2] bg-white text-transparent"}`}><Check className="h-3.5 w-3.5" /></span>
                <span className="flex-1 text-xs font-semibold text-[#5a534f]">{item}</span>
                {isChecked && <span className="text-[9px] font-bold text-[#299a7e]">Aligned</span>}
              </label>
            );
          })}
        </div>
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#faf7f5] px-4 py-3"><p className="text-[10px] font-semibold text-[#817a76]">{completed} of {items.length} topics checked in</p><div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#eae4e0]"><div className="h-full rounded-full bg-[#2ba184] transition-all" style={{ width: `${(completed / items.length) * 100}%` }} /></div></div>
        <button onClick={onClose} className="instagram-gradient mt-5 w-full rounded-full px-5 py-3 text-xs font-bold text-white">Acknowledge</button>
        <p className="mt-3 text-center text-[10px] text-[#a29a96]">A conversation starter, not a contract.</p>
      </div>
    </div>
  );
}
