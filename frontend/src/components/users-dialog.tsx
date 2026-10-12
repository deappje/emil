import { useEffect, useState, type FormEvent } from "react";
import { Trash, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/field";
import { api } from "@/lib/api";
import { useSession, type User } from "@/lib/session";
import { errorMessage } from "@/lib/utils";

type Row = User & { createdAt: string };

/** Administrators add accounts with a starting password and remove them. */
export function UsersDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { user: me } = useSession();
  const [users, setUsers] = useState<Row[] | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "editor" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setUsers(null);
    api<Row[]>("/api/users").then(setUsers, (e) => setError(errorMessage(e)));
  }, [open]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const u = await api<Row>("/api/users", { method: "POST", json: form });
      setUsers((list) => [...(list ?? []), u]);
      setForm({ name: "", email: "", password: "", role: "editor" });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    setError(null);
    try {
      await api(`/api/users/${id}`, { method: "DELETE" });
      setUsers((list) => (list ?? []).filter((u) => u.id !== id));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gebruikers</DialogTitle>
          <DialogDescription>
            Redacteuren mogen planten toevoegen en bewerken. Beheerders kunnen ook gebruikers beheren en importeren.
          </DialogDescription>
        </DialogHeader>

        <ul className="divide-y rounded-xl border">
          {users === null
            ? Array.from({ length: 2 }, (_, i) => (
                <li key={i} className="p-3">
                  <Skeleton className="h-5 w-1/2" />
                </li>
              ))
            : users.map((u) => (
                <li key={u.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{u.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                  </div>
                  <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role === "admin" ? "Beheerder" : "Redacteur"}</Badge>
                  {u.id !== me?.id && (
                    <Button variant="ghost" size="icon-sm" onClick={() => remove(u.id)} aria-label={`${u.name} verwijderen`}>
                      <Trash />
                    </Button>
                  )}
                </li>
              ))}
        </ul>

        <form onSubmit={add} className="grid gap-4 rounded-xl bg-muted/60 p-4 sm:grid-cols-2">
          <p className="font-medium sm:col-span-2">Gebruiker toevoegen</p>
          <Field label="Naam" value={form.name} onChange={(name) => setForm({ ...form, name })} required />
          <Field label="E-mailadres" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} required />
          <Field
            label="Startwachtwoord"
            value={form.password}
            onChange={(password) => setForm({ ...form, password })}
            hint="Geef dit door; de gebruiker kan het daarna zelf wijzigen."
            minLength={8}
            required
          />
          <div>
            <Label className="mb-1.5">Rol</Label>
            <Select value={form.role} onValueChange={(role) => setForm({ ...form, role })}>
              <SelectTrigger aria-label="Rol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Redacteur</SelectItem>
                <SelectItem value="admin">Beheerder</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
          <Button type="submit" disabled={busy} className="sm:col-span-2 sm:justify-self-end">
            <UserPlus /> {busy ? "Toevoegen…" : "Toevoegen"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
