import { cn } from "@/lib/utils";
import { FILL, SWATCH, type Plant } from "@/lib/plants";

/**
 * Stands in for a missing photo: a soft field in the plant's first flower
 * colour (or green) with a drawn silhouette that fits its type.
 */
export function PlantArt({ plant, className }: { plant: Plant; className?: string }) {
  const color = plant.flowerColors[0] ?? plant.leafColors.find((c) => c !== "groen") ?? "groen";
  const shape = ["boom", "conifeer", "fruit"].includes(plant.type)
    ? "tree"
    : ["siergras", "varen"].includes(plant.type)
      ? "grass"
      : plant.flowerColors.length
        ? "flower"
        : "leaf";
  return (
    <div className={cn("relative grid place-items-center overflow-hidden bg-secondary bg-dots", className)} aria-hidden="true">
      <div className={cn("absolute inset-x-[20%] top-[18%] aspect-square rounded-full opacity-35 blur-2xl", SWATCH[color])} />
      <svg viewBox="0 0 120 120" className="relative h-3/5 text-primary">
        {shape === "flower" && (
          <g>
            <path d="M60 112V58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <path d="M60 86c-12-2-20-10-22-22 12 1 20 9 22 22Zm0-8c10-2 17-9 19-19-10 1-17 8-19 19Z" fill="currentColor" opacity=".7" />
            <g className={FILL[color]}>
              {[0, 72, 144, 216, 288].map((r) => (
                <ellipse key={r} cx="60" cy="34" rx="9" ry="16" transform={`rotate(${r} 60 48)`} stroke="currentColor" strokeOpacity=".25" />
              ))}
            </g>
            <circle cx="60" cy="48" r="7" className="fill-swatch-geel" stroke="currentColor" strokeOpacity=".3" />
          </g>
        )}
        {shape === "tree" && (
          <g fill="currentColor">
            <path d="M57 112V70h6v42z" />
            <circle cx="60" cy="50" r="30" opacity=".75" />
            <circle cx="42" cy="62" r="16" opacity=".55" />
            <circle cx="78" cy="62" r="16" opacity=".55" />
          </g>
        )}
        {shape === "grass" && (
          <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".8">
            <path d="M60 112C58 80 52 50 40 24M60 112c2-30 8-58 24-84M60 112c0-34 0-62 0-90M60 112C50 88 36 70 18 58M60 112c10-24 24-42 42-54" />
          </g>
        )}
        {shape === "leaf" && (
          <g fill="currentColor">
            <path d="M28 98c0-42 26-68 68-72-2 44-28 70-68 72Z" opacity=".75" />
            <path d="M28 98 76 46" stroke="var(--background)" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
}
