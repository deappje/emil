import type { ReactElement, SVGProps } from "react";
import { Bird, Bug, Cloud, CloudSun, Sun, type LucideIcon } from "lucide-react";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

/** A bee, drawn to match lucide's 24px, 2px-stroke style. */
export function BeeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <ellipse cx="12" cy="14" rx="5" ry="6.5" />
      <path d="M7.4 12h9.2M7.2 15.5h9.6" />
      <path d="M10 7.8C8.6 4.6 5.2 4 3.8 5.6c-1.3 1.6.3 4.3 3.7 4.6M14 7.8c1.4-3.2 4.8-3.8 6.2-2.2 1.3 1.6-.3 4.3-3.7 4.6" />
      <path d="M12 20.5V22" />
    </svg>
  );
}

/** A butterfly in the same style. */
export function ButterflyIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 7v12" />
      <path d="M12 9C10 5.5 6.5 3.5 4.2 4.4 2 5.3 2.6 9.6 5.8 11.2 3.6 12.6 3.6 16.4 6 17.4c2.4 1 4.8-1.4 6-4.4" />
      <path d="M12 9c2-3.5 5.5-5.5 7.8-4.6 2.2.9 1.6 5.2-1.6 6.8 2.2 1.4 2.2 5.2-.2 6.2-2.4 1-4.8-1.4-6-4.4" />
      <path d="M10.5 4.5 12 7l1.5-2.5" />
    </svg>
  );
}

export const SUN_ICON: Record<string, LucideIcon> = { zon: Sun, halfschaduw: CloudSun, schaduw: Cloud };

export const WILDLIFE_ICON: Record<string, (p: IconProps) => ReactElement> = {
  bijen: BeeIcon,
  vlinders: ButterflyIcon,
  vogels: (p) => <Bird {...p} />,
  insecten: (p) => <Bug {...p} />,
};
