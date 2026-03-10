# FindMy-Line Bot Workflow

This file defines the required workflow for any bot or automated agent working on this repository.

## Project root

- Repository root: `/Users/admin/Desktop/Vercel/findmy-line_nextjs`
- Primary branch: `main`
- Default working pattern: create a fresh task branch from `main` for every change

## Required workflow for every task

1. Start from `main`
2. Pull the latest changes from `origin/main`
3. Create a fresh task branch
4. Make only the scoped changes needed for the task
5. Run validation commands
6. Review changed files
7. Commit with a clear message
8. Push the task branch to GitHub
9. Use a Vercel preview deployment by default
10. Stop and ask for approval before any production-impacting action

## Exact git workflow

```bash
git checkout main
git pull origin main
git checkout -b auto/YYYYMMDD-HHMM-short-task
