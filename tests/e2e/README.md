# E2E Tests — Playwright

These E2E tests require Playwright to be installed.

## Setup

```bash
npx playwright install chromium
```

## Running

```bash
npm run test:e2e
```

## Test Structure

- `auth.spec.ts` — Signup, login, logout, session persistence
- `onboarding.spec.ts` — Wizard flow, template selection, photo upload
- `dashboard.spec.ts` — KPI cards, checklist, navigation
- `guests.spec.ts` — RSVP table, filters, deletion
- `preview.spec.ts` — Inline editing, template switching, live preview
- `cagnotte.spec.ts` — Stripe Connect flow, contribution display
- `gifts.spec.ts` — Gift CRUD, reservation status
- `live.spec.ts` — SSE stream, joke display, contribution feed
