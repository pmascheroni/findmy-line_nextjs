# FindMy-Line Bot Workflow

This file defines the required workflow for any bot or automated agent working on this repository.

## Project root

- Repository root: `/Users/admin/Desktop/Vercel/findmy-line_nextjs`
- Production branch: `main`
- Stable development branch: `dev`
- Default working pattern: create a fresh task branch from the correct base branch for every change

## Branch and environment model

- `main` = production branch
- `findmy-line.com` = production domain
- `dev` = stable development / preview branch
- `dev.findmy-line.com` = stable preview domain for auth and integration testing
- `auto/...` branches = temporary task branches only
- Random preview URLs may be used for branch previews, but `dev.findmy-line.com` is the preferred stable non-production test URL

## Required workflow for every task

Important baseline rules:

- New task branches must always be created from the correct current base branch
- Use `dev` as the default base branch for normal development work
- Use `main` as the base branch only when explicitly preparing production work or when instructed
- If a repo-health, workflow-fix, or validation-fix branch has not yet been merged into the intended base branch, merge that baseline branch first before starting new task work
- Never start a new task branch from an older `auto/...` branch
- Never commit directly to `main`
- Never merge to `main` or trigger production deployment without explicit approval

## Default branch selection rules

- Normal feature work, bug fixes, UI changes, and auth/debug work should start from `dev`
- Production-only hotfixes or explicitly approved production work may start from `main`
- If unsure, use `dev`

## Required workflow for normal development tasks

1. Start from `dev` unless explicitly told otherwise
2. Pull the latest changes from the chosen base branch
3. Create a fresh task branch
4. Make only the scoped changes needed for the task
5. Run validation commands
6. Review changed files
7. Commit with a clear message
8. Push the task branch to GitHub
9. Use a Vercel preview deployment by default
10. If approved and appropriate, merge the change into `dev`
11. Use `dev.findmy-line.com` for stable non-production testing when needed
12. Stop and ask for approval before any production-impacting action

## Promotion flow

1. Complete work on a fresh `auto/...` task branch
2. Run `npm run lint` and `npm run build`
3. Push the task branch
4. Use a branch preview deployment if needed
5. Merge approved work into `dev`
6. Test on `dev.findmy-line.com` when stable preview or auth/integration testing is needed
7. Prepare a summary for production promotion
8. Merge into `main` and deploy production only with explicit approval

## Exact git workflow for normal development work

```bash
git checkout main
git pull origin main
# only do this when explicitly approved or when preparing an approved production promotion
git checkout -b auto/YYYYMMDD-HHMM-short-task