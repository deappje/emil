import type { ReactNode } from "react";
import { Leaf } from "lucide-react";
import { BeeIcon } from "@/components/icons";
import type { Plant } from "@/lib/plants";
import type { Filters } from "@/lib/filters";

type Props = { plants: Plant[] | null; onQuick: (patch: Partial<Filters>) => void };

/** One line on what this is, and the catalogue in numbers that double as quick filters. */
export function Intro({ plants, onQuick }: Props) {
  const total = plants?.length ?? 0;
  const native = plants?.filter((p) => p.native).length ?? 0;
  const eco = plants?.filter((p) => p.wildlife.length > 0).length ?? 0;
  const shade = plants?.filter((p) => p.sun.includes("schaduw")).length ?? 0;
  return (
    <section className="relative overflow-hidden border-b bg-leaves">
      <div className="mx-auto grid max-w-[90rem] gap-6 px-4 py-8 sm:px-6 md:grid-cols-[1fr_auto] md:items-end md:py-10">
        <div className="max-w-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
          <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
            Elke tuinplant op <em className="text-primary">zijn plek</em>
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
            Filter op standplaats, hoogte, bloeikleur en bloeitijd, en zie meteen welke planten inheems zijn en
            bijen, vlinders of vogels helpen.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:w-[34rem]">
          <Stat label="planten" value={total} />
          <Stat label="inheems" value={native} icon={<Leaf className="size-4" />} onClick={() => onQuick({ props: ["inheems"] })} />
          <Stat label="ecologisch waardevol" value={eco} icon={<BeeIcon className="size-4" />} onClick={() => onQuick({ props: ["eco"] })} />
          <Stat label="voor de schaduw" value={shade} onClick={() => onQuick({ sun: ["schaduw"] })} />
        </dl>
      </div>
    </section>
  );
}

function Stat({ label, value, icon, onClick }: { label: string; value: number; icon?: ReactNode; onClick?: () => void }) {
  const body = (
    <>
      <dd className="flex items-center gap-1.5 font-display text-3xl font-semibold tabular-nums">
        {value}
        {icon && <span className="text-terra">{icon}</span>}
      </dd>
      <dt className="text-xs text-muted-foreground">{label}</dt>
    </>
  );
  const cls = "flex flex-col-reverse rounded-xl border bg-card/80 px-4 py-3 text-left shadow-card backdrop-blur";
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} transition-colors hover:border-primary/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none`}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}
