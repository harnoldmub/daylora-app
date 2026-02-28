# Daylora — Wedding SaaS Platform

## Overview

Daylora is a multi-tenant SaaS platform enabling couples to create personalized wedding websites. Users can select from various templates, customize content and media, and share a public URL. The platform integrates features like RSVP management, gift lists, and a money pot (cagnotte) powered by Stripe Connect, all managed through a comprehensive admin dashboard. The business vision is to provide an elegant, user-friendly, and feature-rich solution for couples to manage their wedding communications online, tapping into the significant market for wedding planning tools.

**Domain**: https://daylora.app

## User Preferences

- Preferred communication style: Simple, everyday language
- Code style: Senior Airbnb frontend engineer — clean architecture, modularity, performance
- No comments in generated code unless explicitly requested

## System Architecture

### Frontend Architecture

The frontend is built with React 18 and TypeScript, using Vite for development. UI components leverage Shadcn/ui (Radix UI) and are styled with Tailwind CSS. Routing is handled by Wouter, and application state for server data is managed with TanStack Query. Forms are implemented using React Hook Form with Zod for validation. Google Fonts are used for typography, and Framer Motion provides animations, particularly for hero sections. The frontend features an inline editing experience for content customization and a dynamic color system derived from `wedding.config.theme` properties. Key features include a redesigned guest invitation page with elegant typography and scroll-triggered animations, and a guided tour for first-time users. A modular architecture breaks down large components into smaller, manageable sections, orchestrated by a `TemplateRenderer`.

### Backend Architecture

The backend is developed with Node.js and Express.js in TypeScript, providing a RESTful API for managing RSVPs, gifts, contributions, and user authentication. Authentication uses Passport-local with bcrypt and express-session, backed by PostgreSQL. Drizzle ORM is used for database interactions. Stripe Connect handles all payment-related functionalities for the money pot feature. Server-side rendering is implemented for dynamic OG meta tags to ensure proper social media sharing, and publication guards prevent indexing of unpublished sites. A robust plan and referral system enforce feature limits based on subscription tiers, with backend enforcement for RSVP limits. Gift management includes a reservation system and URL scraping for automated gift details.

### Database

PostgreSQL, hosted on Neon serverless, serves as the database. Core tables include `sessions`, `users`, `weddings`, `rsvp_responses`, `contributions`, `gifts`, `custom_pages`, and `product_feedback`. The `weddings.config` JSON column stores all user-specific customizations, including texts, media, theme, navigation, sections, and feature configurations.

### Key Patterns

-   **Multi-tenancy**: Each wedding is identified by a unique `slug`, enabling separate public sites and admin dashboards.
-   **Inline Editing**: A `PublicEditContext` and `InlineEditor` component facilitate direct, click-to-edit functionality on the public site.
-   **Template System**: The platform offers multiple design templates (classic, modern, minimal) that dictate the visual presentation and component arrangement, with template tokens defining styles.
-   **Section Ordering**: Configurable navigation menus (`wedding.config.navigation.menuItems`) control the order and visibility of website sections.
-   **Server-Sent Events (SSE)**: Used for real-time updates, such as live contribution notifications.
-   **Feedback System**: Users can submit feedback via a modal in the admin sidebar (`FeedbackModal`). Admin users can view/manage feedback on `/feedback` page (admin-only nav item). API: `POST /api/feedback`, `GET /api/feedback/mine`, `GET /api/admin/feedback`, `PATCH /api/admin/feedback/:id` (admin only). Table: `product_feedback`.
-   **Guest Invitation Page**: Personalized invitation at `/:slug/guest/:guestId` (dot-invitation.tsx). Features RSVP status display (confirmed/pending/declined), table number, party size, dynamic theme colors, vertical timeline, QR code, cagnotte section, and "Voir notre site" link.
-   **Guided Tour**: Per-page contextual tours using `GuidedTour` component with `steps` and `tourId` props. Each page defines its own tour steps. Completion stored per-tour in both localStorage and sessionStorage (`daylora_tour_${tourId}_done`) for resilience. Reset via `resetAllTours()` from Settings page.
-   **Pricing**: Two premium options — **Annual 149€** (one-time payment, primary/recommended, no auto-renewal) and **Monthly 23,99€/mois** (subscription, min 2 months, secondary "Option flexible"). Annual is promoted as the default choice across onboarding, app pricing page, marketing site, and landing page. Stripe checkout for one-time payments includes `custom_text` reassurance. A premium confirmation email (`sendPremiumConfirmationEmail`) is sent on successful payment via webhook.
-   **Premium Upsell Modal**: First-login conversion modal (`PremiumUpsellModal`) shows once for free users who haven't seen it (`users.has_seen_premium_offer` flag). Displays key features and CTA to Stripe checkout (149€ one-time). Dismissed via "Continuer en version gratuite" or clicking Premium. Flag marked via `POST /api/auth/premium-offer-seen`. A separate `PremiumTemplateUpsell` re-appears when free users click premium templates on TemplatesPage. Component: `apps/app/client/src/components/admin/PremiumUpsellModal.tsx`.
-   **Billing & Customer Portal**: Stripe Customer Portal integrated for subscription management. Premium users see a billing dashboard with plan status, next payment date, invoice history (with PDF links), and a "Gérer mon abonnement" button that opens the Stripe-hosted portal. Monthly plan has 2-month minimum engagement (soft enforcement via UI messaging). API: `GET /api/billing/info` (subscription details + invoices), `POST /api/billing/portal` (create portal session), `POST /api/billing/checkout` (create checkout session with optional referralCode and promoCode), `POST /api/billing/sync` (sync with Stripe). The `stripe_subscriptions` table tracks `cancelAtPeriodEnd`, `subscriptionStartDate` for engagement calculation. Webhook handles `cancel_at_period_end` from portal-initiated cancellations.
-   **Promo Codes**: Full lifecycle — Super Admin creates codes (percentage or fixed amount, with optional duration, max uses, date range). Users enter codes on the pricing page; validated via `POST /api/promo/validate`. On checkout, a Stripe coupon is created dynamically and applied as a discount. After successful payment, the webhook increments `currentUses` in `promo_codes` table. Table: `promo_codes`.
-   **Super Admin Backoffice**: Accessible at `/admin/*` with separate auth (`req.session.superAdminId`). Auto-seeded from `SUPER_ADMIN_PASSWORD` env var. Pages: Dashboard (KPIs), Tenants (list/detail/plan/status/slug management), Promo codes (CRUD), Audit logs (paginated, filterable), Settings (password change). All actions logged in `admin_audit_logs`. API: `apps/api/super-admin-routes.ts`. Frontend: `apps/app/client/src/pages/super-admin/`.
-   **Cookie Consent (RGPD)**: Reusable module at `apps/app/client/src/lib/cookie-consent.ts`. Categories: `necessary` (always on), `analytics`, `marketing`. Banner (`cookie-banner.tsx`) only appears when non-necessary categories are registered via `registerCategory()`. Currently no analytics/marketing cookies exist, so no banner shows. `conditional-scripts.ts` provides `loadScriptIfConsented(category, url)` to load scripts only with consent. Legal pages at `/legal/mentions-legales`, `/legal/confidentialite`, `/legal/cgu`, `/legal/cookies` in both app and marketing sites.

### Environment Variables

- `STRIPE_PRICE_SUBSCRIPTION` and `STRIPE_PRICE_LIFETIME` are environment-scoped (dev uses Stripe test price IDs, prod uses live price IDs).
- `APP_NAME=Daylora`, `APP_DOMAIN=daylora.app` (shared).

## External Dependencies

-   **Database**: Neon PostgreSQL
-   **Payments**: Stripe Connect + Stripe Customer Portal
-   **Email**: Resend
-   **Authentication**: Passport.js (local strategy)
