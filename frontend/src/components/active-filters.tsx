import { X } from "lucide-react";
import { GROUPS, PROPS, SIZES, type Filters, type Group } from "@/lib/filters";
import {
  FLOWER_COLORS, LEAF_COLORS, LIFECYCLES, MOISTURE, MONTH_NAMES, PLANT_TYPES, SUN, WILDLIFE, labelOf, type Option,
} from "@/lib/plants";

const OPTIONS: Record<Group, Option[]> = {
  type: PLANT_TYPES,
  sun: SUN,
  size: SIZES,
  flower: FLOWER_COLORS.map((o) => ({ ...o, label: `Bloei ${o.label.toLowerCase()}` })),
  leaf: LEAF_COLORS.map((o) => ({ ...o, label: `Blad ${o.label.toLowerCase()}` })),
  month: MONTH_NAMES.map((m, i) => ({ value: String(i + 1), label: `Bloeit in ${m}` })),
  life: LIFECYCLES,
  moisture: MOISTURE.map((o) => ({ ...o, label: `${o.label} (grond)` })),
  wildlife: WILDLIFE,
  props: PROPS,
};

/** The active filters as removable chips above the results. */
export function ActiveFilters({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const chips = GROUPS.flatMap((g) => filters[g].map((v) => ({ g, v, label: labelOf(OPTIONS[g], v) })));
  if (filters.q) chips.unshift({ g: "type", v: "\u0000q", label: `“${filters.q}”` });
  if (chips.length === 0) return null;
  const remove = (g: Group, v: string) =>
    onChange(v === "\u0000q" ? { ...filters, q: "" } : { ...filters, [g]: filters[g].filter((x) => x !== v) });
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Actieve filters">
      {chips.map(({ g, v, label }) => (
        <li key={`${g}:${v}`}>
          <button
            type="button"
            onClick={() => remove(g, v)}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-secondary pr-2 pl-3 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/70 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {label}
            <X className="size-3.5" aria-label="verwijderen" />
          </button>
        </li>
      ))}
    </ul>
  );
}
