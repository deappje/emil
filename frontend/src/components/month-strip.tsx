import { MONTHS, MONTH_NAMES } from "@/lib/plants";
import { cn } from "@/lib/utils";

/** The year as twelve cells, the bloom months filled. */
export function MonthStrip({ months }: { months: number[] }) {
  return (
    <ol className="grid grid-cols-12 gap-1" aria-label="Bloeikalender">
      {MONTHS.map((m, i) => {
        const on = months.includes(i + 1);
        return (
          <li key={m} className="flex flex-col items-center gap-1" title={MONTH_NAMES[i]}>
            <span className={cn("h-2.5 w-full rounded-full", on ? "bg-primary" : "bg-muted")} />
            <span className={cn("text-[10px] uppercase", on ? "font-semibold text-foreground" : "text-muted-foreground")}>
              {m.slice(0, 1)}
              <span className="sr-only">{m.slice(1)}{on ? " (bloeit)" : ""}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
