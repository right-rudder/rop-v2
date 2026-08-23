/**
 * Minimal .xlsx reader: enough to pull named worksheets out of a Google Sheets
 * export as rows of strings. An .xlsx is a ZIP of XML parts, so this is a tiny
 * ZIP central-directory reader plus zlib, avoiding a dependency for a file we
 * read a handful of times a year.
 *
 * Supported: shared strings, inline strings, numeric/boolean cells, sheet
 * name -> part mapping. Not supported (and not needed here): styles, dates as
 * serial numbers, formulas (the cached <v> value is used).
 */
import { inflateRawSync } from "node:zlib";

type ZipEntry = { name: string; offset: number; method: number; size: number };

function readZipEntries(buf: Buffer): Map<string, ZipEntry> {
  // Find the End Of Central Directory record, scanning back over the comment.
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 0xffff; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a zip file: no end-of-central-directory record");

  let count = buf.readUInt16LE(eocd + 10);
  let dirOffset = buf.readUInt32LE(eocd + 16);

  // ZIP64: the 32-bit fields saturate on large archives (our xlsx is ~15 MB but
  // Sheets can emit zip64 anyway).
  if (dirOffset === 0xffffffff || count === 0xffff) {
    const locator = eocd - 20;
    if (locator >= 0 && buf.readUInt32LE(locator) === 0x07064b50) {
      const z64 = Number(buf.readBigUInt64LE(locator + 8));
      if (buf.readUInt32LE(z64) === 0x06064b50) {
        count = Number(buf.readBigUInt64LE(z64 + 32));
        dirOffset = Number(buf.readBigUInt64LE(z64 + 48));
      }
    }
  }

  const entries = new Map<string, ZipEntry>();
  let p = dirOffset;
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const offset = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    entries.set(name, { name, offset, method, size });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function readEntry(buf: Buffer, entry: ZipEntry): string {
  // Local file header: name/extra lengths differ from the central directory's.
  const h = entry.offset;
  if (buf.readUInt32LE(h) !== 0x04034b50) throw new Error(`Bad local header for ${entry.name}`);
  const nameLen = buf.readUInt16LE(h + 26);
  const extraLen = buf.readUInt16LE(h + 28);
  const start = h + 30 + nameLen + extraLen;
  const compressed = buf.subarray(start, start + (entry.method === 0 ? entry.size : buf.length));
  if (entry.method === 0) return compressed.toString("utf8");
  return inflateRawSync(compressed).toString("utf8");
}

const ENTITIES: Record<string, string> = {
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&amp;": "&",
};

function decodeXml(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;|&gt;|&quot;|&apos;|&amp;/g, (m) => ENTITIES[m]);
}

/** Excel column reference ("AB") -> zero-based index. */
export function columnIndex(ref: string): number {
  let n = 0;
  for (const ch of ref.replace(/[^A-Z]/g, "")) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function readSharedStrings(xml: string): string[] {
  const out: string[] = [];
  for (const si of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    // A shared string can be split across several <t> runs (rich text).
    let text = "";
    for (const t of si[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) text += t[1];
    out.push(decodeXml(text));
  }
  return out;
}

function readSheet(xml: string, shared: string[]): string[][] {
  const rows: string[][] = [];
  for (const rowMatch of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];
    const cellRe = /<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    for (let c = cellRe.exec(rowMatch[1]); c !== null; c = cellRe.exec(rowMatch[1])) {
      const idx = columnIndex(c[1]);
      const attrs = c[2] ?? "";
      const body = c[3] ?? "";
      const v = /<v>([\s\S]*?)<\/v>/.exec(body);
      let value = "";
      if (/t="s"/.test(attrs) && v) value = shared[Number(v[1])] ?? "";
      else if (/t="inlineStr"/.test(attrs)) {
        const t = /<t[^>]*>([\s\S]*?)<\/t>/.exec(body);
        value = t ? decodeXml(t[1]) : "";
      } else if (v) value = decodeXml(v[1]);
      while (cells.length < idx) cells.push("");
      cells[idx] = value.trim();
    }
    rows.push(cells);
  }
  // Pad every row to the widest so header/cell indexes line up.
  const width = rows.reduce((w, r) => Math.max(w, r.length), 0);
  for (const r of rows) while (r.length < width) r.push("");
  return rows;
}

/** Read one worksheet by its tab name. Returns rows of trimmed strings. */
export function readXlsxSheet(file: Buffer, sheetName: string): string[][] {
  const entries = readZipEntries(file);
  const workbookEntry = entries.get("xl/workbook.xml");
  const relsEntry = entries.get("xl/_rels/workbook.xml.rels");
  if (!workbookEntry || !relsEntry) throw new Error("Not an xlsx: missing workbook parts");

  const workbook = readEntry(file, workbookEntry);
  const rels = readEntry(file, relsEntry);

  const sheetTag = [...workbook.matchAll(/<sheet\b[^>]*\/>/g)]
    .map((m) => m[0])
    .find((tag) => decodeXml(/name="([^"]*)"/.exec(tag)?.[1] ?? "") === sheetName);
  if (!sheetTag) {
    const names = [...workbook.matchAll(/<sheet\b[^>]*name="([^"]*)"/g)].map((m) => decodeXml(m[1]));
    throw new Error(`Sheet "${sheetName}" not found. Tabs: ${names.join(", ")}`);
  }
  const rid = /r:id="([^"]*)"/.exec(sheetTag)?.[1];
  const target = new RegExp(`Id="${rid}"[^>]*Target="([^"]*)"`).exec(rels)?.[1];
  if (!target) throw new Error(`No relationship target for sheet "${sheetName}"`);

  const partName = `xl/${target.replace(/^\.?\//, "")}`;
  const partEntry = entries.get(partName);
  if (!partEntry) throw new Error(`Missing worksheet part ${partName}`);

  const sharedEntry = entries.get("xl/sharedStrings.xml");
  const shared = sharedEntry ? readSharedStrings(readEntry(file, sharedEntry)) : [];
  return readSheet(readEntry(file, partEntry), shared);
}

/** List the workbook's tab names, in order. */
export function listXlsxSheets(file: Buffer): string[] {
  const entries = readZipEntries(file);
  const workbookEntry = entries.get("xl/workbook.xml");
  if (!workbookEntry) throw new Error("Not an xlsx: missing xl/workbook.xml");
  const workbook = readEntry(file, workbookEntry);
  return [...workbook.matchAll(/<sheet\b[^>]*name="([^"]*)"/g)].map((m) => decodeXml(m[1]));
}
