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
VITE_API_URL=http://localhost:5001/api/v2
```

Start the dev server:

```bash
npm run dev
```

## Scripts
- `npm run dev` - Start Vite dev server
- `npm run build` - Typecheck + build production bundle
- `npm run preview` - Preview production build locally
- `npm run lint` - ESLint (configured for 0 warnings)
- `npm run lint:fix` - ESLint auto-fix
- `npm run format` - Prettier format
- `npm run test` - Vitest
- `npm run type-check` - TypeScript typecheck

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
  - Required fields: **End date (JST)** + **PIC Team**
  - Cron validation + preview (“Next 5 runs”) + “Test run” (pre-save)
  - Category (defaults to “General”)
  - Category tabs on Jobs table (persists)
  - Enable/disable
  - Next Execution highlighting (JST): < 1 hour (orange), < 12 hours (sky)
  - Table sorting (name/repo/status/end date)
  - Configurable columns per user (persisted): PIC Team, End date, Cron Expression, Target URL, Last Execution
  - Bulk upload via CSV + template download
  - Bulk actions (enable/disable/delete)
  - Export/download jobs as CSV/JSON (CSV follows visible columns)
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
  - **PIC Teams** (admin-managed list used in Jobs)
  - **Slack** (admin: webhook URL + optional channel)
- Dashboard
  - Live totals and execution statistics (auto-refresh) + date range filter for stats
  - “Needs attention” shortcuts (failed last 24h, no next run, ending soon, disabled jobs)
- Theme
  - Light/Dark/System toggle (persists in localStorage)

## Notes
- GitHub Actions dispatch:
  - For scheduled runs, the backend must have a `GITHUB_TOKEN` set in its environment.
  - The “Run now” modal lets you paste a PAT for a single execution; it is not stored.
- Default backend API URL is `http://localhost:5001/api/v2` (override with `VITE_API_URL`).

## Folder Structure
```
cron-job-frontend/
├── README.md
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig*.json
├── vite.config.*
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── pages/
    │   ├── DashboardPage.tsx
    │   ├── ExecutionsPage.tsx
    │   ├── JobFormPage.tsx
    │   ├── JobsPage.tsx
    │   ├── LoginPage.tsx
    │   ├── NotificationsPage.tsx
    │   ├── SettingsPage.tsx
    │   └── UsersPage.tsx
    ├── components/
    │   ├── auth/ (login/logout/protected routes)
    │   ├── common/ (error boundary)
    │   ├── executions/ (list + details modal)
    │   ├── jobs/ (list, filters, form, bulk upload, run modal)
    │   ├── layout/ (header/sidebar/layout shell)
    │   ├── notifications/ (header dropdown)
    │   ├── settings/ (preferences + admin settings)
    │   ├── ui/ (shared UI components)
    │   └── users/ (admin user forms)
    ├── services/
    │   ├── api/ (axios client + API services)
    │   └── utils/ (csv, jwt, theme, error helpers)
    ├── stores/ (zustand stores)
    ├── types/ (shared TS types)
    └── test/ (vitest setup)
```
