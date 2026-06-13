# Phase 6 & 7 Completion Notes

## Live Supabase-only data layer

`lib/data.ts` no longer imports or falls back to `data/sampleData.ts` for portfolio content. Live reads are provided by Supabase through:

- `getPhotographs()`
- `getProjects()`
- `getPhotographsByProject(projectId, options?)`
- `getProjectById(id)`
- `getPhotographByCode(imageCode)`

PostgreSQL rows are mapped from snake_case back into the established `Photograph` and `Project` TypeScript interfaces.

No hidden `.slice(0, 12)` truncation exists in project image fetching.

## Checkout drawer

`components/PrintDrawer.tsx` now collects mandatory delivery data before payment:

- Full name
- Email address
- Ethiopian phone number: `09...`, `07...`, `251...`, or `+251...`
- Addis Ababa delivery/location details

The drawer renders the required delivery commitment notice above the final payment action.

## Chapa ETB checkout

`app/api/checkout/route.ts` now initializes Chapa checkout directly:

- Server-side amount calculation from `sizeId`
- Currency forced to `ETB`
- `tx_ref` format: `ET-MONO-${Date.now()}`
- Chapa field mapping: `first_name`, `last_name`, `email`, `phone_number`
- Metadata persisted through Chapa using `meta[...]` keys
- Returns `data.checkout_url` to the drawer

## HMAC-verified payment webhook

`app/api/webhooks/payment/route.ts` now:

- reads the raw request body text
- reads `x-chapa-signature`
- computes HMAC SHA256 using `CHAPA_WEBHOOK_SECRET`
- compares signatures with timing-safe equality
- rejects invalid signatures with `401`
- only fulfills `status === "success"`

## PDF receipts

`lib/orders.ts` now generates minimalist monochrome PDF receipts with `pdfkit`, including:

- `tx_ref`
- buyer information
- phone and delivery details
- image code
- print size/specification
- ETB amount paid
- 10-working-day delivery note

Receipts are uploaded to the private Supabase `receipts` bucket and a signed receipt URL is attached to order notification emails.

## Supabase orders schema

`supabase/schema.sql` now includes production order fields:

- customer name/email/phone
- delivery address
- print dimensions
- ETB amount
- payment status
- fulfillment status
- receipt URL
- metadata

## Verification

Passed with no TypeScript or build warnings:

```bash
npm run verify
```
