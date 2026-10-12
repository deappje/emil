import type { ReactNode } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Option } from "@/lib/plants";

type Props = {
  label: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  /** Matches per option; options with none are disabled unless selected. */
  counts?: Record<string, number>;
  icon?: (value: string) => ReactNode;
};

/** A set of on/off chips for choosing several values. */
export function ChipGroup({ label, options, value, onChange, counts, icon }: Props) {
  return (
    <ToggleGroup type="multiple" value={value} onValueChange={onChange} aria-label={label}>
      {options.map((o) => {
        const n = counts?.[o.value] ?? 0;
        const on = value.includes(o.value);
        return (
          <ToggleGroupItem key={o.value} value={o.value} disabled={counts !== undefined && n === 0 && !on}>
            {icon?.(o.value)}
            {o.label}
            {counts !== undefined && <span className="text-[11px] tabular-nums opacity-60">{n}</span>}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
