import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Lowercase without accents, for forgiving search ("creme" finds "crème"). */
export function fold(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : "Er ging iets mis.";
}
