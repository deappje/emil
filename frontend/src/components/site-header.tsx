import { LogIn, Moon, Search, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AccountMenu, type AccountAction } from "@/components/account-menu";
import { useSession } from "@/lib/session";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  query: string;
  onQuery: (q: string) => void;
  onSignIn: () => void;
  onAction: (a: AccountAction) => void;
};

export function SiteHeader({ query, onQuery, onSignIn, onAction }: Props) {
  const { user, loading } = useSession();
  const { dark, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-3 px-4 sm:px-6">
        <a href="/" className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
          <Logo />
          <span className="hidden font-display text-xl font-semibold tracking-tight min-[420px]:inline">Plantengids</span>
        </a>
        <div className="relative mx-auto w-full max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Zoek op naam, soort of beschrijving"
            aria-label="Zoeken"
            className="rounded-full pr-10 pl-10 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQuery("")}
              className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
              aria-label="Zoekopdracht wissen"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label={dark ? "Licht thema" : "Donker thema"}>
          {dark ? <Sun /> : <Moon />}
        </Button>
        {!loading &&
          (user ? (
            <AccountMenu user={user} onAction={onAction} />
          ) : (
            <Button variant="outline" onClick={onSignIn} className="shrink-0" aria-label="Inloggen">
              <LogIn />
              <span className="hidden sm:inline">Inloggen</span>
            </Button>
          ))}
      </div>
    </header>
  );
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-9 shrink-0" aria-hidden="true">
      <rect width="32" height="32" rx="10" className="fill-primary" />
      <path
        d="M9 23c0-8 5-13 14-14-1 9-6 14-14 14Zm0 0 7-7"
        fill="none"
        className="stroke-primary-foreground"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
