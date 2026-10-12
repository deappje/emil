/** A plant as the API returns it. Lengths are centimetres. */
export type Plant = {
  id: number;
  name: string;
  latinName: string;
  type: string;
  lifecycle: string;
  sun: string[];
  heightMin: number | null;
  heightMax: number | null;
  width: number | null;
  flowerColors: string[];
  leafColors: string[];
  bloomMonths: number[];
  native: boolean;
  wildlife: string[];
  evergreen: boolean;
  hardy: boolean;
  moisture: string[];
  toxic: boolean;
  fragrant: boolean;
  edible: boolean;
  description: string;
  photoUrl: string;
  photoCredit: string;
  sourceUrl: string;
  updatedAt: string;
  updatedBy: string;
};

export type PlantInput = Omit<Plant, "id" | "photoUrl" | "updatedAt" | "updatedBy">;

export type Option = { value: string; label: string };

// The allowed values, mirrored from the server (backend/plant.go).
export const PLANT_TYPES: Option[] = [
  { value: "vaste-plant", label: "Vaste plant" },
  { value: "heester", label: "Heester" },
  { value: "boom", label: "Boom" },
  { value: "haagplant", label: "Haagplant" },
  { value: "klimplant", label: "Klimplant" },
  { value: "bloembol", label: "Bloembol" },
  { value: "eenjarige", label: "Een- of tweejarige" },
  { value: "siergras", label: "Siergras" },
  { value: "varen", label: "Varen" },
  { value: "conifeer", label: "Conifeer" },
  { value: "roos", label: "Roos" },
  { value: "kruid", label: "Kruid" },
  { value: "fruit", label: "Fruit" },
  { value: "waterplant", label: "Waterplant" },
];

export const LIFECYCLES: Option[] = [
  { value: "meerjarig", label: "Meerjarig (vast)" },
  { value: "tweejarig", label: "Tweejarig" },
  { value: "eenjarig", label: "Eenjarig" },
];

export const SUN: Option[] = [
  { value: "zon", label: "Zon" },
  { value: "halfschaduw", label: "Halfschaduw" },
  { value: "schaduw", label: "Schaduw" },
];

export const FLOWER_COLORS: Option[] = [
  { value: "wit", label: "Wit" },
  { value: "geel", label: "Geel" },
  { value: "oranje", label: "Oranje" },
  { value: "rood", label: "Rood" },
  { value: "roze", label: "Roze" },
  { value: "paars", label: "Paars" },
  { value: "blauw", label: "Blauw" },
  { value: "groen", label: "Groen" },
];

export const LEAF_COLORS: Option[] = [
  { value: "groen", label: "Groen" },
  { value: "geel", label: "Geel" },
  { value: "rood", label: "Rood" },
  { value: "paars", label: "Paars" },
  { value: "grijs", label: "Zilvergrijs" },
  { value: "blauw", label: "Blauwgroen" },
  { value: "bont", label: "Bont" },
];

export const WILDLIFE: Option[] = [
  { value: "bijen", label: "Bijen & hommels" },
  { value: "vlinders", label: "Vlinders" },
  { value: "vogels", label: "Vogels" },
  { value: "insecten", label: "Overige insecten" },
];

export const MOISTURE: Option[] = [
  { value: "droog", label: "Droog" },
  { value: "normaal", label: "Normaal" },
  { value: "vochtig", label: "Vochtig" },
  { value: "nat", label: "Nat" },
];

export const MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
export const MONTH_NAMES = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

/** Swatch classes, written out in full so Tailwind generates them. */
export const SWATCH: Record<string, string> = {
  wit: "bg-swatch-wit",
  geel: "bg-swatch-geel",
  oranje: "bg-swatch-oranje",
  rood: "bg-swatch-rood",
  roze: "bg-swatch-roze",
  paars: "bg-swatch-paars",
  blauw: "bg-swatch-blauw",
  groen: "bg-swatch-groen",
  grijs: "bg-swatch-grijs",
  bont: "swatch-bont",
};

/** The same colours as SVG fills. */
export const FILL: Record<string, string> = {
  wit: "fill-swatch-wit",
  geel: "fill-swatch-geel",
  oranje: "fill-swatch-oranje",
  rood: "fill-swatch-rood",
  roze: "fill-swatch-roze",
  paars: "fill-swatch-paars",
  blauw: "fill-swatch-blauw",
  groen: "fill-swatch-groen",
  grijs: "fill-swatch-grijs",
  bont: "fill-swatch-groen",
};

export function labelOf(options: Option[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}

/** "30–60 cm", "1,5 m" or "" when unknown. */
export function formatHeight(min: number | null, max: number | null) {
  const lo = min ?? max;
  const hi = max ?? min;
  if (lo == null || hi == null) return "";
  const useMeters = hi >= 200;
  const fmt = (cm: number) => (useMeters ? (cm / 100).toLocaleString("nl-NL", { maximumFractionDigits: 1 }) : String(cm));
  const unit = useMeters ? "m" : "cm";
  return lo === hi ? `${fmt(hi)} ${unit}` : `${fmt(lo)}–${fmt(hi)} ${unit}`;
}

/** "juni – september", or the months listed when they are not one run. */
export function formatMonths(months: number[]) {
  if (months.length === 0) return "";
  const sorted = [...months].sort((a, b) => a - b);
  // A run may wrap the year end, as in november – maart.
  const start = sorted.find((m) => !sorted.includes(m === 1 ? 12 : m - 1)) ?? sorted[0];
  const run: number[] = [];
  for (let m = start; run.length < 12 && sorted.includes(m); m = (m % 12) + 1) run.push(m);
  if (run.length !== sorted.length) return sorted.map((m) => MONTHS[m - 1]).join(", ");
  const [first, last] = [run[0], run[run.length - 1]];
  return first === last ? MONTH_NAMES[first - 1] : `${MONTH_NAMES[first - 1]} – ${MONTH_NAMES[last - 1]}`;
}

export function emptyPlant(): PlantInput {
  return {
    name: "", latinName: "", type: "vaste-plant", lifecycle: "meerjarig", sun: [],
    heightMin: null, heightMax: null, width: null, flowerColors: [], leafColors: ["groen"],
    bloomMonths: [], native: false, wildlife: [], evergreen: false, hardy: true, moisture: [],
    toxic: false, fragrant: false, edible: false, description: "", photoCredit: "", sourceUrl: "",
  };
}
