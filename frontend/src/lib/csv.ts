export type Row = Record<string, string>;

/**
 * Reads an import file: a JSON array of objects, or CSV with a header row.
 * The CSV delimiter (comma, semicolon or tab) is taken from the header line.
 */
export function parseImportFile(text: string): Row[] {
  const trimmed = text.replace(/^﻿/, "").trim();
  if (trimmed.startsWith("[")) {
    const data: unknown = JSON.parse(trimmed);
    if (!Array.isArray(data)) throw new Error("Het JSON-bestand moet een lijst met planten bevatten.");
    return data.map((item) =>
      Object.fromEntries(
        Object.entries(item as Record<string, unknown>).map(([k, v]) => [k, Array.isArray(v) ? v.join("|") : String(v ?? "")]),
      ),
    );
  }
  const header = trimmed.slice(0, trimmed.indexOf("\n") >>> 0);
  const delimiter = [";", "\t", ","].reduce((best, d) => (count(header, d) > count(header, best) ? d : best), ",");
  const [head, ...rows] = parseCsv(trimmed, delimiter);
  if (!head || head.length < 2) throw new Error("Geen kolomkoppen gevonden in de eerste regel.");
  return rows
    .filter((r) => r.some((cell) => cell.trim() !== ""))
    .map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), r[i] ?? ""])));
}

const count = (s: string, ch: string) => s.split(ch).length - 1;

/** RFC 4180: quoted fields may hold delimiters, newlines and doubled quotes. */
function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  row.push(field);
  rows.push(row);
  return rows;
}
