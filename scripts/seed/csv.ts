/**
 * Minimal RFC 4180 CSV reader/writer. No dependencies: the seed pipeline runs
 * under `node --experimental-strip-types` with nothing installed but the repo's
 * own devDependencies.
 */

/** Parse CSV text into rows of raw string cells. Handles quotes, escaped quotes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  // Strip a UTF-8 BOM: Google Sheets exports one and it would poison the first header.
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Parse into objects keyed by the header row. Duplicate header names keep the
 * FIRST column (the sheet has a stray blank second `name` column in some tabs).
 */
export function parseCsvRecords(text: string): Record<string, string>[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells) => {
    const rec: Record<string, string> = {};
    header.forEach((key, i) => {
      if (key !== "" && !(key in rec)) rec[key] = (cells[i] ?? "").trim();
    });
    return rec;
  });
}

function quote(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Serialize rows of objects using `columns` as both header and key order. */
export function toCsv(columns: string[], rows: Record<string, string>[]): string {
  const lines = [columns.map(quote).join(",")];
  for (const row of rows) {
    lines.push(columns.map((c) => quote(row[c] ?? "")).join(","));
  }
  return `${lines.join("\n")}\n`;
}
