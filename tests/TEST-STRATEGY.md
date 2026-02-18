# Nocely — Test Strategy

## Architecture

```
tests/
├── setup/                    # Test configuration & setup files
│   ├── unit.ts               # Unit test setup (custom matchers)
│   ├── api.ts                # API test setup (env vars, mocks)
│   └── component.ts          # Component test setup (jest-dom)
├── helpers/                  # Shared test utilities
│   ├── factories.ts          # Data factories (buildUser, buildWedding, etc.)
│   ├── mock-storage.ts       # In-memory MockStorage (implements IStorage)
│   └── test-app.ts           # Express test app with supertest
├── unit/                     # Unit tests (Vitest, environment: node)
│   ├── schema-validators.test.ts   # Zod schema validation
│   ├── design-tokens.test.ts       # Design system tokens
│   ├── factories.test.ts           # Factory self-tests
│   └── mock-storage.test.ts        # MockStorage correctness
├── api/                      # API integration tests (Vitest, environment: node)
│   ├── auth.test.ts                # Signup, login, logout, session
│   ├── weddings.test.ts            # CRUD, multi-tenant, config
│   ├── rsvp.test.ts                # Create, list, update, delete, isolation
│   ├── gifts.test.ts               # CRUD, reservation, isolation
│   ├── contributions.test.ts       # Cagnotte, totals, Stripe webhooks
│   ├── jokes.test.ts               # Live jokes CRUD
│   ├── security.test.ts            # Auth, RBAC, XSS, sessions, rate limiting
│   ├── sse-live.test.ts            # SSE connection, broadcast, isolation
│   ├── permissions.test.ts         # Role-based access (owner/editor/viewer/admin)
│   └── preview-editing.test.ts     # Inline editing, template switch, media
├── component/                # React component tests (Vitest + jsdom)
│   └── (scaffolded for future use)
├── e2e/                      # E2E tests (Playwright, commented scaffolding)
│   ├── playwright.config.ts        # Playwright configuration
│   ├── auth.spec.ts                # Auth flow E2E
│   ├── preview.spec.ts             # Preview & inline editing E2E
│   └── README.md                   # E2E setup instructions
├── vitest.config.unit.ts     # Vitest config for unit tests
├── vitest.config.api.ts      # Vitest config for API tests
├── vitest.config.component.ts # Vitest config for component tests
└── TEST-STRATEGY.md          # This document
```

## npm Scripts

| Command | Description |
|---|---|
| `npm test` | Run unit + API tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:unit:watch` | Run unit tests in watch mode |
| `npm run test:api` | Run API integration tests only |
| `npm run test:api:watch` | Run API tests in watch mode |
| `npm run test:component` | Run component tests (React) |
| `npm run test:coverage` | Run all tests with coverage report |
| `npm run test:all` | Run unit + API + component tests |

## Test Categories & Coverage

### 1. Unit Tests (`tests/unit/`)

**Purpose**: Validate pure logic without side effects.

| File | Coverage | Cases |
|---|---|---|
| `schema-validators.test.ts` | Zod schemas (signup, login, RSVP, contribution, update) | 20+ cases |
| `design-tokens.test.ts` | Design system tokens, template tokens, getTokens() | 25+ cases |
| `factories.test.ts` | Test factory self-validation | 8 cases |
| `mock-storage.test.ts` | MockStorage correctness & isolation | 12 cases |

**What's tested**:
- All Zod validation schemas with happy path, edge cases, and error cases
- 3 template token configurations (classic, modern, minimal)
- Design system color, typography, spacing, and radius tokens
- Data factory uniqueness guarantees

### 2. API Integration Tests (`tests/api/`)

**Purpose**: Validate business logic through the storage layer AND through HTTP endpoints with real Express middleware.

#### HTTP-Level Tests (Supertest through Express middleware)

| File | Coverage | Cases |
|---|---|---|
| `http-auth.test.ts` | Signup, login, logout, session persistence via HTTP | 10 cases |
| `http-rbac.test.ts` | Auth enforcement, role-based access, multi-tenant isolation, tenant resolution via HTTP | 21 cases |
| `http-crud.test.ts` | RSVP, gifts, jokes, contributions, weddings CRUD via HTTP | 14 cases |

These tests exercise real Express middleware: session handling, passport authentication, tenant resolution (`x-wedding-slug`/`x-wedding-id` headers), `requireRole` guards, and HTTP status codes.

#### Storage-Level Tests (MockStorage directly)

| File | Coverage | Cases |
|---|---|---|
| `auth.test.ts` | User creation, email lookup, session serialization | 8 cases |
| `weddings.test.ts` | CRUD, slug lookup, ownership, membership, config | 15 cases |
| `rsvp.test.ts` | Create, list, update, delete, multi-tenant isolation | 12 cases |
| `gifts.test.ts` | CRUD, reservation, cross-wedding isolation | 10 cases |
| `contributions.test.ts` | Manual creation, filtering, totals, webhooks, subscriptions | 11 cases |
| `jokes.test.ts` | CRUD, next joke logic, multi-tenant | 7 cases |
| `security.test.ts` | Auth enforcement, RBAC, XSS, sessions, rate limits, idempotency | 16 cases |
| `sse-live.test.ts` | SSE connections, headers, broadcast, isolation, error handling | 11 cases |
| `permissions.test.ts` | Owner/editor/viewer/admin/stranger, premium gating | 14 cases |
| `preview-editing.test.ts` | Inline text/media editing, template switch, theme, navigation | 22 cases |

### 3. Security Tests (`tests/api/security.test.ts`)

| Area | Tests |
|---|---|
| Authentication | Session serialization, unauthenticated access |
| Authorization | Role checks (owner, editor, viewer, admin, stranger) |
| Multi-tenant | Data isolation per wedding |
| Input | XSS payload storage, SQL injection resistance |
| Session | httpOnly cookies, sameSite config, secret validation |
| Rate limiting | API and auth rate limit configuration |
| Stripe | Webhook idempotency (deduplication) |

### 4. SSE Live Tests (`tests/api/sse-live.test.ts`)

| Area | Tests |
|---|---|
| Connection | Registration, SSE headers, heartbeat |
| Lifecycle | Connection cleanup on client close |
| Broadcasting | Message delivery, wedding isolation |
| Format | SSE message format validation (event + data) |
| Errors | Graceful handling of write failures |
| Concurrency | Multiple connections per wedding |

### 5. Permission Tests (`tests/api/permissions.test.ts`)

| Role | Read | Edit | Admin | Stripe |
|---|---|---|---|---|
| Owner | YES | YES | YES | YES |
| Admin (global) | YES | YES | YES | YES |
| Editor | YES | YES | NO | NO |
| Viewer | YES | NO | NO | NO |
| Stranger | NO | NO | NO | NO |
| Unauthenticated | NO | NO | NO | NO |

### 6. Preview & Editing Tests (`tests/api/preview-editing.test.ts`)

| Area | Tests |
|---|---|
| Public access | Slug resolution, published vs draft |
| Text editing | heroTitle, heroSubtitle, rsvpTitle, atomic updates |
| Media editing | Hero image, couple photo, gallery images |
| Template switch | Classic/modern/minimal, content preservation |
| Theme | Primary color, button style, font family |
| Navigation | Page toggles, custom menu items, feature flags |
| Edge cases | Empty strings, unicode, emojis |

### 7. E2E Tests (`tests/e2e/`) — Scaffolded

| File | Scenarios |
|---|---|
| `auth.spec.ts` | Signup, login, logout, protected routes, session persistence |
| `preview.spec.ts` | Preview loading, inline editing, template switch, RSVP form |

**To activate**: Install Playwright (`npm i -D @playwright/test && npx playwright install chromium`), then uncomment the test blocks.

## Tools & Framework

| Tool | Purpose |
|---|---|
| **Vitest** | Test runner — unit, API, component tests |
| **Supertest** | HTTP request testing (Express) |
| **@testing-library/react** | React component testing (jsdom) |
| **@testing-library/jest-dom** | DOM assertion matchers |
| **Playwright** | E2E browser testing (scaffolded) |

## Test Execution Environment

- **Unit tests**: Run in Node.js, no DB required
- **API tests**: Run in Node.js with MockStorage (in-memory), no DB required
- **Component tests**: Run in jsdom, no browser required
- **E2E tests**: Require running app + Playwright browser

## Test Data Strategy

### Factories (`tests/helpers/factories.ts`)

| Factory | Purpose |
|---|---|
| `buildUser()` | User with unique email, auto-increment |
| `buildWedding(ownerId)` | Wedding with full config, unique slug |
| `buildWeddingConfig()` | Complete wedding config object |
| `buildRsvp(weddingId)` | RSVP response |
| `buildGift()` | Gift item |
| `buildContribution(weddingId)` | Contribution (default succeeded) |
| `buildLiveJoke()` | Live joke |
| `resetCounter()` | Reset auto-increment for test isolation |

### MockStorage (`tests/helpers/mock-storage.ts`)

In-memory implementation of `IStorage` interface. Provides:
- Full CRUD for all entities
- Multi-tenant isolation (weddingId scoping)
- Contribution totals and filtering
- Stripe webhook deduplication
- Subscription management
- `reset()` method for test cleanup

## Coverage Targets

| Layer | Target | Current |
|---|---|---|
| Unit (schemas) | > 90% | ~95% |
| API (storage) | > 80% | ~85% |
| Security | > 90% | ~90% |
| SSE | > 85% | ~85% |
| Permissions | > 95% | ~95% |
| E2E | > 60% | Scaffolded |
