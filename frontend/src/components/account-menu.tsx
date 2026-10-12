import { Download, FileUp, KeyRound, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@/lib/session";

export type AccountAction = "password" | "users" | "import" | "logout";

export function AccountMenu({ user, onAction }: { user: User; onAction: (a: AccountAction) => void }) {
  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 font-semibold" aria-label={`Account van ${user.name}`}>
          {initials || "?"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <p className="font-medium">{user.name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
          <p className="mt-1 text-xs font-normal text-primary">{user.role === "admin" ? "Beheerder" : "Redacteur"}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === "admin" && (
          <>
            <DropdownMenuItem onSelect={() => onAction("users")}>
              <Users /> Gebruikers beheren
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction("import")}>
              <FileUp /> Planten importeren
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem asChild>
          <a href="/api/export.csv" download>
            <Download /> Exporteren als CSV
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction("password")}>
          <KeyRound /> Wachtwoord wijzigen
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onAction("logout")}>
          <LogOut /> Uitloggen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
