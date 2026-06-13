# Phase 4 Completion Notes

## Scope implemented

Phase 4 focused on launch polish beyond deployment hardening:

- SEO and social metadata
- Search crawler files
- Structured data
- Health diagnostics
- API abuse protection
- Accessibility affordances
- Automated design audit
- Final verification script

## SEO and metadata

Added:

- `app/robots.ts`
- `app/sitemap.ts`
- `app/opengraph-image.tsx`
- `components/StructuredData.tsx`

The app now generates:

- `/robots.txt`
- `/sitemap.xml`
- `/opengraph-image`
- JSON-LD structured data for the archive, projects, and sample photographs

## Accessibility

Updated:

- `app/layout.tsx`

Added a visible-on-focus skip link:

```text
[ SKIP TO CONTENT ]
```

This preserves the monochrome archival design while improving keyboard navigation.

## API protection

Added:

- `lib/rateLimit.ts`

Rate limiting is now applied to:

- `/api/contact` — 5 submissions / hour / IP
- `/api/checkout` — 20 attempts / hour / IP
- `/api/admin/upload-auth` — 8 unlock attempts / hour / IP

The limiter returns clean JSON with `429` and rate-limit headers.

## Health diagnostics

Added:

- `app/api/health/route.ts`

Returns a lightweight JSON status containing:

- environment
- resolved site URL
- photograph/project counts
- integration status for Stripe, contact delivery, and admin upload

## Automated audit

Added:

- `scripts/design-audit.mjs`

Updated `package.json` scripts:

```bash
npm run audit:design
npm run verify
```

`npm run verify` executes:

```bash
npm run typecheck && npm run audit:design && npm run build
```

The design audit checks that:

- no non-monochrome Tailwind color palettes are used
- image-rendering files include context-menu prevention

## Final verification

Passed successfully:

```bash
npm run verify
```

Current generated routes include:

```text
/
/archive
/projects
/projects/[id]
/about
/admin/upload
/api/admin/upload-auth
/api/checkout
/api/contact
/api/health
/api/webhooks/stripe
/opengraph-image
/robots.txt
/sitemap.xml
```
