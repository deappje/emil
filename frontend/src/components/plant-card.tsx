import { Leaf } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PlantPhoto } from "@/components/plant-photo";
import { SUN_ICON, WILDLIFE_ICON } from "@/components/icons";
import { FLOWER_COLORS, PLANT_TYPES, SUN, SWATCH, WILDLIFE, formatHeight, labelOf, type Plant } from "@/lib/plants";
import { cn } from "@/lib/utils";

export function PlantCard({ plant, onOpen }: { plant: Plant; onOpen: () => void }) {
  const height = formatHeight(plant.heightMin, plant.heightMax);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex size-full flex-col overflow-hidden rounded-xl border bg-card text-left shadow-card transition-[transform,box-shadow,border-color] duration-300 outline-none hover:border-primary/30 hover:shadow-glow focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-safe:hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <PlantPhoto plant={plant} className="size-full transition-transform duration-500 motion-safe:group-hover:scale-[1.04]" />
        <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
          <Badge variant="glass">{labelOf(PLANT_TYPES, plant.type)}</Badge>
          {plant.native && (
            <Badge variant="native" className="shadow-sm">
              <Leaf /> Inheems
            </Badge>
          )}
        </div>
        {plant.wildlife.length > 0 && (
          <div className="absolute right-2.5 bottom-2.5 flex gap-1 rounded-full bg-card/85 px-2 py-1 text-primary shadow-sm backdrop-blur-md">
            {plant.wildlife.map((w) => {
              const Icon = WILDLIFE_ICON[w];
              return Icon ? <Icon key={w} className="size-4" aria-label={labelOf(WILDLIFE, w)} /> : null;
            })}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-lg leading-snug font-semibold">{plant.name}</h3>
          {plant.latinName && <p className="text-sm text-muted-foreground italic">{plant.latinName}</p>}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1" title={plant.sun.map((s) => labelOf(SUN, s)).join(", ")}>
            {plant.sun.map((s) => {
              const Icon = SUN_ICON[s];
              return <Icon key={s} className="size-4 text-terra" aria-label={labelOf(SUN, s)} />;
            })}
          </span>
          {height && <span>{height}</span>}
          {plant.flowerColors.length > 0 && (
            <span className="ml-auto flex -space-x-1" title={plant.flowerColors.map((c) => labelOf(FLOWER_COLORS, c)).join(", ")}>
              {plant.flowerColors.map((c) => (
                <span key={c} className={cn("size-4 rounded-full border-2 border-card ring-1 ring-foreground/15", SWATCH[c])} />
              ))}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
