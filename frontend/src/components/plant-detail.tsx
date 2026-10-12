import { useState } from "react";
import { ExternalLink, Leaf, Pencil, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlantPhoto } from "@/components/plant-photo";
import { PlantFacts } from "@/components/plant-facts";
import { MonthStrip } from "@/components/month-strip";
import { WILDLIFE_ICON } from "@/components/icons";
import { LIFECYCLES, PLANT_TYPES, WILDLIFE, formatMonths, labelOf, type Plant } from "@/lib/plants";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/utils";

type Props = {
  plant: Plant | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (p: Plant) => void;
  onDeleted: (id: number) => void;
};

export function PlantDetail({ plant, canEdit, onClose, onEdit, onDeleted }: Props) {
  return (
    <Dialog open={plant !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {plant && <DetailBody plant={plant} canEdit={canEdit} onEdit={onEdit} onDeleted={onDeleted} />}
      </DialogContent>
    </Dialog>
  );
}

function DetailBody({ plant, canEdit, onEdit, onDeleted }: Omit<Props, "plant" | "onClose"> & { plant: Plant }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/plants/${plant.id}`, { method: "DELETE" });
      onDeleted(plant.id);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <>
      <figure className="relative bg-secondary md:min-h-full">
        <PlantPhoto plant={plant} eager className="aspect-[4/3] w-full md:absolute md:inset-0 md:aspect-auto md:h-full" />
        {plant.photoCredit && <PhotoCredit text={plant.photoCredit} />}
      </figure>
      <div className="flex flex-col gap-5 p-6 md:max-h-[calc(100dvh-2rem)] md:overflow-y-auto">
        <div className="pr-8">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary">{labelOf(PLANT_TYPES, plant.type)}</Badge>
            <Badge variant="outline">{labelOf(LIFECYCLES, plant.lifecycle)}</Badge>
            {plant.native && (
              <Badge variant="native">
                <Leaf /> Inheems
              </Badge>
            )}
          </div>
          <DialogTitle className="text-3xl">{plant.name}</DialogTitle>
          <DialogDescription className="mt-1 text-base italic">{plant.latinName || "Botanische naam onbekend"}</DialogDescription>
        </div>

        <PlantFacts plant={plant} />

        {plant.bloomMonths.length > 0 && (
          <div>
            <p className="mb-2 text-sm">
              <span className="font-medium">Bloei</span>{" "}
              <span className="text-muted-foreground">{formatMonths(plant.bloomMonths)}</span>
            </p>
            <MonthStrip months={plant.bloomMonths} />
          </div>
        )}

        {plant.wildlife.length > 0 && (
          <div className="rounded-xl bg-secondary/60 p-4">
            <p className="mb-2 text-sm font-medium">Ecologisch waardevol voor</p>
            <ul className="flex flex-wrap gap-2">
              {plant.wildlife.map((w) => {
                const Icon = WILDLIFE_ICON[w];
                return (
                  <li key={w} className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm shadow-xs">
                    <Icon className="size-4 text-primary" /> {labelOf(WILDLIFE, w)}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {plant.description && <p className="leading-relaxed whitespace-pre-line text-foreground/90">{plant.description}</p>}

        {plant.sourceUrl && (
          <a href={plant.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1.5 text-sm text-primary hover:underline">
            Bekijk bij de bron <ExternalLink className="size-3.5" />
          </a>
        )}

        {canEdit && (
          <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-4">
            <Button onClick={() => onEdit(plant)}>
              <Pencil /> Bewerken
            </Button>
            {confirming ? (
              <>
                <Button variant="destructive" onClick={remove} disabled={busy}>
                  {busy ? "Verwijderen…" : "Ja, verwijderen"}
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
                  Annuleren
                </Button>
              </>
            ) : (
              <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirming(true)}>
                <Trash /> Verwijderen
              </Button>
            )}
            {plant.updatedBy && (
              <p className="w-full text-xs text-muted-foreground">
                Laatst bijgewerkt door {plant.updatedBy} op {new Date(plant.updatedAt).toLocaleDateString("nl-NL")}
              </p>
            )}
            {error && <p className="w-full text-sm text-destructive">{error}</p>}
          </div>
        )}
      </div>
    </>
  );
}

/** The credit line, with a link in it (as in the Wikimedia credits) shown as "bron". */
function PhotoCredit({ text }: { text: string }) {
  const url = text.match(/https?:\/\/\S+?(?=\)?$|\s|\)\s)/)?.[0];
  const label = url ? text.replace(url, "").replace(/\(\s*\)/, "").trim() : text;
  return (
    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-8 pb-2 text-[11px] leading-snug text-white/90">
      {label}
      {url && (
        <>
          {" · "}
          <a href={url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-white">
            bron
          </a>
        </>
      )}
    </figcaption>
  );
}
