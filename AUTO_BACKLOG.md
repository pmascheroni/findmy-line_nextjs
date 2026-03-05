# AUTO_BACKLOG (hourly ship queue)

Rules:
- One small, user-visible feature per run.
- Keep changes <= ~200 LOC unless unavoidable.
- Prefer UI/features related to sportsbook vs prediction market comparison.

Queue (top is next):
1) Add a “True Odds (avg)” column per market + implied probability (normalize).
2) Add a filter: sportsbook only / prediction markets only / both.
3) Add sorting by best payout %, and highlight best line per market.
4) Add “last updated” timestamp + refresh button with loading state.
5) Add a compact “arb hint” badge when spread between best sportsbook and best market exceeds threshold.
