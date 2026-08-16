"use client";

import { useState } from "react";

const items = [
  "Budget split agreement",
  "Noise / quiet hours",
  "Guest policy",
  "Cleaning / chores",
  "Lease timeline expectation",
];

export function GroupAgreementTemplate({
  onClose,
}: {
  onClose: () => void;
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Group agreement template</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Non-binding — a checklist to align expectations before committing.
        </p>

        <div className="mt-4 space-y-2">
          {items.map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!checked[item]}
                onChange={(e) => setChecked((c) => ({ ...c, [item]: e.target.checked }))}
              />
              {item}
            </label>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}