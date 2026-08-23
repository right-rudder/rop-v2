/**
 * Downloads the "FSF - Seed Data" Google Sheet and writes the two master tabs
 * to data/catalog/*.csv.
 *
 * Run:  npm run seed:fetch
 *
 * The sheet must be shared as "Anyone with the link: Viewer" — the export
 * endpoint is unauthenticated. Override the document with SHEET_ID=... if the
 * source ever moves.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { readXlsxSheet, listXlsxSheets } from "./xlsx.ts";
import { toCsv } from "./csv.ts";
import { DATA_DIR, SCHOOLS_CSV, AIRPORTS_CSV, STATES_CSV } from "./paths.ts";

const SHEET_ID = process.env.SHEET_ID ?? "1RC-gggtpcMhqHt4GxlyCaaP_8N7HxDuaGj2EWSJqNyo";

/** Tab name -> output file. These three are the only tabs the pipeline reads. */
const TABS: [string, string][] = [
  ["COMPILED SCHOOLS", SCHOOLS_CSV],
  ["COMPILED AIRPORTS", AIRPORTS_CSV],
  ["States", STATES_CSV],
];

/**
 * Header cells the sheet leaves blank (or duplicates). Naming them keeps the
 * CSV self-describing and stops parseCsvRecords from dropping the column.
 */
function normalizeHeader(header: string[]): string[] {
  const seen = new Set<string>();
  return header.map((h, i) => {
    const base = h.trim() === "" ? `column_${i}` : h.trim();
    if (!seen.has(base)) {
      seen.add(base);
      return base;
    }
    let n = 2;
    while (seen.has(`${base}_${n}`)) n++;
    seen.add(`${base}_${n}`);
    return `${base}_${n}`;
  });
}

/** Sheets renders integers as "84.0"; the sheet has no genuine decimal columns. */
function tidy(value: string): string {
  return /^-?\d+\.0$/.test(value) ? value.slice(0, -2) : value;
}

async function main(): Promise<void> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;
  process.stdout.write(`Fetching ${url}\n`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Download failed (HTTP ${res.status}). Is the sheet shared as "Anyone with the link: Viewer"?`,
    );
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("spreadsheetml")) {
    throw new Error(`Expected an xlsx, got "${type}" — the sheet is probably not link-viewable.`);
  }
  process.stdout.write(`Downloaded ${(buf.length / 1e6).toFixed(1)} MB\n`);
  process.stdout.write(`Tabs: ${listXlsxSheets(buf).join(", ")}\n`);

  for (const [tab, file] of TABS) {
    const rows = readXlsxSheet(buf, tab);
    if (rows.length < 2) throw new Error(`Tab "${tab}" is empty`);
    const header = normalizeHeader(rows[0]);
    // Drop trailing all-blank rows Sheets pads the grid with.
    const body = rows.slice(1).filter((r) => r.some((c) => c !== ""));
    const records = body.map((cells) => {
      const rec: Record<string, string> = {};
      header.forEach((key, i) => {
        rec[key] = tidy(cells[i] ?? "");
      });
      return rec;
    });
    const out = join(DATA_DIR, file);
    writeFileSync(out, toCsv(header, records));
    process.stdout.write(`  ${tab} -> ${file} (${records.length} rows, ${header.length} cols)\n`);
  }
}

await main();
