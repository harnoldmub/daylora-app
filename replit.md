# Nocely — Wedding SaaS Platform

## Overview

Nocely is a multi-tenant SaaS platform enabling couples to create personalized wedding websites. Users can select from various templates, customize content and media, and share a public URL. The platform integrates features like RSVP management, gift lists, and a money pot (cagnotte) powered by Stripe Connect, all managed through a comprehensive admin dashboard. The business vision is to provide an elegant, user-friendly, and feature-rich solution for couples to manage their wedding communications online, tapping into the significant market for wedding planning tools.

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

PostgreSQL, hosted on Neon serverless, serves as the database. Core tables include `sessions`, `users`, `weddings`, `rsvp_responses`, `contributions`, `gifts`, and `custom_pages`. The `weddings.config` JSON column stores all user-specific customizations, including texts, media, theme, navigation, sections, and feature configurations.

### Key Patterns

-   **Multi-tenancy**: Each wedding is identified by a unique `slug`, enabling separate public sites and admin dashboards.
-   **Inline Editing**: A `PublicEditContext` and `InlineEditor` component facilitate direct, click-to-edit functionality on the public site.
-   **Template System**: The platform offers multiple design templates (classic, modern, minimal) that dictate the visual presentation and component arrangement, with template tokens defining styles.
-   **Section Ordering**: Configurable navigation menus (`wedding.config.navigation.menuItems`) control the order and visibility of website sections.
-   **Server-Sent Events (SSE)**: Used for real-time updates, such as live contribution notifications.

## External Dependencies

-   **Database**: Neon PostgreSQL
-   **Payments**: Stripe Connect
-   **Email**: Resend
-   **Authentication**: Passport.js (local strategy)