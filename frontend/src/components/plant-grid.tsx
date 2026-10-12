import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlantCard } from "@/components/plant-card";
import type { Plant } from "@/lib/plants";

const PAGE = 48;

/** The cards, shown 48 at a time so a catalogue of thousands stays quick. */
export function PlantGrid({ plants, onOpen }: { plants: Plant[]; onOpen: (id: number) => void }) {
  const [shown, setShown] = useState(PAGE);
  useEffect(() => setShown(PAGE), [plants]);
  return (
    <>
      <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {plants.slice(0, shown).map((p, i) => (
          <li
            key={p.id}
            className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:fill-mode-both"
            style={{ animationDelay: `${Math.min(i % PAGE, 12) * 35}ms` }}
          >
            <PlantCard plant={p} onOpen={() => onOpen(p.id)} />
          </li>
        ))}
      </ul>
      {plants.length > shown && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <Button variant="outline" onClick={() => setShown((n) => n + PAGE)}>
            Meer planten tonen
          </Button>
          <p className="text-xs text-muted-foreground">
            {shown} van {plants.length} getoond
          </p>
        </div>
      )}
    </>
  );
}

export function PlantGridSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="Planten laden">
      {Array.from({ length: 8 }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-xl border bg-card">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="mt-4 h-4 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}
