# Phase 5 Production Hardening Completion

## Supabase live data layer

Implemented:

- `@supabase/supabase-js`
- `lib/supabase.ts`
- async live fetch helpers in `lib/data.ts`

Live helpers now map PostgreSQL snake_case rows back to the established TypeScript interfaces:

- `getPhotographs()`
- `getProjects()`
- `getPhotographsByProject(projectId, options?)`
- `getProjectById(id)`
- `getPhotographByCode(imageCode)`

`getPhotographsByProject` no longer contains a hidden `.slice(0, 12)` cap. It returns the full project sequence unless an explicit pagination limit is passed.

If Supabase read variables are missing, the app gracefully falls back to `data/sampleData.ts` so builds and previews remain stable.

## Order persistence and local payment webhook

Added:

- `app/api/webhooks/payment/route.ts`
- `lib/orders.ts`

The payment webhook accepts Chapa/TeleBirr-style callbacks with:

- `tx_ref`
- `imageCode`
- `sizeId`
- `customerEmail`
- optional metadata

It verifies the transaction through Chapa when `CHAPA_SECRET_KEY` is configured, otherwise runs in mock verification mode. Successful payments are persisted into Supabase `orders` with:

- provider
- transaction reference
- image code
- size ID
- customer email
- amount
- currency
- payment status
- fulfillment state
- metadata

Stripe webhook persistence now also writes orders through the same shared persistence layer.

## Admin ingest panel

The upload panel now writes to live Supabase:

- browser extracts pixel dimensions and aspect ratio
- server action verifies the HTTP-only admin auth cookie
- image file uploads to Supabase Storage
- photograph row inserts into Supabase `photographs`

Added:

- `app/admin/upload/actions.ts`

The unsafe `Math.random()` image-code mechanism was removed. New image codes combine:

- archive prefix
- project/category initials
- sequence count
- timestamp hash

Example:

```text
AA-QMXX-000123-17A9BC02
```

## Project asset guard and LCP

Updated:

- `components/ProjectGrid.tsx`

Project cover images now:

- fallback to a muted gray CSS title block if the asset is missing or fails to load
- prioritize both first and second project covers for above-the-fold LCP stability

## Rate limiting

Updated:

- `lib/rateLimit.ts`
- `app/api/contact/route.ts`

Contact form now uses a rolling sliding-window limiter:

```text
3 messages / 5 minutes / IP
```

Breaches return semantic `429` JSON with rate-limit headers.

## Bundle and accessibility cleanup

- `sanity` moved from production `dependencies` to `devDependencies`
- `PrintDrawer` now has `role="dialog"`, `aria-modal="true"`, and a close button label
- checkout currency is read only through centralized `getServerEnv()`

## Supabase schema

Updated:

- `supabase/schema.sql`

Added:

- `orders` table
- order indexes
- service-role-only write model
- public archive storage bucket definition
- public read policy for archive storage objects

## Verification

Passed:

```bash
npm run typecheck
npm run audit:design
npm run build
```
