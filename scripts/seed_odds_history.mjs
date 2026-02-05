import admin from "firebase-admin";
import fs from "node:fs";

const keyPath = "/Users/petermascheroni/Desktop/Vercel/findmy-line-vercel-firebase-adminsdk-fbsvc-63279c42b2.json";

if (!fs.existsSync(keyPath)) {
  console.error("Service account key not found:", keyPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const collection = "OddsHistory";
const docId = "sample_001";

const sample = {
  game_id: "sample_game_001",
  sport_key: "basketball_nba",
  home_team: "Golden State Warriors",
  away_team: "Los Angeles Lakers",
  commence_time: admin.firestore.Timestamp.fromDate(new Date("2026-01-30T03:00:00.000Z")),

  // sportsbook key (e.g., draftkings, fanduel)
  sportsbook: "fanduel",

  // market type (h2h, spreads, totals)
  market_key: "h2h",

  // outcome name (team name, Over, Under)
  outcome_name: "Golden State Warriors",

  // american odds
  odds: -118,

  // point used for spreads/totals; not applicable for h2h
  point: null,

  // snapshot recorded time
  timestamp: admin.firestore.Timestamp.fromDate(new Date("2026-01-29T17:59:00.000Z")),
};

async function main() {
  await db.collection(collection).doc(docId).set(sample, { merge: true });
  console.log(`✅ Wrote ${collection}/${docId}`);
  console.log(sample);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
