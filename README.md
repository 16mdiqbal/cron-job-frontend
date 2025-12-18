# Cron Job Manager – Frontend

Web UI for managing scheduled jobs, executions history, users, and notifications.

## Requirements
- Node.js 18+
- Backend running (default: `http://localhost:5001`)

## Setup
```bash
npm install
```

Create an environment file (local dev: `.env.development`) and set the backend API URL:

```bash
# .env.development
VITE_API_URL=http://localhost:5001/api
```

Start the dev server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Type-check:

```bash
npm run type-check
```

## What’s Included
- Authentication (JWT)
- Jobs
  - Create/edit/delete
  - Category (defaults to “General”)
  - Category tabs on Jobs table (persists)
  - Enable/disable
  - Next Execution highlighting (JST): < 1 hour (orange), < 12 hours (sky)
  - Table sorting (name/repo/status)
  - Bulk upload via CSV + template download
  - Bulk actions (enable/disable/delete)
  - Export/download jobs as CSV/JSON
  - “Run now” modal with per-run overrides (not saved)
- Executions
  - History list + details modal
  - Filters (including date range) + auto-refresh so scheduled runs appear without manual reload
- Notifications
  - Inbox/history page with unread filter, date range (All time / 7 days / 30 days / custom), mark read/all read, delete
  - Header dropdown with unread badge
- Settings
  - **Notification Preferences** (configuration lives here)
  - **Job Categories** (admin-managed list used in Jobs)
- Dashboard
  - Live totals and execution statistics (auto-refresh) + date range filter for stats
- Theme
  - Light/Dark toggle (persists in localStorage)

## Notes
- GitHub Actions dispatch:
  - For scheduled runs, the backend must have a `GITHUB_TOKEN` set in its environment.
  - The “Run now” modal lets you paste a PAT for a single execution; it is not stored.
- Default backend API URL is `http://localhost:5001/api` (override with `VITE_API_URL`).
