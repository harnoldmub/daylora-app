# Nocely — Wedding SaaS Platform

## Overview

Multi-tenant wedding website SaaS. Couples create accounts, pick a template (Classic/Modern/Minimal), customize text/media inline, and share a public URL. Includes Stripe Connect for cagnotte (money pot), SSE live updates, RSVP management, gift lists, and a full admin dashboard.

## User Preferences

- Preferred communication style: Simple, everyday language
- Code style: Senior Airbnb frontend engineer — clean architecture, modularity, performance
- No comments in generated code unless explicitly requested

## Recent Changes (Feb 2026)

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
packages/
  shared/                  # schema.ts — Drizzle schema, Zod validators
```

## External Dependencies

- **Database**: Neon PostgreSQL
- **Payments**: Stripe Connect
- **Email**: Resend
- **Auth**: Local passport + express-session
