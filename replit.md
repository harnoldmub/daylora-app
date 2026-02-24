# Nocely — Wedding SaaS Platform

## Overview

Multi-tenant wedding website SaaS. Couples create accounts, pick a template (Classic/Modern/Minimal), customize text/media inline, and share a public URL. Includes Stripe Connect for cagnotte (money pot), SSE live updates, RSVP management, gift lists, and a full admin dashboard.

## User Preferences

- Preferred communication style: Simple, everyday language
- Code style: Senior Airbnb frontend engineer — clean architecture, modularity, performance
- No comments in generated code unless explicitly requested

## Recent Changes (Feb 2026)

- **Guest invitation page redesign**: Elegant full-page invitation at `/:slug/guest/:token`
  - Component: `apps/app/client/src/pages/dot-invitation.tsx`
  - Top-level route in App.tsx (bypasses PublicLayout for unpublished weddings)
  - Dedicated API: `GET /api/invitation/guest/:token/wedding` returns wedding data without publication check
  - Cormorant Garamond + Playfair Display serif fonts
  - MonogramSeal SVG with couple initials, CornerOrnament SVG decorations
  - FloralDivider star-shaped ornament between sections
  - Scroll-triggered AnimatedSection with IntersectionObserver + fade-up transitions
  - Sections: Hero (monogram, guest name, couple names, date capsule), Couple photo, Programme (alternating timeline), Lieux (cards with MapPin + accommodations), Dress code, Cagnotte, Gallery (2x2 grid), QR code, Footer
  - Dynamic colors from `wedding.config.theme` via `hexToHSL()` — textDark, textSubtle, bgBase, cardBg, borderLight computed from primary
  - CSS `color-mix()` for subtle tinted backgrounds and borders
  - Schema: `googleId` and `appleId` columns added to users table
  - OAuth routes: `apps/api/oauth-routes.ts` with Google OAuth strategy + Apple Sign In

- **Guided tour (onboarding animation)**: Interactive step-by-step product tour on first login
  - Component: `apps/app/client/src/components/guided-tour.tsx`
  - 6 steps: Welcome → Sidebar menu → View site button → Checklist → Design link → Done
  - SVG mask spotlight effect highlights targeted UI elements with animated ring
  - Keyboard navigation (Escape to close, arrow keys for next/prev)
  - Persisted in localStorage (`nocely_tour_completed`), replayable from Settings page
  - Data attributes `data-tour` on AdminLayout sidebar, view-site button, onboarding checklist, design link

- **Signup wizard refactoring**: Account creation moved to the end of the onboarding wizard
  - New flow: Wedding info → Template → Photos → Gallery → Formule (plan) → Preview → Account creation
  - Users can see a preview of their site before creating an account
  - New API endpoint `POST /api/auth/signup-with-wedding` creates user + wedding atomically
  - `/signup` redirects to `/onboarding`
  - Login page shows success banner after signup with `?created=1`
  - Email links now point to `app.nocely.app` (APP_BASE_URL configured)

- **Premium plan & referral system**:
  - Free plan: 30 RSVPs max, cagnotte only, 6 gallery images, Nocely branding
  - Premium: unlimited RSVPs, gifts, live, jokes, custom pages, 50 gallery images, no branding
  - Pricing: 23.99€/month (min 2 months) or 149€/year
  - Referral codes: each user gets a unique code, sharing gives €10 discount on Premium
  - `referral_codes` table in PostgreSQL, Stripe coupon created at checkout
  - `PLAN_LIMITS` config in `packages/shared/schema.ts`
  - Backend enforces RSVP limit at POST /api/rsvp (402 if exceeded)
  - `GET /api/plan-limits` returns plan, limits, and RSVP count
  - `GET /api/referral/my-code` returns user's referral code
  - `GET /api/referral/validate/:code` validates a referral code
  - PremiumGate component: `apps/app/client/src/components/admin/PremiumGate.tsx`
  - GiftsPage and LiveJokesPage wrapped with PremiumGate
  - GuestsPage shows RSVP limit banner when approaching 30
  - PricingPage updated: 30 RSVPs, 149€/year, referral code sharing, referral input
  - Onboarding step 5 ("Formule"): plan selection cards + premium badges on modules


- **Gift reservation system**: Guests can reserve gifts from the public site
  - `reservedBy` column added to `gifts` table
  - Public endpoint `POST /api/gifts/:id/reserve` (no auth, requires `guestName`)
  - Admin endpoint `POST /api/gifts/:id/unreserve` (auth required)
  - GiftsSection shows "Je m'en occupe" button on available gifts for public visitors
  - Guest enters their name to confirm reservation
  - Admin GiftsPage shows who reserved each gift with unreserve button (RotateCcw icon)
  - Reserved gifts show "Réservé" badge + "Pris en charge par [name]"

- **E2E test suite**: Playwright-based E2E tests covering auth, preview, public pages, RSVP/gifts, cagnotte/live, and multi-tenant isolation
  - Config: `tests/e2e/playwright.config.ts`
  - Global setup: `tests/e2e/global-setup.ts` — seeds 25 users + sessions + weddings into PostgreSQL
  - Helpers: `tests/e2e/helpers.ts` — session cookie injection, user data factory
  - 5 spec files, 12 tests total: auth, preview, rsvp-gifts, cagnotte-live, permissions-edit
  - Run with: `npm run test:e2e` (requires `SESSION_STORE=db` for the dev server)
  - Rate limiters use dev-friendly limits (NODE_ENV !== "production"): global API 2000/15min, auth 500/15min, route-level 100/min
  - Production limits unchanged: global API 100/15min, auth 30/15min, signup 5/min, login 10/min, resend 3/min
  - No business logic modified

- **Dynamic color system & section redesign** (ar2k26.com-inspired):
  - CSS custom properties injected from `wedding.config.theme`: `--wedding-primary`, `--wedding-secondary`, `--wedding-text-dark`, `--wedding-text-subtle`
  - `hexToHSL()` utility in TemplateRenderer derives dark/subtle text colors from primary
  - HeroSection: ornamental SVG dividers, stacked invitation text, serif couple names, border-framed date
  - ScheduleSection: vertical timeline with dots/connectors replacing grid cards, Google Maps links
  - LocationsSection: vertical layout with MapPin icons, Google Maps integration
  - CountdownSection: animated flip-style numbers with CSS variable theming
  - CagnotteSection: centered gift icon, dynamic button colors
  - StorySection: hover effects, decorative dividers, responsive layout
  - All sections (RSVP, Gallery, Gifts, Story, Cagnotte) use `var(--wedding-primary)` for headings/accents
  - Back-office DesignPage color pickers now functionally change public site colors

- **Location accommodations**: Each location item can now have accommodation suggestions (name, address, booking URL)
  - Admin: DesignPage Lieux & Accès section has "Hébergements à proximité" sub-section per location
  - Public: LocationsSection displays accommodations with bed icon and external links
  - Types: `AccommodationItem` type added to `types.ts`, `LocationItem` extended with optional `accommodations` array

- **Template restriction (free plan)**: Free users can only use Classic template
  - DesignPage template selector locks Modern/Minimal with "Premium" label
  - TemplatesPage shows lock overlay on premium templates with "Passer en Premium" link
  - `TEMPLATES` array has `premium` boolean flag

- **Help chatbot**: Floating FAQ panel in admin layout
  - Component: `apps/app/client/src/components/admin/HelpChatbot.tsx`
  - 15 pre-defined Q&A items, categorized, searchable, with links to relevant admin pages

- **Default gift suggestions**: GiftsPage has "Ajouter des suggestions" button
  - Pre-populates 10 gift ideas (Voyage de noces, Appareil photo, etc.) via API

- **Modern template lightened**: Changed from dark (#0A0A0A) to light editorial style

- **PricingPage improved**: "Recommandé" badge on Premium card, larger CTA button

- **DesignPage UX**: Helper text descriptions added to accordion sections (Hero, Logo, Couleurs, Lieux)

- **Email system**: Migrated from nodemailer/SMTP to Resend via Replit connector
  - `apps/api/resend-client.ts` — uses `getUncachableResendClient()` (tokens expire)
  - `apps/api/auth-emails.ts` and `apps/api/email.ts` updated

- **DesignPage auto-save**: 1.5s debounced auto-save with saving/saved status indicator

- **Frontend refactoring**: Broke monolithic InvitationPage.tsx (1958 lines) into modular architecture:
  - Design system tokens at `apps/app/client/src/design-system/tokens.ts`
  - 9 section components at `apps/app/client/src/features/public-site/sections/`
  - TemplateRenderer at `apps/app/client/src/features/public-site/templates/TemplateRenderer.tsx`
  - InvitationPage.tsx is now a thin orchestrator (~300 lines) handling state/mutations, delegating rendering to TemplateRenderer
  - Types at `apps/app/client/src/features/public-site/types.ts`

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite (port 5000).
**UI Components**: Shadcn/ui (Radix UI) + Tailwind CSS.
**Routing**: Wouter (`/`, `/login`, `/admin/*`, `/:slug`, `/preview/:slug`).
**State**: TanStack Query for server state.
**Forms**: React Hook Form + Zod validation.
**Fonts**: Google Fonts (Playfair Display, Manrope, Inter).
**Animation**: Framer Motion for hero parallax.

### Backend Architecture

**Runtime**: Node.js + Express.js (TypeScript).
**API**: RESTful — RSVP, gifts, contributions, auth, SSE events.
**Auth**: Passport-local with bcrypt, express-session (PostgreSQL-backed).
**ORM**: Drizzle ORM for PostgreSQL.
**Payments**: Stripe Connect for cagnotte contributions.

### Database

**Engine**: PostgreSQL (Neon serverless).
**Tables**: sessions, users, weddings, rsvp_responses, contributions, gifts, custom_pages.
**Config JSON**: `weddings.config` column stores all customization (texts, media, theme, navigation, sections, features, payments).

### Key Patterns

- **Multi-tenant**: Each wedding has a `slug`; public site at `/:slug`, preview at `/preview/:slug`
- **Inline editing**: PublicEditContext provides `canEdit`/`editMode` flags; InlineEditor component for click-to-edit text
- **Template system**: 3 templates (classic/modern/minimal) driven by `templateTokens` in design-system/tokens.ts
- **Section ordering**: `wedding.config.navigation.menuItems` array determines section display order
- **SSE**: Server-sent events for real-time contribution updates

## Project Structure

```
apps/
  app/
    client/src/
      design-system/       # tokens.ts — colors, typography, template tokens
      features/
        public-site/
          sections/         # HeroSection, CountdownSection, RSVPSection, StorySection, 
                            # GallerySection, LocationsSection, ScheduleSection, GiftsSection, CagnotteSection
          templates/         # TemplateRenderer.tsx — composes sections with template tokens
          types.ts           # TypeScript interfaces for all section props
      pages/                # InvitationPage.tsx (orchestrator), admin pages, auth pages
      contexts/             # public-edit.tsx — edit mode context
      hooks/                # use-api.ts, use-toast.ts
      components/ui/        # Shadcn components, InlineEditor
      layouts/              # PublicLayout.tsx, AdminLayout.tsx
      lib/                  # queryClient.ts, design-presets.ts, image.ts
    server/                 # Express routes, storage, Stripe, SSE
  marketing/               # Landing page (DO NOT TOUCH)
tests/
  e2e/                     # Playwright E2E tests
    playwright.config.ts   # Test configuration
    global-setup.ts        # Seeds users, sessions, weddings
    helpers.ts             # Session injection, user data factory
    auth.spec.ts           # Auth & backoffice tests
    preview.spec.ts        # Preview & public page tests
    rsvp-gifts.spec.ts     # RSVP & gifts section tests
    cagnotte-live.spec.ts  # Cagnotte & live page tests
    permissions-edit.spec.ts # Multi-tenant isolation & editing tests
packages/
  shared/                  # schema.ts — Drizzle schema, Zod validators
```

## External Dependencies

- **Database**: Neon PostgreSQL
- **Payments**: Stripe Connect
- **Email**: Resend
- **Auth**: Local passport + express-session
