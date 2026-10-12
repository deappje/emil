import type { ReactNode } from "react";
import { Droplets, Ruler, Snowflake, Sprout, Sun } from "lucide-react";
import { FLOWER_COLORS, LEAF_COLORS, MOISTURE, SUN, SWATCH, formatHeight, labelOf, type Option, type Plant } from "@/lib/plants";
import { cn } from "@/lib/utils";

/** The plant's measurable properties as a compact grid. */
export function PlantFacts({ plant }: { plant: Plant }) {
  const list = (values: string[], options: Option[]) => values.map((v) => labelOf(options, v)).join(", ");
  const swatches = (values: string[], options: Option[]) =>
    values.length ? (
      <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {values.map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5">
            <span className={cn("size-3 rounded-full border border-foreground/15", SWATCH[c])} />
            {labelOf(options, c)}
          </span>
        ))}
      </span>
    ) : null;
  const traits = [
    plant.evergreen && "Groenblijvend",
    plant.hardy ? "Winterhard" : "Niet winterhard",
    plant.fragrant && "Geurend",
    plant.edible && "Eetbaar",
    plant.toxic && "Giftig",
  ].filter((t): t is string => Boolean(t));
  const height = formatHeight(plant.heightMin, plant.heightMax);

  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      <Fact icon={<Sun />} label="Standplaats">{list(plant.sun, SUN)}</Fact>
      <Fact icon={<Ruler />} label="Hoogte">
        {height && (
          <>
            {height}
            {plant.width ? <span className="text-muted-foreground"> · {formatHeight(plant.width, plant.width)} breed</span> : null}
          </>
        )}
      </Fact>
      <Fact label="Bloeikleur">{swatches(plant.flowerColors, FLOWER_COLORS)}</Fact>
      <Fact label="Bladkleur">{swatches(plant.leafColors, LEAF_COLORS)}</Fact>
      <Fact icon={<Droplets />} label="Grond">{list(plant.moisture, MOISTURE)}</Fact>
      <Fact icon={plant.hardy ? <Snowflake /> : <Sprout />} label="Eigenschappen">
        {traits.map((t, i) => (
          <span key={t} className={cn(t === "Giftig" && "font-medium text-destructive")}>
            {i > 0 && ", "}
            {t}
          </span>
        ))}
      </Fact>
    </dl>
  );
}

function Fact({ icon, label, children }: { icon?: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase [&_svg]:size-3.5">
        {icon}
        {label}
      </dt>
      <dd>{children || <span className="text-muted-foreground">Onbekend</span>}</dd>
    </div>
  );
}
