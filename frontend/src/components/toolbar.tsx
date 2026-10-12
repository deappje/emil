import { ArrowUpDown, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SORTS, type Sort } from "@/lib/filters";

type Props = {
  total: number;
  shown: number;
  sort: Sort;
  onSort: (s: Sort) => void;
  activeFilters: number;
  onOpenFilters: () => void;
  onAdd?: () => void;
};

export function Toolbar({ total, shown, sort, onSort, activeFilters, onOpenFilters, onAdd }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="mr-auto text-sm text-muted-foreground" aria-live="polite">
        <span className="font-display text-2xl font-semibold text-foreground tabular-nums">{shown}</span>{" "}
        {shown === total ? "planten" : `van ${total} planten`}
      </p>
      <Button variant="outline" className="lg:hidden" onClick={onOpenFilters}>
        <SlidersHorizontal />
        Filters
        {activeFilters > 0 && (
          <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] text-primary-foreground">
            {activeFilters}
          </span>
        )}
      </Button>
      <Select value={sort} onValueChange={(v) => onSort(v as Sort)}>
        <SelectTrigger className="w-auto gap-2 rounded-full" aria-label="Sorteren">
          <ArrowUpDown className="size-4 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {SORTS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {onAdd && (
        <Button onClick={onAdd}>
          <Plus />
          Plant toevoegen
        </Button>
      )}
    </div>
  );
}
