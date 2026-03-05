#!/usr/bin/env bash
set -euo pipefail

REPO="/Users/admin/Desktop/Vercel/findmy-line_nextjs"
cd "$REPO"

ts="$(date +"%Y%m%d-%H%M")"
branch="auto/${ts}"

echo "==> Creating branch: $branch"
git checkout -b "$branch"

echo "==> Installing + building"
npm ci
npm run build

echo "==> Deploying PREVIEW to Vercel (non-interactive)"
# --yes skips interactive prompts in automation contexts. :contentReference[oaicite:1]{index=1}
deploy_out="$(vercel deploy --yes --logs 2>&1 | tee /tmp/vercel_deploy_${ts}.log)"
# Try to extract the deployment URL from output
url="$(echo "$deploy_out" | grep -Eo 'https://[a-zA-Z0-9.-]+\.vercel\.app' | tail -n 1 || true)"

echo "==> Smoke test"
if [[ -n "${url}" ]]; then
  # Prefer / (should be 200). If you have a public /api/health, swap it in.
  code="$(curl -s -o /dev/null -w "%{http_code}" "${url}/" || true)"
  echo "HTTP ${code} @ ${url}/"
else
  echo "WARNING: Could not detect deployment URL from vercel output."
  code="unknown"
fi

echo "==> Commit all changes (if any) + push branch"
# If the agent made changes before running this script, they’ll be committed here.
if ! git diff --quiet || ! git diff --cached --quiet; then
  git add -A
  git commit -m "Auto: hourly iteration ${ts}"
fi

git push -u origin "$branch"

echo "==> Done. URL=${url:-"(unknown)"} HTTP=${code}"
echo "${url:-}" > "/tmp/last_preview_url.txt"

/Users/admin/Desktop/Vercel/findmy-line_nextjs/scripts/imessage_send.sh "FindMy-Line deployed: ${url}"
