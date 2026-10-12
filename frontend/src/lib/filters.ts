import { fold } from "@/lib/utils";
import type { Option, Plant } from "@/lib/plants";

/** Every filter the catalogue offers. Within a group any value may match; all groups must. */
export type Filters = {
  q: string;
  type: string[];
  sun: string[];
  size: string[];
  flower: string[];
  leaf: string[];
  month: string[];
  life: string[];
  moisture: string[];
  wildlife: string[];
  props: string[];
};

export type Group = Exclude<keyof Filters, "q">;

export const GROUPS: Group[] = ["type", "sun", "size", "flower", "leaf", "month", "life", "moisture", "wildlife", "props"];

export const emptyFilters = (): Filters => ({
  q: "", type: [], sun: [], size: [], flower: [], leaf: [], month: [], life: [], moisture: [], wildlife: [], props: [],
});

export const SIZES: (Option & { min: number; max: number })[] = [
  { value: "laag", label: "Laag · tot 30 cm", min: 0, max: 30 },
  { value: "middel", label: "Middel · 30 cm – 1 m", min: 30, max: 100 },
  { value: "hoog", label: "Hoog · 1 – 3 m", min: 100, max: 300 },
  { value: "zeerhoog", label: "Zeer hoog · boven 3 m", min: 300, max: Infinity },
];

export const PROPS: Option[] = [
  { value: "inheems", label: "Inheems" },
  { value: "eco", label: "Ecologisch waardevol" },
  { value: "groenblijvend", label: "Groenblijvend" },
  { value: "winterhard", label: "Winterhard" },
  { value: "geurend", label: "Geurend" },
  { value: "eetbaar", label: "Eetbaar" },
  { value: "nietgiftig", label: "Niet giftig" },
];

const propTest: Record<string, (p: Plant) => boolean> = {
  inheems: (p) => p.native,
  eco: (p) => p.wildlife.length > 0,
  groenblijvend: (p) => p.evergreen,
  winterhard: (p) => p.hardy,
  geurend: (p) => p.fragrant,
  eetbaar: (p) => p.edible,
  nietgiftig: (p) => !p.toxic,
};

/** The values a plant has in each group, so one test serves filters and counts. */
function valuesOf(p: Plant, group: Group): string[] {
  switch (group) {
    case "type": return [p.type];
    case "sun": return p.sun;
    case "flower": return p.flowerColors;
    case "leaf": return p.leafColors;
    case "month": return p.bloomMonths.map(String);
    case "life": return [p.lifecycle];
    case "moisture": return p.moisture;
    case "wildlife": return p.wildlife;
    case "props": return PROPS.filter((o) => propTest[o.value](p)).map((o) => o.value);
    case "size": {
      const lo = p.heightMin ?? p.heightMax;
      const hi = p.heightMax ?? p.heightMin;
      if (lo == null || hi == null) return [];
      return SIZES.filter((s) => lo < s.max && hi >= s.min).map((s) => s.value);
    }
  }
}

function matchesGroup(p: Plant, group: Group, selected: string[]) {
  if (selected.length === 0) return true;
  const values = valuesOf(p, group);
  // Properties narrow down: every chosen property must hold.
  return group === "props" ? selected.every((v) => values.includes(v)) : selected.some((v) => values.includes(v));
}

function matchesQuery(p: Plant, words: string[]) {
  if (words.length === 0) return true;
  const text = fold(`${p.name} ${p.latinName} ${p.description}`);
  return words.every((w) => text.includes(w));
}

const queryWords = (q: string) => fold(q).split(/\s+/).filter(Boolean);

export function applyFilters(plants: Plant[], f: Filters, except?: Group) {
  const words = queryWords(f.q);
  return plants.filter(
    (p) => matchesQuery(p, words) && GROUPS.every((g) => g === except || matchesGroup(p, g, f[g])),
  );
}

/** For each option, how many plants it would show given all other active filters. */
export function facetCounts(plants: Plant[], f: Filters) {
  const counts = {} as Record<Group, Record<string, number>>;
  for (const g of GROUPS) {
    const pool = applyFilters(plants, f, g);
    const c: Record<string, number> = {};
    for (const p of pool) for (const v of valuesOf(p, g)) c[v] = (c[v] ?? 0) + 1;
    counts[g] = c;
  }
  return counts;
}

export const activeCount = (f: Filters) => GROUPS.reduce((n, g) => n + f[g].length, 0) + (f.q ? 1 : 0);

export type Sort = "naam" | "latijn" | "laag" | "hoog" | "bloei" | "recent";

export const SORTS: { value: Sort; label: string }[] = [
  { value: "naam", label: "Naam (A–Z)" },
  { value: "latijn", label: "Botanische naam" },
  { value: "laag", label: "Laagste eerst" },
  { value: "hoog", label: "Hoogste eerst" },
  { value: "bloei", label: "Vroegste bloei" },
  { value: "recent", label: "Laatst bijgewerkt" },
];

const collator = new Intl.Collator("nl", { sensitivity: "base" });

export function sortPlants(plants: Plant[], sort: Sort) {
  const height = (p: Plant) => p.heightMax ?? p.heightMin;
  const list = [...plants];
  const byName = (a: Plant, b: Plant) => collator.compare(a.name, b.name);
  const nullsLast = (a: number | null, b: number | null, dir: 1 | -1) =>
    a == null ? (b == null ? 0 : 1) : b == null ? -1 : (a - b) * dir;
  switch (sort) {
    case "latijn": return list.sort((a, b) => collator.compare(a.latinName || a.name, b.latinName || b.name));
    case "laag": return list.sort((a, b) => nullsLast(height(a), height(b), 1) || byName(a, b));
    case "hoog": return list.sort((a, b) => nullsLast(height(a), height(b), -1) || byName(a, b));
    case "bloei": return list.sort((a, b) => nullsLast(a.bloomMonths[0] ?? null, b.bloomMonths[0] ?? null, 1) || byName(a, b));
    case "recent": return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    default: return list.sort(byName);
  }
}

/** Filters, sort and open plant live in the address, so a view can be bookmarked or shared. */
export function readUrl() {
  const params = new URLSearchParams(window.location.search);
  const f = emptyFilters();
  f.q = params.get("q") ?? "";
  for (const g of GROUPS) f[g] = (params.get(g) ?? "").split(",").filter(Boolean);
  const sort = (SORTS.find((s) => s.value === params.get("sort"))?.value ?? "naam") as Sort;
  const plant = Number(params.get("plant")) || null;
  return { filters: f, sort, plant };
}

export function writeUrl(f: Filters, sort: Sort, plant: number | null) {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  for (const g of GROUPS) if (f[g].length) params.set(g, f[g].join(","));
  if (sort !== "naam") params.set("sort", sort);
  if (plant) params.set("plant", String(plant));
  const qs = params.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
  if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", url);
}
