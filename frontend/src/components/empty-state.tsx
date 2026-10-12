import type { ReactNode } from "react";
import { Sprout } from "lucide-react";

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed bg-card/50 px-6 py-16 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-secondary text-primary">
        <Sprout className="size-7" />
      </div>
      <h2 className="mt-4 font-display text-2xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-muted-foreground">{children}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
