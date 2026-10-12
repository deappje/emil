import { useState } from "react";
import { FileUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { parseImportFile, type Row } from "@/lib/csv";
import { errorMessage } from "@/lib/utils";

type Result = { created: number; updated: number; photos: number; problems: string[] };

const BATCH = 25;

/**
 * Reads a CSV or JSON file in the browser and sends it in batches, so a
 * catalogue of thousands imports with visible progress. Plants are matched
 * on botanical name: existing ones are updated, new ones added.
 */
export function ImportDialog({ open, onOpenChange, onImported }: { open: boolean; onOpenChange: (o: boolean) => void; onImported: () => void }) {
  const [file, setFile] = useState<{ name: string; rows: Row[] } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setProgress(null);
    setResult(null);
    setError(null);
  };

  const choose = async (f: File | undefined) => {
    reset();
    if (!f) return;
    try {
      const rows = parseImportFile(await f.text());
      if (rows.length === 0) throw new Error("Het bestand bevat geen planten.");
      setFile({ name: f.name, rows });
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const run = async () => {
    if (!file) return;
    const total: Result = { created: 0, updated: 0, photos: 0, problems: [] };
    setError(null);
    try {
      for (let i = 0; i < file.rows.length; i += BATCH) {
        setProgress(i / file.rows.length);
        const r = await api<Result>("/api/import", { method: "POST", json: { rows: file.rows.slice(i, i + BATCH), offset: i } });
        total.created += r.created;
        total.updated += r.updated;
        total.photos += r.photos;
        total.problems.push(...r.problems);
      }
    } catch (e) {
      setError(`${errorMessage(e)} De rijen tot dit punt zijn wel verwerkt.`);
    }
    setProgress(null);
    setResult(total);
    onImported();
  };

  const columns = file ? Object.keys(file.rows[0]) : [];
  const running = progress !== null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!running) { if (!o) reset(); onOpenChange(o); } }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Planten importeren</DialogTitle>
          <DialogDescription>
            Een CSV- of JSON-bestand, zoals een Magento-productexport, een Channable-feed of een eerdere export uit
            deze gids. Bestaande planten (zelfde botanische naam) worden bijgewerkt. Foto-links worden opgehaald en
            bewaard.
          </DialogDescription>
        </DialogHeader>

        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-muted/50 px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-secondary/50 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50">
          <FileUp className="size-7 text-primary" />
          <span className="font-medium">{file ? file.name : "Kies een bestand"}</span>
          <span className="text-sm text-muted-foreground">
            {file ? `${file.rows.length} rijen · ${columns.length} kolommen` : ".csv of .json"}
          </span>
          <input type="file" accept=".csv,.json,.txt,text/csv,application/json" className="sr-only" disabled={running} onChange={(e) => choose(e.target.files?.[0])} />
        </label>

        {file && !result && (
          <p className="text-xs text-muted-foreground">
            Kolommen: {columns.slice(0, 12).join(", ")}
            {columns.length > 12 && ` en ${columns.length - 12} meer`}
          </p>
        )}

        {progress !== null && (
          <div className="space-y-1.5" role="status">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${Math.max(4, progress * 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">Bezig… {Math.round(progress * 100)}% (foto's ophalen kost even tijd)</p>
          </div>
        )}

        {result && (
          <div className="rounded-xl bg-secondary/70 p-4 text-sm">
            <p className="font-medium">
              {result.created} toegevoegd, {result.updated} bijgewerkt, {result.photos} foto's opgehaald.
            </p>
            {result.problems.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-muted-foreground">{result.problems.length} meldingen</summary>
                <ul className="mt-2 max-h-48 list-disc space-y-1 overflow-y-auto pl-5 text-xs">
                  {result.problems.slice(0, 200).map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}

        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <DialogFooter>
          {result ? (
            <Button onClick={() => { reset(); onOpenChange(false); }}>Klaar</Button>
          ) : (
            <Button onClick={run} disabled={!file || running}>
              {running ? "Importeren…" : file ? `${file.rows.length} planten importeren` : "Importeren"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
