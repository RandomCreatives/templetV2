# Vercel Deployment Checklist

## Required build settings

- Framework Preset: `Next.js`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: leave empty / Next.js default
- Node.js Version: 20.x or newer

## Required environment variables

Paste these into **Vercel Project → Settings → Environment Variables**.

### Application URL

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

If omitted, the app falls back to `https://${VERCEL_URL}` automatically.

### Admin upload gate

```bash
ADMIN_UPLOAD_PASSWORD=use-a-long-random-password
```

Required to access `/admin/upload`. If omitted, the route is disabled and only shows a locked notice.

### Currency and payment mode

```bash
NEXT_PUBLIC_CURRENCY=etb
NEXT_PUBLIC_PAYMENT_MODE=CHAPA # or MANUAL
NEXT_PUBLIC_MANUAL_BANK_DETAILS="Commercial Bank of Ethiopia\nAccount: 1000XXXXXXXXX\nName: Creator Name"
```

### Stripe checkout fallback

```bash
STRIPE_SECRET_KEY=sk_live_or_sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

If `STRIPE_SECRET_KEY` is omitted, `/api/checkout` returns a controlled Sandbox/Test Mode response instead of throwing a production 500.

### Contact form delivery

Use one provider.

#### Option A — Formspree

```bash
FORMSPREE_ENDPOINT=https://formspree.io/f/your_form_id
```

#### Option B — Resend

```bash
RESEND_API_KEY=re_...
CONTACT_TO_EMAIL=studio@example.com
```

If neither provider is configured, the API validates the payload and logs the inquiry server-side for development.

### Supabase live database + storage

Required for production data fetching, live admin ingestion, and order persistence:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ARCHIVE_BUCKET=archive
SUPABASE_RECEIPTS_BUCKET=receipts
```

Run `supabase/schema.sql` in the Supabase SQL editor before launch.

### Chapa / TeleBirr payment webhook

```bash
CHAPA_SECRET_KEY=...
CHAPA_WEBHOOK_SECRET=...
CHAPA_VERIFY_BASE_URL=https://api.chapa.co/v1/transaction/verify
```

Webhook URL:

```text
https://your-domain.com/api/webhooks/payment
```

### Optional Sanity development variables

Only needed if editing the optional Sanity schemas locally:

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=...
```

## Stripe webhook

Create a Stripe webhook endpoint:

```text
https://your-domain.com/api/webhooks/stripe
```

Subscribe to:

```text
checkout.session.completed
```

Paste the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Security headers

`vercel.json` sets:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Content-Security-Policy`
- immutable cache headers for `/images/*`

## Pre-deployment commands

Run locally before pushing:

```bash
npm run typecheck
npm run build
```

Both commands should complete successfully.
