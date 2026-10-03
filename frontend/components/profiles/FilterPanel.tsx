import { Search, SlidersHorizontal, Sparkles } from "lucide-react";

export interface Filters {
  q: string;
  group_intent: string;
  budget_max: number;
  campus: string;
}

const intentOptions = [
  { value: "", label: "Any group plan" },
  { value: "SOLO_NEW", label: "Start something new" },
  { value: "PAIR_ADD", label: "Join an existing group" },
  { value: "SOLO_JOIN", label: "Find a group to join" },
];
const campusOptions = ["", "Main Campus", "North Campus", "East Campus", "South Campus"];

export function FilterPanel({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
}) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  function clear() {
    onChange({ q: "", group_intent: "", budget_max: 0, campus: "" });
  }

  return (
    <aside className="surface-card h-fit p-5 lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#fff0f2] text-[#d94368]"><SlidersHorizontal className="h-4 w-4" /></span>
          <div><h2 className="text-sm font-bold text-[#322e2b]">Tune your search</h2><p className="text-[10px] text-[#928c88]">Find a good fit</p></div>
        </div>
        <button onClick={clear} className="text-[11px] font-semibold text-[#d84d6c] hover:underline">Reset</button>
      </div>

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold text-[#5f5956]">Search people or campus</span>
          <span className="flex items-center gap-2 rounded-xl border border-[#eee9e5] bg-[#fcfbfa] px-3 py-2.5 focus-within:border-[#ec9aa9]">
            <Search className="h-4 w-4 shrink-0 text-[#a29b97]" />
            <input
              value={filters.q}
              onChange={(event) => set("q", event.target.value)}
              placeholder="Try ‘Main Campus’"
              className="w-full bg-transparent text-xs outline-none placeholder:text-[#b1aaa5]"
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold text-[#5f5956]">Group plan</span>
          <select
            value={filters.group_intent}
            onChange={(event) => set("group_intent", event.target.value)}
            className="w-full rounded-xl border border-[#eee9e5] bg-[#fcfbfa] px-3 py-2.5 text-xs text-[#57514e] outline-none focus:border-[#ec9aa9]"
          >
            {intentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="flex items-center justify-between text-[11px] font-bold text-[#5f5956]">
            Monthly budget
            <span className="rounded-full bg-[#fff4e6] px-2 py-1 text-[10px] font-bold text-[#a36b30]">{filters.budget_max ? `Up to $${filters.budget_max}` : "Any range"}</span>
          </span>
          <input
            type="range"
            min={0}
            max={1600}
            step={100}
            value={filters.budget_max}
            onChange={(event) => set("budget_max", Number(event.target.value))}
            className="mt-3 w-full accent-[#e74369]"
          />
          <span className="flex justify-between text-[10px] text-[#aaa39f]"><span>Any</span><span>$1,600+</span></span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[11px] font-bold text-[#5f5956]">Campus</span>
          <select
            value={filters.campus}
            onChange={(event) => set("campus", event.target.value)}
            className="w-full rounded-xl border border-[#eee9e5] bg-[#fcfbfa] px-3 py-2.5 text-xs text-[#57514e] outline-none focus:border-[#ec9aa9]"
          >
            {campusOptions.map((campus) => <option key={campus} value={campus}>{campus || "All campuses"}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-[#f8f4ff] p-3.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#8a5bc1]" />
        <p className="text-[11px] leading-4 text-[#78668c]">The best matches start with the little things you share.</p>
      </div>
    </aside>
  );
}
