# Heisen SchoolOS

Heisen SchoolOS (Heisen School Management System) is a multi-school operating system for Ghanaian basic schools, built on Next.js App Router, React, TypeScript, Neon PostgreSQL, Drizzle ORM and Neon Auth.

## Architecture

- **Next.js 16 App Router** with Server Components by default.
- **Neon PostgreSQL + Drizzle ORM** for relational school data.
- **Neon Auth** for staff and student authentication.
- **Zod** for server-side input validation.
- **Lucide React** for interface icons.
- School tenancy is derived from the authenticated user's active membership; client-supplied `schoolId` values are not trusted for authorization.
- Existing academic/result/report-card architecture is retained and extended rather than duplicated.

## Environment

Copy `.env.example` to `.env.local` and provide:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
NEON_AUTH_BASE_URL=https://YOUR-NEON-AUTH-URL
NEXT_PUBLIC_NEON_AUTH_URL=https://YOUR-NEON-AUTH-URL
NEON_AUTH_COOKIE_SECRET=at-least-32-random-characters
```

Enable Neon Auth for the Neon project before starting the application.

## Install

```bash
npm install
```

The current development environment used for this repository could not reach the npm registry, so dependency installation and the final production verification must be run in an environment with registry access.

## Database

The repository contains the existing migration history plus:

```text
dizzle/018_platform_foundation.sql
```

Apply the platform foundation migration with:

```bash
npm run db:migrate:platform
```

Apply the staff invitation migration after the existing migrations with:

```bash
npm run db:migrate:staff-invitations
```

It adds school settings, profiles, documents, student status history, fee assignments, scholarships, timetable infrastructure, communications, notifications, audit logs, promotion decisions and import history, and extends student records and membership roles.

### Payments

`drizzle/020_payment_integration_foundation.sql` adds school-scoped payment
intents and provider transactions. The provider boundary is in
`src/lib/payments/provider.ts`; it defaults to a non-confirming manual adapter.
For local/staging tests only, set `PAYMENT_PROVIDER=mock` (never use this in
production). Create intents with `POST /api/payments/intents`, verify or
reconcile them with `POST /api/payments/verify` or
`POST /api/payments/reconcile`, and read status or receipts from the
corresponding `/api/payments/:intentId` and `/api/payments/receipts/:paymentId`
endpoints. Real provider credentials and API calls must be implemented inside a
dedicated adapter; none are stored or required by this foundation.

## Development

```bash
npm run dev
```

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

or:

```bash
npm run verify
```

## Assessment weighting

Assessment **maximum raw score** and **assessment weight** are separate concepts.

Example:

```text
Class Test
Maximum Score: 50
Weight: 50%

Examination
Maximum Score: 100
Weight: 50%
```

A student scoring 35/50 in the class test receives 70%, and its 50% weight contributes 35 points to the final result.

The configuration validator requires the sum of all component weights to equal exactly 100%. It does not force a 50/50 class-test/examination split. Therefore valid configurations include 50/50, 40/60, 60/40 and 100/0.

Raw scores must satisfy:

```text
0 <= raw score <= maximum raw score
```

## Multi-tenancy and authorization

School-scoped operations use the authenticated user's active membership. Reusable helpers are in:

```text
src/lib/authorization.ts
src/lib/current-school.ts
src/lib/tenant.ts
```

Sensitive operations should use `requireRole()`/`requireTeacherScope()` before touching school data and should write an audit event through `writeAuditLog()`.

## Authentication bootstrap

Neon Auth must have an initial administrator account configured in the Neon Auth project. Staff records in the application database are linked to their Neon Auth identity by normalized email. The application then resolves the local school membership and role server-side. Administrators provision staff with an expiring invitation link; the raw token is never stored and previous invitations for the same school/email are invalidated.

Neon Auth's built-in two-factor routes are available at `/auth/two-factor`. Administrators can configure an authenticator app and recovery codes from the school administration page. Mandatory platform-level enforcement depends on the enabled Neon Auth provider configuration.

Student activation verifies the one-time hashed activation code, creates the Neon Auth email/password account, activates the local student account and records an audit event. The raw activation code is never stored.

## Current implementation areas

The repository already contains substantial working implementations for:

- academic years and terms
- class levels and streams
- subjects and class subjects
- teacher assignments
- student admission and guardians
- enrollment and placement
- attendance
- assessment periods and assessments
- score entry
- configurable grading
- result lifecycle and publication
- report cards and print layouts
- student activation
- fee structures, invoices and payments

The platform layer adds:

- secure school-context resolution
- expanded school roles
- audit logging
- school settings
- documents
- scholarships and fee assignments
- timetable periods, rooms and conflict constraints
- announcements, notifications and messages
- promotion decision history
- validated CSV student import infrastructure
- global school-scoped search API
- administration dashboard and staff access workflow
- invitation-based staff onboarding with hashed, expiring, single-use tokens
- cross-school membership management for platform super administrators
- centralized school-context resolution and permission-based authorization

## Important production checks

Before production deployment:

1. Configure Neon Auth and its production cookie secret.
2. Apply all migrations in order against a staging database first.
3. Create the first platform/school administrator in Neon Auth and map the account to a local school membership.
4. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build`.
5. Exercise cross-school authorization tests using two separate school memberships.
6. Verify report-card printing on an actual A4 browser print/PDF workflow.
7. Configure an object-storage provider for document `storageKey` records before enabling uploads.
8. Configure transactional email for password recovery and student activation communications.
9. Configure transactional email for staff invitation links and verify invitation expiry/revocation behavior.
10. Enable and test Neon Auth two-factor authentication for platform administrators.
