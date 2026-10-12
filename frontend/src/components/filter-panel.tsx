import type { ReactNode } from "react";
import { ChipGroup } from "@/components/chip-group";
import { SUN_ICON, WILDLIFE_ICON } from "@/components/icons";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { PROPS, SIZES, activeCount, type Filters, type Group } from "@/lib/filters";
import { FLOWER_COLORS, LEAF_COLORS, LIFECYCLES, MOISTURE, MONTHS, MONTH_NAMES, PLANT_TYPES, SUN, SWATCH, WILDLIFE } from "@/lib/plants";
import { cn } from "@/lib/utils";

type Props = {
  filters: Filters;
  counts: Record<Group, Record<string, number>>;
  onChange: (f: Filters) => void;
  /** The mobile sheet shows its own title. */
  showHeading?: boolean;
};

const swatch = (c: string) => <span className={cn("size-3.5 rounded-full border border-foreground/15", SWATCH[c])} />;

export function FilterPanel({ filters, counts, onChange, showHeading = true }: Props) {
  const set = (g: Group) => (value: string[]) => onChange({ ...filters, [g]: value });
  const section = (g: Group, title: string, body: ReactNode) => (
    <section key={g} className="border-b py-4 last:border-b-0">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{title}</h3>
        {filters[g].length > 0 && (
          <button type="button" className="text-xs text-primary hover:underline" onClick={() => set(g)([])}>
            Wissen
          </button>
        )}
      </div>
      {body}
    </section>
  );
  const chips = (g: Group, title: string, options: typeof SUN, icon?: (v: string) => ReactNode) =>
    section(g, title, <ChipGroup label={title} options={options} value={filters[g]} onChange={set(g)} counts={counts[g]} icon={icon} />);

  return (
    <div>
      <div className="flex min-h-9 items-center justify-between pb-2">
        {showHeading && <h2 className="font-display text-xl font-semibold">Filters</h2>}
        {activeCount({ ...filters, q: "" }) > 0 && (
          <Button variant="link" size="sm" className="px-0" onClick={() => onChange({ ...filters, ...emptyGroups })}>
            Alles wissen
          </Button>
        )}
      </div>
      {chips("sun", "Standplaats", SUN, (v) => {
        const Icon = SUN_ICON[v];
        return <Icon />;
      })}
      {chips("type", "Soort plant", PLANT_TYPES)}
      {chips("size", "Hoogte", SIZES)}
      {chips("flower", "Bloeikleur", FLOWER_COLORS, swatch)}
      {section(
        "month",
        "Bloeimaand",
        <ToggleGroup type="multiple" variant="cell" value={filters.month} onValueChange={set("month")} aria-label="Bloeimaand">
          {MONTHS.map((m, i) => (
            <ToggleGroupItem key={m} value={String(i + 1)} aria-label={MONTH_NAMES[i]} title={MONTH_NAMES[i]}>
              {m.slice(0, 1).toUpperCase()}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>,
      )}
      {chips("wildlife", "Waardevol voor", WILDLIFE, (v) => {
        const Icon = WILDLIFE_ICON[v];
        return <Icon className="size-4" />;
      })}
      {chips("props", "Eigenschappen", PROPS)}
      {chips("life", "Levensduur", LIFECYCLES)}
      {chips("moisture", "Vochtigheid grond", MOISTURE)}
      {chips("leaf", "Bladkleur", LEAF_COLORS, swatch)}
    </div>
  );
}

const emptyGroups = {
  type: [], sun: [], size: [], flower: [], leaf: [], month: [], life: [], moisture: [], wildlife: [], props: [],
} satisfies Record<Group, string[]>;
