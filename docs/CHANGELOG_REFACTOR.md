# Refactor Changelog Plan

Date: 2026-01-06

## Step 0: Repository Architecture Summary

### Frontend routes (Next.js App Router)
- Public: `/` (landing), `/login`
- App shell: `/app` (role redirect), `/app/profile`
- HR: `/app/hr/users`, `/app/hr/timesheets`, `/app/hr/reports`
- Supervisor: `/app/supervisor/dashboard`, `/app/supervisor/clients`, `/app/supervisor/sites`, `/app/supervisor/checklists`, `/app/supervisor/schedule`, `/app/supervisor/jobs/[id]`
- Cleaner: `/app/cleaner/today`, `/app/cleaner/active`, `/app/cleaner/jobs/[id]`, `/app/cleaner/issues`, `/app/cleaner/timesheets`
- API route handlers: `/api/timesheets/export`

### Backend routes (Next.js API)
- `POST /api/admin/provision-user` (HR user provisioning)
- `POST /api/schedule/recurring` (recurring job generator)
- `POST /api/schedule/one-off` (one-off job creation)
- `PATCH /api/jobs/[id]/review` (supervisor approval/rework)
- `POST /api/clock-events` + `POST /api/break-events` (attendance capture)
- `PATCH /api/jobs/[id]/status` (status transitions)
- `GET /api/timesheets/export` (CSV export)

### Firestore collections (current)
- Core collections: `profiles`, `clients`, `sites`, `checklist_templates`, `checklist_template_items`, `site_checklist_overrides`, `jobs`, `job_tasks`, `job_clock_events`, `job_attachments`, `issues`, `timesheet_periods`, `timesheet_entries`, `notifications`, `job_status_events`, `settings`

### Server-side RBAC overview (current)
- HR: full access + user management + timesheet approvals
- Supervisor: operational data + job review
- Cleaner: assigned jobs only, own records only
- Access is enforced in Next.js API routes via Firebase Admin + session cookies

## Step 0: Booking/Payments Inventory

Search patterns used: `booking|checkout|stripe|paypal|payment|invoice|pricing|customer`
- Result: no matches in `src/`, `README.md`, or `.env.example`
- No public booking routes, payment providers, invoice tables, or customer roles detected.

## Proposed Refactor Plan

### Remove consumer booking/payment features
- [x] Confirm no public booking/payment features exist; remove any remaining marketing/consumer wording
- [x] Remove any unused dependencies/env vars related to payments (none currently detected)

### Internal-only ops + attendance upgrades
- [x] Add `break_events` table + RLS policies + triggers for break tracking
- [x] Update time calculations: minutes_worked = (clock_out - clock_in) - break minutes
- [x] Add overtime calculation with configurable weekly threshold (settings table)
- [x] Add attendance alerts (late clock-out, missing clock-out) + exceptions

### UI/Navigation
- [x] Update role navigation to emphasize time clock widgets and attendance
- [x] Add Cleaner break start/end controls and time clock state display

### Schema + seed updates
- [x] Add migrations for new tables and removal of unused schema

### Tests + docs
- [x] Update Vitest for break aggregation + overtime calculation
- [x] Update Playwright flows to include breaks
- [x] Update README and `.env.example` for internal-only and new features
