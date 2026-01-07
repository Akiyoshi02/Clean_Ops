# Kiosk Removal Plan

Date: 2026-01-06

## Kiosk Inventory

### Routes / Pages / Components
- Public route: `src/app/kiosk/page.tsx`
- Supervisor kiosk management: `src/app/app/supervisor/kiosk/page.tsx`
- Supervisor kiosk UI: `src/app/app/supervisor/kiosk/kiosk-manager.tsx`
- Navigation link: `src/lib/nav.ts`
- Kiosk API handler: `src/app/api/kiosk/clock/route.ts`

### Server / Privileged API
- Kiosk clock validation logic was removed from API handlers.
- Provisioning flow is handled via `POST /api/admin/provision-user`.

### Database Objects / Policies
- Firestore collections no longer include kiosk device metadata.
- Clock/break event source enums no longer include kiosk values.

### Seed Data
- Kiosk device seeds were removed from the Firebase seed script.

### Docs / References
- `README.md` kiosk sections and PIN references removed.

## Removal Plan
- [x] Remove kiosk routes/pages/components and navigation link
- [x] Remove kiosk API handler and any kiosk auth logic
- [x] Remove kiosk DB objects (table, columns, enum value, functions, policies)
- [x] Remove kiosk-related seed data and profile PINs
- [x] Update TypeScript types to remove kiosk artifacts
- [x] Update docs to remove kiosk references
- [x] Update tests and CI if they include kiosk assumptions

## Assumptions
- All clock-in/out now occurs through the cleaner PWA; shared kiosk devices are no longer required.
- Existing kiosk clock/break events can be treated as standard online events after migration cleanup.
