/** Shared filesystem locations for the seed pipeline. */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/** Repository root. */
export const REPO_ROOT = join(here, "../..");
/** Committed CSV snapshots of the source spreadsheet. */
export const DATA_DIR = join(REPO_ROOT, "data/catalog");
/** Import reports written on every build (skipped rows, unmapped tokens, ...). */
export const REPORTS_DIR = join(DATA_DIR, "reports");
/** Generated SQL consumed by `supabase db push --include-seed`. */
export const SEED_SQL = join(REPO_ROOT, "supabase/seed.sql");

export const SCHOOLS_CSV = "compiled-schools.csv";
export const AIRPORTS_CSV = "compiled-airports.csv";
export const STATES_CSV = "states.csv";
