import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import admin from "firebase-admin";
import { parse } from "csv-parse/sync";

/**
 * Imports all Base44 *_export.csv files from a directory into Firestore.
 *
 * Usage:
 * node scripts/import_base44_exports.mjs \
 *   --serviceAccount /path/to/key.json \
 *   --csvDir /path/to/Downloads \
 *   --dryRun true|false
 *
 * Notes:
 * - Collection name is derived from filename: Team_export.csv -> Team
 * - If a CSV row has an "id" column, it will be used as the Firestore doc ID.
 * - Otherwise Firestore auto-IDs are used.
 */

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
}

const serviceAccountPath = arg("serviceAccount");
const csvDirRaw = arg("csvDir", path.join(os.homedir(), "Downloads"));
const dryRun = (arg("dryRun", "true") || "true").toLowerCase() === "true";

if (!serviceAccountPath) {
  console.error("Missing --serviceAccount path to Firebase Admin JSON key.");
  process.exit(1);
}

const csvDir =
  csvDirRaw.startsWith("~/")
    ? path.join(os.homedir(), csvDirRaw.slice(2))
    : csvDirRaw;

if (!fs.existsSync(csvDir)) {
  console.error(`CSV directory not found: ${csvDir}`);
  process.exit(1);
}

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account JSON not found: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function isIsoDateString(v) {
  if (typeof v !== "string") return false;
  const d = new Date(v);
  return !Number.isNaN(d.getTime()) && (v.includes("T") || v.endsWith("Z"));
}

function coerceField(key, value) {
  if (value === "" || value == null) return null;

  // booleans
  if (value === "true") return true;
  if (value === "false") return false;

  // numbers (avoid converting long IDs)
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    if (value.length <= 15) return Number(value);
  }

  // timestamps (best-effort based on common suffixes)
  if (
    key.endsWith("_date") ||
    key.endsWith("_at") ||
    key === "created_date" ||
    key === "updated_date" ||
    key === "subscription_expires_at"
  ) {
    if (isIsoDateString(value)) {
      return admin.firestore.Timestamp.fromDate(new Date(value));
    }
  }

  return value;
}

function deriveCollectionName(filename) {
  // Team_export.csv -> Team
  return filename.replace(/_export\.csv$/i, "");
}

async function importOneFile(filePath) {
  const filename = path.basename(filePath);
  const collection = deriveCollectionName(filename);

  const csvText = fs.readFileSync(filePath, "utf8");

  // Handle empty files gracefully (e.g. 0-byte exports)
  if (!csvText || csvText.trim().length === 0) {
    console.log(`\n=== ${filename} -> collection "${collection}" (EMPTY FILE, skipping) ===`);
    return;
  }

  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`\n=== ${filename} -> collection "${collection}" (${rows.length} rows) ===`);

  if (rows.length === 0) return;

  if (dryRun) {
    console.log(`Dry run: would import ${rows.length} docs to "${collection}"`);
    console.log("Sample row:", rows[0]);
    return;
  }

  let batch = db.batch();
  let ops = 0;
  let total = 0;

  for (const row of rows) {
    const docId = row.id ? String(row.id) : null;

    const data = {};
    for (const [k, v] of Object.entries(row)) {
      data[k] = coerceField(k, v);
    }

    const ref = docId
      ? db.collection(collection).doc(docId)
      : db.collection(collection).doc();

    batch.set(ref, data, { merge: true });
    ops++;
    total++;

    // Firestore batch limit is 500 writes; keep a buffer
    if (ops >= 450) {
      await batch.commit();
      console.log(`Committed ${total}/${rows.length} into "${collection}"`);
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
    console.log(`Committed ${total}/${rows.length} into "${collection}"`);
  }

  console.log(`Done importing "${collection}".`);
}

async function main() {
  const files = fs
    .readdirSync(csvDir)
    .filter((f) => /_export\.csv$/i.test(f))
    .map((f) => path.join(csvDir, f));

  if (files.length === 0) {
    console.log(`No *_export.csv files found in: ${csvDir}`);
    process.exit(0);
  }

  console.log(`Found ${files.length} export file(s) in ${csvDir}`);
  console.log(`Dry run: ${dryRun}`);

  for (const f of files) {
    await importOneFile(f);
  }

  console.log("\nAll imports complete.");
}

main().catch((e) => {
  console.error("Import failed:", e);
  process.exit(1);
});
