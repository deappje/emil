import { useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/field";
import { useSession } from "@/lib/session";
import { errorMessage } from "@/lib/utils";

/** Sign in, or, while no account exists yet, create the first (administrator) account. */
export function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { needsSetup, login, setup } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (needsSetup) await setup(name, email, password);
      else await login(email, password);
      setPassword("");
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{needsSetup ? "Beheerder instellen" : "Inloggen"}</DialogTitle>
            <DialogDescription>
              {needsSetup
                ? "Er is nog geen account. Het account dat je nu maakt wordt beheerder en kan daarna anderen toevoegen."
                : "Log in om planten toe te voegen, te categoriseren en foto's te uploaden."}
            </DialogDescription>
          </DialogHeader>
          {needsSetup && (
            <Field label="Naam" value={name} onChange={setName} autoComplete="name" required />
          )}
          <Field label="E-mailadres" type="email" value={email} onChange={setEmail} autoComplete="email" required />
          <Field
            label="Wachtwoord"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete={needsSetup ? "new-password" : "current-password"}
            hint={needsSetup ? "Minstens 8 tekens." : undefined}
            minLength={needsSetup ? 8 : undefined}
            required
          />
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={busy} className="sm:min-w-32">
              {busy ? "Even geduld…" : needsSetup ? "Account maken" : "Inloggen"}
            </Button>
          </DialogFooter>
          {!needsSetup && (
            <p className="text-center text-xs text-muted-foreground">
              Nog geen account? Vraag een beheerder om je toe te voegen.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
