# CleanOPS

CleanOPS is an internal cleaning operations system for HR, supervisors, and mobile cleaners. It covers scheduling, checklist execution, geofenced clock-in/out, break tracking, approvals, and payroll exports with offline-first support.

## Features
- Role-based app experiences for HR, Supervisor, and Cleaner
- Job scheduling (one-off + recurring), checklist templates, and site overrides
- Cleaner PWA with offline queue + IndexedDB cache
- Geofenced clock events with distance validation
- Break tracking with exceptions for missing start/end
- Supervisor review + approvals + rework notes
- Timesheets with overtime summaries and CSV export
- Firebase Auth + Firestore with server-side role enforcement

## Tech Stack
- Next.js App Router + React + TypeScript
- TailwindCSS + shadcn/ui + lucide-react
- Firebase Auth + Firestore
- Dexie (IndexedDB offline queue)
- Vitest + Playwright

## Firebase Setup (Hosted)
1) Create a Firebase project (non-production recommended for local dev).
2) Enable Email/Password auth in **Authentication ? Sign-in method**.
3) Create a Firestore database (test mode is fine for local dev).
4) Create a service account in **Project Settings ? Service Accounts** and download JSON.
5) Copy `.env.example` to `.env.local` and set the Firebase values:
```bash
cp .env.example .env.local
```
6) Fill `.env.local` with your Firebase project values:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` from **Project Settings ? General ? Your apps (Web)**.
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` is optional until Storage is enabled.
   - For admin access, set either `FIREBASE_SERVICE_ACCOUNT_JSON` (single-line JSON) or `FIREBASE_SERVICE_ACCOUNT_BASE64`.

   Windows PowerShell base64 example:
   ```powershell
   $json = Get-Content "path\\to\\serviceAccount.json" -Raw
   [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json))
   ```
   Paste the result into `FIREBASE_SERVICE_ACCOUNT_BASE64` and leave `FIREBASE_SERVICE_ACCOUNT_JSON` empty.
7) Seed demo data (users, jobs, checklists, timesheets):
```bash
npm run seed
```
8) Install dependencies and start the app:
```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Demo Accounts
Password for all demo users: `CleanOPS123!`
- HR: `hr@cleanops.local`
- Supervisor: `supervisor@cleanops.local`
- Cleaner 1: `cleaner1@cleanops.local`
- Cleaner 2: `cleaner2@cleanops.local`
Sample employee IDs: `CLN-101`, `CLN-102`

## Offline Mode + Sync
- Cleaner actions (clock events, breaks, task updates, issues) are queued in IndexedDB when offline.
- `syncPendingQueue` retries with exponential backoff and marks items as `NEEDS_ATTENTION` on conflict or repeated failure.
- When online resumes, queued items sync automatically; a banner indicates pending or failed items.

## Geofence Validation
- Cleaner clock events capture GPS coordinates + accuracy.
- A Haversine distance calculation flags events outside the site geofence radius.
- Events outside the radius are allowed but stored with `is_within_geofence = false` and shown to supervisors/HR as exceptions.

## Attendance + Overtime
- `job_clock_events` track clock-in/out with geofence validation.
- `break_events` track breaks; missing start/end flags are recorded as exceptions.
- Timesheets subtract break minutes when calculating total minutes worked.
- Overtime is computed per timesheet period using `settings/overtime_threshold_minutes` (default 38 hrs / 2280 mins).

## Photo Uploads (Storage)
- Photo uploads are temporarily disabled in the Firebase migration.
- The UI keeps attachment counters, but uploads are blocked until Firebase Storage is wired in.

## Security Model
- All privileged operations are enforced in Next.js API routes via Firebase Admin + session cookies.
- Roles are stored in `profiles` and checked server-side for every write.
- Recommended Firestore rules: deny all client writes (see `firestore.rules`).

## Privileged API Routes
- `POST /api/admin/provision-user`: HR-only user provisioning with temp passwords.
- `POST /api/schedule/recurring`: recurring job generator.
- `POST /api/schedule/one-off`: one-off job creation.
- `PATCH /api/jobs/[id]/review`: supervisor approve/rework actions.

## Tests
```bash
npm run test
npm run test:e2e
```
Note: E2E tests expect a seeded Firebase project and `npm run dev` running.

## Scripts
- `npm run dev` - start Next.js
- `npm run build` - production build
- `npm run start` - production server
- `npm run lint` - lint
- `npm run format` - format
- `npm run test` - unit tests
- `npm run test:e2e` - Playwright smoke tests
- `npm run seed` - seed Firebase demo data

## CONFIG + Assumptions
- Hosted Firebase is used for dev/test; Firestore rules are locked down and server routes enforce access.
- Timesheet periods default to weekly (Mon-Sun) when auto-created on job approval.
- Photo uploads are disabled until Firebase Storage is integrated.
- PWA caching is optimized for local testing; production should tune Workbox caching and storage quotas.
- Login rate limiting is best-effort (client-side). Production should add identity throttling.

## Project Structure
- `src/app` - Next.js routes
- `src/lib` - data access, offline sync, utilities
- `src/app/api` - server routes for privileged operations
- `scripts/seed-firestore.js` - demo data seed
- `tests/e2e` - Playwright tests
