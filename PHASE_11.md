# Phase 11 Completion Notes

## Payment mode environment matrix

Added to `lib/env.ts`:

```text
NEXT_PUBLIC_PAYMENT_MODE=CHAPA | MANUAL
NEXT_PUBLIC_MANUAL_BANK_DETAILS=...
```

The checkout drawer reads the public payment mode at runtime and switches behavior without changing the archive layout.

## Chapa mode

When `NEXT_PUBLIC_PAYMENT_MODE=CHAPA`, the existing automated checkout flow remains active:

- buyer delivery details are collected
- `/api/checkout` initializes Chapa
- buyer is redirected to Chapa checkout
- HMAC webhook handles fulfillment

## Manual mode

When `NEXT_PUBLIC_PAYMENT_MODE=MANUAL`, the drawer does not call Chapa. Instead it progresses to a manual transfer card showing:

- pre-wrapped local bank details
- required transfer reference / number input
- required transfer receipt screenshot upload

Submissions post to:

```text
/api/checkout/manual-route
```

## Manual order persistence

Manual route behavior:

- uploads receipt screenshot to Supabase Storage bucket `transfer_receipts`
- inserts an `orders` row with provider `manual_transfer`
- stores payment status `unpaid_verify_transfer`
- stores reference and screenshot URL in `metadata`

## Admin dashboard manual verification

`components/AdminDashboard.tsx` now detects manual orders and renders:

```text
[ AWAITING VERIFICATION ]
REFERENCE: ...
[ INSPECT TRANSFER SCREENSHOT ]
[ APPROVE & CONFIRM RECEIPT ]
```

Approving a manual transfer calls:

```text
/api/admin/orders/approve-manual
```

The approval flow:

- updates payment status to `paid`
- resets fulfillment to `pending`
- generates the PDFKit receipt
- stores the PDF receipt in Supabase
- triggers the same order confirmation email flow

## Supabase schema updates

Added storage bucket and policies:

```text
transfer_receipts
```

The bucket is public-readable so creators can inspect buyer-uploaded payment screenshots from the dashboard.

## Verification

Passed:

```bash
npm run verify
```
