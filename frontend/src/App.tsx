import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SiteHeader } from "@/components/site-header";
import { Intro } from "@/components/intro";
import { FilterPanel } from "@/components/filter-panel";
import { Toolbar } from "@/components/toolbar";
import { ActiveFilters } from "@/components/active-filters";
import { PlantGrid, PlantGridSkeleton } from "@/components/plant-grid";
import { EmptyState } from "@/components/empty-state";
import { PlantDetail } from "@/components/plant-detail";
import { PlantForm } from "@/components/plant-form";
import { AuthDialog } from "@/components/auth-dialog";
import { PasswordDialog } from "@/components/password-dialog";
import { UsersDialog } from "@/components/users-dialog";
import { ImportDialog } from "@/components/import-dialog";
import type { AccountAction } from "@/components/account-menu";
import { usePlants } from "@/hooks/use-plants";
import { activeCount, applyFilters, emptyFilters, facetCounts, readUrl, sortPlants, writeUrl, type Filters } from "@/lib/filters";
import type { Plant } from "@/lib/plants";
import { useSession } from "@/lib/session";

type DialogName = Exclude<AccountAction, "logout"> | "auth";

export function App() {
  const session = useSession();
  const { plants, error, reload, upsert, remove } = usePlants();
  const [initial] = useState(readUrl);
  const [filters, setFilters] = useState<Filters>(initial.filters);
  const [sort, setSort] = useState(initial.sort);
  const [openId, setOpenId] = useState<number | null>(initial.plant);
  const [editing, setEditing] = useState<Plant | "new" | null>(null);
  const [dialog, setDialog] = useState<DialogName | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const deferred = useDeferredValue(filters);

  useEffect(() => writeUrl(filters, sort, openId), [filters, sort, openId]);

  const visible = useMemo(() => (plants ? sortPlants(applyFilters(plants, deferred), sort) : []), [plants, deferred, sort]);
  const counts = useMemo(() => facetCounts(plants ?? [], deferred), [plants, deferred]);
  const openPlant = plants?.find((p) => p.id === openId) ?? null;
  const canEdit = session.user !== null;

  const onAction = (a: AccountAction) => (a === "logout" ? void session.logout() : setDialog(a));
  const panel = (heading: boolean) => <FilterPanel filters={filters} counts={counts} onChange={setFilters} showHeading={heading} />;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader query={filters.q} onQuery={(q) => setFilters({ ...filters, q })} onSignIn={() => setDialog("auth")} onAction={onAction} />
      {session.needsSetup && !session.user && (
        <div className="border-b bg-accent text-accent-foreground">
          <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 text-sm sm:px-6">
            <p>Welkom! Er is nog geen beheerder. Maak het eerste account aan om planten te kunnen beheren.</p>
            <Button size="sm" onClick={() => setDialog("auth")}>Beheerder instellen</Button>
          </div>
        </div>
      )}
      <Intro plants={plants} onQuick={(patch) => setFilters({ ...emptyFilters(), ...patch })} />

      <main className="mx-auto w-full max-w-[90rem] flex-1 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-3 pb-6">{panel(true)}</div>
        </aside>
        <div className="min-w-0 space-y-4">
          <Toolbar
            total={plants?.length ?? 0}
            shown={visible.length}
            sort={sort}
            onSort={setSort}
            activeFilters={activeCount({ ...filters, q: "" })}
            onOpenFilters={() => setFiltersOpen(true)}
            onAdd={canEdit ? () => setEditing("new") : undefined}
          />
          <ActiveFilters filters={filters} onChange={setFilters} />
          {error ? (
            <EmptyState title="Planten konden niet worden geladen" action={<Button onClick={reload}>Opnieuw proberen</Button>}>
              {error}
            </EmptyState>
          ) : plants === null ? (
            <PlantGridSkeleton />
          ) : plants.length === 0 ? (
            <EmptyState
              title="Nog geen planten"
              action={canEdit ? <Button onClick={() => setEditing("new")}>Eerste plant toevoegen</Button> : <Button onClick={() => setDialog("auth")}>Inloggen</Button>}
            >
              Voeg planten één voor één toe, of importeer een export uit de webshop.
            </EmptyState>
          ) : visible.length === 0 ? (
            <EmptyState title="Geen planten gevonden" action={<Button variant="outline" onClick={() => setFilters(emptyFilters())}>Alle filters wissen</Button>}>
              Geen enkele plant voldoet aan al deze filters tegelijk. Haal er een paar weg of zoek op een andere naam.
            </EmptyState>
          ) : (
            <PlantGrid plants={visible} onOpen={setOpenId} />
          )}
        </div>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-[90rem] flex-wrap justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:px-6">
          <p>Plantengids · tuinplanten op standplaats, kleur en ecologische waarde</p>
          <p>Foto's van de startset via Wikimedia Commons; de maker en licentie staan bij elke foto.</p>
        </div>
      </footer>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 pt-2">{panel(false)}</div>
          <SheetFooter>
            <Button className="w-full" onClick={() => setFiltersOpen(false)}>
              Toon {visible.length} planten
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <PlantDetail
        plant={openPlant}
        canEdit={canEdit}
        onClose={() => setOpenId(null)}
        onEdit={(p) => {
          setOpenId(null);
          setEditing(p);
        }}
        onDeleted={(id) => {
          remove(id);
          setOpenId(null);
        }}
      />
      <PlantForm
        plant={editing}
        onClose={() => setEditing(null)}
        onStored={upsert}
        onSaved={(p) => {
          setEditing(null);
          setOpenId(p.id);
        }}
      />
      <AuthDialog open={dialog === "auth"} onOpenChange={(o) => setDialog(o ? "auth" : null)} />
      <PasswordDialog open={dialog === "password"} onOpenChange={(o) => setDialog(o ? "password" : null)} />
      <UsersDialog open={dialog === "users"} onOpenChange={(o) => setDialog(o ? "users" : null)} />
      <ImportDialog open={dialog === "import"} onOpenChange={(o) => setDialog(o ? "import" : null)} onImported={reload} />
    </div>
  );
}
