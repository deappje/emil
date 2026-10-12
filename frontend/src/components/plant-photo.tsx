import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Plant } from "@/lib/plants";
import { PlantArt } from "@/components/plant-art";

/** The plant's photo, or its drawn stand-in when it has none or it fails to load. */
export function PlantPhoto({ plant, className, eager }: { plant: Plant; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!plant.photoUrl || failed === plant.photoUrl) return <PlantArt plant={plant} className={className} />;
  return (
    <img
      src={plant.photoUrl}
      alt={`${plant.name}${plant.latinName ? ` (${plant.latinName})` : ""}`}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(plant.photoUrl)}
      className={cn("bg-secondary object-cover", className)}
    />
  );
}
