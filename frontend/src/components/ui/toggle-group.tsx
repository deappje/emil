import * as React from "react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // A filter chip: outlined, filled with the primary colour when on.
        chip: "h-9 rounded-full border border-border bg-card px-3 text-foreground/85 hover:border-primary/50 hover:text-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
        // A cell in a segmented row, such as the twelve months.
        cell: "h-9 min-w-0 flex-1 rounded-md bg-muted px-0 text-xs text-muted-foreground hover:bg-secondary hover:text-secondary-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
      },
    },
    defaultVariants: { variant: "chip" },
  },
);

type ToggleVariant = VariantProps<typeof toggleVariants>["variant"];
const ToggleGroupContext = React.createContext<ToggleVariant>("chip");

function ToggleGroup({
  className,
  variant,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> & { variant?: ToggleVariant }) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn("flex flex-wrap gap-1.5", variant === "cell" && "flex-nowrap gap-1", className)}
      {...props}
    >
      <ToggleGroupContext.Provider value={variant}>{children}</ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

function ToggleGroupItem({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  const variant = React.useContext(ToggleGroupContext);
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(toggleVariants({ variant }), className)}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem, toggleVariants };
