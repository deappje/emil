import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChipGroup } from "@/components/chip-group";
import { Field } from "@/components/field";
import { SUN_ICON, WILDLIFE_ICON } from "@/components/icons";
import {
  FLOWER_COLORS, LEAF_COLORS, LIFECYCLES, MOISTURE, MONTHS, MONTH_NAMES, PLANT_TYPES, SUN, SWATCH, WILDLIFE, type PlantInput,
} from "@/lib/plants";
import { cn } from "@/lib/utils";

type Props = {
  value: PlantInput;
  onChange: (v: PlantInput) => void;
  errors: Partial<Record<keyof PlantInput, string>>;
};

const swatch = (c: string) => <span className={cn("size-3.5 rounded-full border border-foreground/15", SWATCH[c])} />;
const cm = (v: number | null) => (v == null ? "" : String(v));
const num = (s: string) => (s.trim() === "" ? null : Math.max(0, Math.round(Number(s))));

/** Every editable property of a plant, grouped as on the detail view. */
export function PlantFormFields({ value: v, onChange, errors }: Props) {
  const set = <K extends keyof PlantInput>(k: K) => (x: PlantInput[K]) => onChange({ ...v, [k]: x });
  return (
    <div className="space-y-7">
      <Section title="Naam en soort">
        <Field label="Nederlandse naam" name="name" value={v.name} onChange={set("name")} error={errors.name} required />
        <Field label="Botanische naam" value={v.latinName} onChange={set("latinName")} placeholder="Bijv. Lythrum salicaria" hint="Hiermee herkent de import een plant." />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5">Soort plant</Label>
            <Select value={v.type} onValueChange={set("type")}>
              <SelectTrigger aria-label="Soort plant"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLANT_TYPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5">Levensduur</Label>
            <Select value={v.lifecycle} onValueChange={set("lifecycle")}>
              <SelectTrigger aria-label="Levensduur"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LIFECYCLES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      <Section title="Standplaats en grond">
        <ChipGroup label="Standplaats" options={SUN} value={v.sun} onChange={set("sun")} icon={(s) => { const I = SUN_ICON[s]; return <I />; }} />
        <ChipGroup label="Vochtigheid" options={MOISTURE} value={v.moisture} onChange={set("moisture")} />
      </Section>

      <Section title="Afmetingen">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Hoogte vanaf" type="number" inputMode="numeric" min={0} suffix="cm" value={cm(v.heightMin)} onChange={(s) => set("heightMin")(num(s))} />
          <Field label="tot" type="number" inputMode="numeric" min={0} suffix="cm" value={cm(v.heightMax)} onChange={(s) => set("heightMax")(num(s))} />
          <Field label="Breedte" type="number" inputMode="numeric" min={0} suffix="cm" value={cm(v.width)} onChange={(s) => set("width")(num(s))} />
        </div>
      </Section>

      <Section title="Kleur en bloei">
        <Sub label="Bloeikleur"><ChipGroup label="Bloeikleur" options={FLOWER_COLORS} value={v.flowerColors} onChange={set("flowerColors")} icon={swatch} /></Sub>
        <Sub label="Bladkleur"><ChipGroup label="Bladkleur" options={LEAF_COLORS} value={v.leafColors} onChange={set("leafColors")} icon={swatch} /></Sub>
        <Sub label="Bloeimaanden">
          <ToggleGroup type="multiple" variant="cell" value={v.bloomMonths.map(String)} onValueChange={(m) => set("bloomMonths")(m.map(Number))} aria-label="Bloeimaanden">
            {MONTHS.map((m, i) => <ToggleGroupItem key={m} value={String(i + 1)} aria-label={MONTH_NAMES[i]}>{m}</ToggleGroupItem>)}
          </ToggleGroup>
        </Sub>
      </Section>

      <Section title="Ecologie">
        <Toggle label="Inheems in Nederland" checked={v.native} onChange={set("native")} />
        <Sub label="Waardevol voor">
          <ChipGroup label="Waardevol voor" options={WILDLIFE} value={v.wildlife} onChange={set("wildlife")} icon={(w) => { const I = WILDLIFE_ICON[w]; return <I className="size-4" />; }} />
        </Sub>
      </Section>

      <Section title="Eigenschappen">
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle label="Groenblijvend" checked={v.evergreen} onChange={set("evergreen")} />
          <Toggle label="Winterhard" checked={v.hardy} onChange={set("hardy")} />
          <Toggle label="Geurend" checked={v.fragrant} onChange={set("fragrant")} />
          <Toggle label="Eetbaar" checked={v.edible} onChange={set("edible")} />
          <Toggle label="Giftig" checked={v.toxic} onChange={set("toxic")} />
        </div>
      </Section>

      <Section title="Beschrijving">
        <Textarea value={v.description} onChange={(e) => set("description")(e.target.value)} rows={5} aria-label="Beschrijving" placeholder="Waar staat hij het mooist, waar moet je op letten?" />
        <Field label="Bronlink" type="url" value={v.sourceUrl} onChange={set("sourceUrl")} error={errors.sourceUrl} placeholder="https://www.directplant.nl/…" />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 font-display text-lg font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function Sub({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <Label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border bg-card px-3.5 py-2 font-normal">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </Label>
  );
}
