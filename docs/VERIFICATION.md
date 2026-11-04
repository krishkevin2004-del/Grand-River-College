# Verification

## Checked in the local build

- Clean dependency install from the included npm lockfile on Node.js 24
- Seven automated tests for policy citations, late dining, dated closures, event revisions, hall and police placeholders, keyword escalation, and data integrity
- Standalone TypeScript check and optimized Next.js production build
- Local production server returned the homepage and handbook PDF
- Live HTTP requests returned cited housing, dining, and event answers, hall lookup, and escalation. An oversized request returned HTTP 413.

## Still environment-dependent

Vercel preview, custom domain, optional BotID, and paid Claude mode require a new project or provider configuration. The provider mode was left off for local verification. No hosted database is required for the default build. The default engine recognizes a limited range of question patterns and uses keyword-based safety routing.
