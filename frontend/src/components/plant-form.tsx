import { useEffect, useState, type FormEvent } from "react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import { PlantFormFields } from "@/components/plant-form-fields";
import { PhotoField, type PhotoChange } from "@/components/photo-field";
import { api } from "@/lib/api";
import { emptyPlant, type Plant, type PlantInput } from "@/lib/plants";
import { useSession } from "@/lib/session";
import { errorMessage } from "@/lib/utils";

type Props = {
  /** The plant to edit, "new" for a new one, or null when closed. */
  plant: Plant | "new" | null;
  onClose: () => void;
  /** The plant was stored (also when its photo then failed). */
  onStored: (p: Plant) => void;
  /** Everything was saved; the form can close. */
  onSaved: (p: Plant) => void;
};

function toInput(p: Plant): PlantInput {
  const { id: _id, photoUrl: _url, updatedAt: _at, updatedBy: _by, ...input } = p;
  return input;
}

export function PlantForm({ plant, onClose, onStored, onSaved }: Props) {
  const { photoUpload } = useSession();
  const [value, setValue] = useState<PlantInput>(emptyPlant);
  const [photo, setPhoto] = useState<PhotoChange>({ kind: "keep" });
  const [errors, setErrors] = useState<Partial<Record<keyof PlantInput, string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set once a new plant exists, so a retry after a failed photo upload
  // updates it instead of adding it twice.
  const [storedId, setStoredId] = useState<number | null>(null);

  useEffect(() => {
    if (plant === null) return;
    setValue(plant === "new" ? emptyPlant() : toInput(plant));
    setStoredId(null);
    setPhoto({ kind: "keep" });
    setErrors({});
    setError(null);
  }, [plant]);

  const validate = () => {
    const e: typeof errors = {};
    if (!value.name.trim()) e.name = "Vul een naam in.";
    if (value.sourceUrl && !/^https?:\/\//.test(value.sourceUrl)) e.sourceUrl = "Begin de link met https://";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setError(null);
    try {
      const id = plant && plant !== "new" ? plant.id : storedId;
      let saved = id
        ? await api<Plant>(`/api/plants/${id}`, { method: "PUT", json: value })
        : await api<Plant>("/api/plants", { method: "POST", json: value });
      setStoredId(saved.id);
      onStored(saved);
      if (photo.kind === "upload") {
        saved = await api<Plant>(`/api/plants/${saved.id}/photo`, { method: "PUT", body: photo.blob, contentType: photo.blob.type });
      } else if (photo.kind === "remove") {
        saved = await api<Plant>(`/api/plants/${saved.id}/photo`, { method: "DELETE" });
      }
      onSaved(saved);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const isNew = plant === "new";
  return (
    <Sheet open={plant !== null} onOpenChange={(o) => !o && !busy && onClose()}>
      <SheetContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).querySelector<HTMLInputElement>('input[name="name"]')?.focus();
        }}
      >
        <form onSubmit={submit} className="flex h-full flex-col" noValidate>
          <SheetHeader>
            <SheetTitle>{isNew ? "Plant toevoegen" : `${value.name || "Plant"} bewerken`}</SheetTitle>
            <SheetDescription>Kies alles wat van toepassing is; je kunt het later altijd aanpassen.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6">
            <fieldset className="space-y-3">
              <legend className="mb-3 font-display text-lg font-semibold">Foto</legend>
              <PhotoField
                current={plant && plant !== "new" ? plant.photoUrl : ""}
                change={photo}
                onChange={setPhoto}
                enabled={photoUpload}
              />
              <Field
                label="Fotobron"
                value={value.photoCredit}
                onChange={(photoCredit) => setValue({ ...value, photoCredit })}
                placeholder="Bijv. Foto: directplant.nl"
              />
            </fieldset>
            <PlantFormFields value={value} onChange={setValue} errors={errors} />
          </div>
          <SheetFooter className="flex-col sm:flex-row sm:items-center">
            {error && <p className="text-sm text-destructive sm:mr-auto">{error}</p>}
            <Button type="button" variant="ghost" onClick={onClose} disabled={busy} className="sm:ml-auto">
              Annuleren
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Opslaan…" : isNew ? "Plant toevoegen" : "Wijzigingen opslaan"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
