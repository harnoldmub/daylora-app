# Marie & Julien Wedding Website - Golden Love 2026

## Overview

This project is an elegant, mobile-first wedding website for Marie & Julien's 2026 wedding. It functions as a public landing page for guests to view details and RSVP, and a private admin dashboard for managing guest responses and table assignments. The design embodies a romantic, sophisticated aesthetic with a gold and ivory color palette, aiming to create an emotional and memorable experience for wedding guests.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite.
**UI Component System**: Shadcn/ui (based on Radix UI) with Tailwind CSS.
**Routing**: Wouter for client-side routing (`/`, `/login`, `/admin`, `/cagnotte`, `/contribution/merci`).
**State Management**: TanStack Query for server state.
**Form Handling**: React Hook Form with Zod validation.
**Styling System**: Tailwind CSS with custom CSS variables for light/dark modes and a gold/ivory palette.
**Typography**: Google Fonts (Playfair Display, Lato, Great Vibes).

### Backend Architecture

**Runtime**: Node.js with Express.js (TypeScript).
**API Design**: RESTful API for RSVP management, login, and user session.
**Authentication**: Local authentication using Passport-local with bcrypt and `express-session` (PostgreSQL-backed).
**Data Layer**: Storage abstraction with Drizzle ORM for PostgreSQL.
**Development Server**: Vite with HMR.

### Data Storage

**Database**: PostgreSQL (via Neon serverless driver).
**ORM**: Drizzle ORM for type-safe queries.
**Schema Design**: `sessions`, `users`, `rsvp_responses`, and `contributions` tables storing guest details, availability, table assignments, and wedding contributions.
**Type Safety**: Full type inference from database schema to TypeScript using Drizzle and Zod for runtime validation.

### UI/UX Decisions

The design is inspired by luxury wedding platforms, featuring a gold and ivory color palette.
- **Hero Section**: Large elegant names with a subtle background image.
- **Notre Histoire**: Separated portrait layout with a centered quote.
- **Dates Section**: Clean heading with a large date display and countdown timer.
- **Gallery**: 3-column grid with aspect-ratio 3:4 images and hover effects, including a lightbox and social sharing.
- **Footer**: Organized 4-column structure with navigation.
- **General**: Increased white space, light font weights, consistent `tracking-wide` and `uppercase` styling for section headers, and smooth scroll navigation.

## External Dependencies

**Database Service**: Neon PostgreSQL serverless database.
**CDN Services**: Google Fonts CDN.
**UI Component Libraries**: Radix UI, Shadcn/ui, Lucide React.
**Session Storage**: `connect-pg-simple` for PostgreSQL-backed `express-session`.
**Payment Processing**: Stripe integration via Replit connector for wedding contributions (cagnotte).

## Cagnotte (Wedding Contribution) Feature

**Dedicated Page**: `/cagnotte` - A standalone page with the couple's photo, countdown timer, total collected amount, and contribution form.
**Message Field**: Contributors can leave an optional message for the couple.
**Stripe Integration**: Secure payment processing with Stripe Checkout.
**Thank You Page**: `/contribution/merci` - Displays contribution confirmation and total collected amount.
**Database**: Contributions stored with donor name, amount (cents), optional message, and Stripe session/payment IDs.

## Pending Features

**WhatsApp API Integration**: Automatic WhatsApp messaging via API is deferred. Currently uses WhatsApp Web URL method (opens wa.me link). To enable automatic sending, user needs to provide WhatsApp Business API credentials (Twilio, Meta, or other provider) and store them as secrets.