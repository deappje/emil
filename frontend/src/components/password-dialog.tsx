import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/utils";

export function PasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/password", { method: "POST", json: { current, new: next } });
      setDone(true);
      setCurrent("");
      setNext("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const change = (o: boolean) => {
    if (!o) setDone(false);
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>Wachtwoord wijzigen</DialogTitle>
            <DialogDescription>Kies een nieuw wachtwoord van minstens 8 tekens.</DialogDescription>
          </DialogHeader>
          <Field label="Huidig wachtwoord" type="password" value={current} onChange={setCurrent} autoComplete="current-password" required />
          <Field label="Nieuw wachtwoord" type="password" value={next} onChange={setNext} autoComplete="new-password" minLength={8} required />
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          {done && <p className="rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">Je wachtwoord is gewijzigd.</p>}
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? "Opslaan…" : "Wachtwoord opslaan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
