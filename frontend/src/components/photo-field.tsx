import { useEffect, useState } from "react";
import { ImagePlus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shrinkImage } from "@/lib/image";
import { errorMessage } from "@/lib/utils";

/** What the form will do with the photo on save. */
export type PhotoChange = { kind: "keep" } | { kind: "remove" } | { kind: "upload"; blob: Blob };

type Props = { current: string; change: PhotoChange; onChange: (c: PhotoChange) => void; enabled: boolean };

export function PhotoField({ current, change, onChange, enabled }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (change.kind !== "upload") return setPreview(null);
    const url = URL.createObjectURL(change.blob);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [change]);

  const pick = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    try {
      onChange({ kind: "upload", blob: await shrinkImage(file) });
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const shown = change.kind === "upload" ? preview : change.kind === "remove" ? null : current || null;

  return (
    <div className="flex gap-4">
      <div className="grid aspect-[4/3] w-36 shrink-0 place-items-center overflow-hidden rounded-lg border bg-muted">
        {shown ? <img src={shown} alt="Voorbeeld van de foto" className="size-full object-cover" /> : <ImagePlus className="size-6 text-muted-foreground" />}
      </div>
      <div className="flex flex-col items-start gap-2">
        {enabled ? (
          <>
            <Button asChild variant="outline" size="sm">
              <label className="cursor-pointer has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50">
                <ImagePlus /> {shown ? "Andere foto kiezen" : "Foto kiezen"}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
              </label>
            </Button>
            {shown && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(current ? { kind: "remove" } : { kind: "keep" })}>
                <Trash /> Foto verwijderen
              </Button>
            )}
            <p className="text-xs text-muted-foreground">Wordt verkleind tot 1600 pixels voor het uploaden.</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Foto-opslag is in deze omgeving niet ingesteld.</p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
