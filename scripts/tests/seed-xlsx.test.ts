import { test } from "node:test";
import assert from "node:assert/strict";
import { deflateRawSync } from "node:zlib";
import { readXlsxSheet, listXlsxSheets, columnIndex } from "../seed/xlsx.ts";

/**
 * Builds a minimal .xlsx (a ZIP of XML parts) in memory.
 *
 * The reader is fed a real Google Sheets export in normal use, which needs the
 * network; these synthetic workbooks pin the ZIP and XML handling offline.
 */
function buildXlsx(parts: { name: string; content: string; store?: boolean }[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const part of parts) {
    const nameBuf = Buffer.from(part.name, "utf8");
    const raw = Buffer.from(part.content, "utf8");
    const stored = part.store === true;
    const body = stored ? raw : deflateRawSync(raw);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(stored ? 0 : 8, 8); // method
    local.writeUInt32LE(0, 14); // crc — this reader does not verify it
    local.writeUInt32LE(body.length, 18); // compressed size
    local.writeUInt32LE(raw.length, 22); // uncompressed size
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(stored ? 0 : 8, 10); // method
    central.writeUInt32LE(0, 16); // crc
    central.writeUInt32LE(body.length, 20); // compressed size
    central.writeUInt32LE(raw.length, 24); // uncompressed size
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(offset, 42);

    locals.push(local, nameBuf, body);
    centrals.push(central, nameBuf);
    offset += local.length + nameBuf.length + body.length;
  }

  const dir = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(parts.length, 8);
  eocd.writeUInt16LE(parts.length, 10);
  eocd.writeUInt32LE(dir.length, 12);
  eocd.writeUInt32LE(offset, 16);

  return Buffer.concat([...locals, dir, eocd]);
}

function sheetXml(rows: string[][]): string {
  const cells = rows
    .map((row, r) => {
      const cs = row
        .map((v, c) => `<c r="${String.fromCharCode(65 + c)}${r + 1}" t="inlineStr"><is><t>${v}</t></is></c>`)
        .join("");
      return `<row r="${r + 1}">${cs}</row>`;
    })
    .join("");
  return `<?xml version="1.0"?><worksheet><sheetData>${cells}</sheetData></worksheet>`;
}

const workbook = `<?xml version="1.0"?><workbook><sheets>
  <sheet name="COMPILED SCHOOLS" sheetId="1" r:id="rId1"/>
  <sheet name="Other Tab" sheetId="2" r:id="rId2"/>
</sheets></workbook>`;

const rels = `<?xml version="1.0"?><Relationships>
  <Relationship Id="rId1" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Target="worksheets/sheet2.xml"/>
</Relationships>`;

/**
 * sheet1 is deliberately NOT the last entry: the bug this guards against read
 * the uncompressed size from the central directory and sliced to the end of
 * the archive, so everything after the target entry became trailing garbage
 * on the deflate stream.
 */
function fixture(): Buffer {
  return buildXlsx([
    { name: "xl/workbook.xml", content: workbook },
    { name: "xl/_rels/workbook.xml.rels", content: rels },
    {
      name: "xl/worksheets/sheet1.xml",
      content: sheetXml([
        ["name", "Identifier"],
        ["Williams Soaring Center", "00CL"],
        ["Hilliard Aviation, Inc.", "01J"],
      ]),
    },
    { name: "xl/worksheets/sheet2.xml", content: sheetXml([["ignored"]]) },
    { name: "xl/sharedStrings.xml", content: `<?xml version="1.0"?><sst></sst>` },
  ]);
}

test("readXlsxSheet reads a deflated entry that is followed by other entries", () => {
  const rows = readXlsxSheet(fixture(), "COMPILED SCHOOLS");
  assert.deepEqual(rows, [
    ["name", "Identifier"],
    ["Williams Soaring Center", "00CL"],
    ["Hilliard Aviation, Inc.", "01J"],
  ]);
});

test("readXlsxSheet handles stored (uncompressed) entries", () => {
  const buf = buildXlsx([
    { name: "xl/workbook.xml", content: workbook, store: true },
    { name: "xl/_rels/workbook.xml.rels", content: rels, store: true },
    { name: "xl/worksheets/sheet1.xml", content: sheetXml([["a", "b"]]), store: true },
    { name: "xl/worksheets/sheet2.xml", content: sheetXml([["x"]]), store: true },
  ]);
  assert.deepEqual(readXlsxSheet(buf, "COMPILED SCHOOLS"), [["a", "b"]]);
});

test("listXlsxSheets returns tab names in order", () => {
  assert.deepEqual(listXlsxSheets(fixture()), ["COMPILED SCHOOLS", "Other Tab"]);
});

test("a missing tab names the tabs that do exist", () => {
  assert.throws(() => readXlsxSheet(fixture(), "Nope"), /Nope.*not found.*COMPILED SCHOOLS/s);
});

test("rows are padded to a common width so header indexes line up", () => {
  const buf = buildXlsx([
    { name: "xl/workbook.xml", content: workbook },
    { name: "xl/_rels/workbook.xml.rels", content: rels },
    { name: "xl/worksheets/sheet1.xml", content: sheetXml([["a", "b", "c"], ["1"]]) },
    { name: "xl/worksheets/sheet2.xml", content: sheetXml([["x"]]) },
  ]);
  const rows = readXlsxSheet(buf, "COMPILED SCHOOLS");
  assert.equal(rows[0].length, rows[1].length);
  assert.deepEqual(rows[1], ["1", "", ""]);
});

test("an unsupported compression method is named, not fed to zlib", () => {
  // Previously any non-zero method was handed to inflateRawSync, which failed
  // with an opaque "incorrect header check" instead of saying what was wrong.
  const buf = buildXlsx([
    { name: "xl/workbook.xml", content: workbook },
    { name: "xl/_rels/workbook.xml.rels", content: rels },
    { name: "xl/worksheets/sheet1.xml", content: sheetXml([["a"]]) },
    { name: "xl/worksheets/sheet2.xml", content: sheetXml([["x"]]) },
  ]);
  // Rewrite sheet1's central-directory method to 14 (LZMA).
  const dirStart = buf.readUInt32LE(buf.length - 22 + 16);
  let p = dirStart;
  for (let i = 0; i < 4; i++) {
    const nameLen = buf.readUInt16LE(p + 28);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    if (name === "xl/worksheets/sheet1.xml") {
      buf.writeUInt16LE(14, p + 10);
      break;
    }
    p += 46 + nameLen + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
  }
  assert.throws(() => readXlsxSheet(buf, "COMPILED SCHOOLS"), /unsupported ZIP compression method 14/);
});

test("not a zip at all fails with a clear message", () => {
  assert.throws(() => readXlsxSheet(Buffer.from("<!DOCTYPE html><html>login</html>"), "x"), /Not a zip file/);
});

test("columnIndex maps spreadsheet column refs to zero-based indexes", () => {
  assert.equal(columnIndex("A1"), 0);
  assert.equal(columnIndex("B2"), 1);
  assert.equal(columnIndex("Z10"), 25);
  assert.equal(columnIndex("AA1"), 26);
  assert.equal(columnIndex("AF1"), 31);
});
