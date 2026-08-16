export interface Filters {
  q: string;
  group_intent: string;
  budget_max: number;
  campus: string;
}

const intentOptions = ["", "SOLO_NEW", "PAIR_ADD", "SOLO_JOIN"];
const campusOptions = ["", "Main Campus", "North Campus", "East Campus", "South Campus"];

export function FilterPanel({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <p className="text-sm font-medium">Filters</p>

      <input
        value={filters.q}
        onChange={(e) => set("q", e.target.value)}
        placeholder="Search name or university"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Group intent</label>
        <select
          value={filters.group_intent}
          onChange={(e) => set("group_intent", e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {intentOptions.map((o) => (
            <option key={o} value={o}>
              {o === "" ? "All intents" : o}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">
          Max budget: ${filters.budget_max || "—"}
        </label>
        <input
          type="range"
          min={0}
          max={2000}
          step={100}
          value={filters.budget_max}
          onChange={(e) => set("budget_max", Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Campus</label>
        <select
          value={filters.campus}
          onChange={(e) => set("campus", e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {campusOptions.map((o) => (
            <option key={o} value={o}>
              {o === "" ? "All campuses" : o}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}