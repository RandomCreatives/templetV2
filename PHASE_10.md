# Phase 10 Completion Notes

## Isolated 3FA creator admin gate

Added:

```text
components/AdminGate.tsx
```

Mounted only on:

```text
/archive
```

The gate is hidden by default and can be opened via:

```text
Ctrl + Shift + A
```

A small low-contrast `[ • ]` toggle is also available in the lower-left corner of the archive view.

## 3FA validation pipeline

### Step 1 — Creator Code

- Input label: `ENTER 16-DIGIT CREATOR CODE`
- Enforces `XXXX-XXXX-XXXX-XXXX`
- Looks up the creator in Supabase `creators`
- Caches the creator profile context for the next steps

API route:

```text
/api/admin/creator
```

### Step 2 — Email + Password

- Requires the email to match the creator profile
- Uses `supabase.auth.signInWithPassword()` in the browser client

### Step 3 — Omnichannel 2FA

Renders two actions:

```text
[ SEND TO PHONE ]
[ SEND TO EMAIL ]
```

- Phone path attempts Supabase MFA challenge first, then SMS OTP fallback
- Email path uses `supabase.auth.signInWithOtp()`
- 6-digit PIN entry verifies via Supabase auth
- Successful verification opens the dashboard state

## Creator business dashboard

Added:

```text
components/AdminDashboard.tsx
```

The dashboard is conditionally rendered only after `isAdmin` state is reached in the gate.

## Dashboard Section A — Upload New Asset

- Drag/drop phone file uploader
- Title input
- Dynamic project dropdown from live `projects`
- Uploads binary directly to Supabase `portfolio` storage bucket
- Inserts a new `photographs` row through `/api/admin/photographs`
- New assets immediately become available to the public masonry wall

## Dashboard Section B — Paid Customers Ledger

API:

```text
/api/admin/orders
/api/admin/orders/status
```

Displays:

- Customer name
- Ethiopian phone number
- Delivery address / landmark
- Size ID
- Image code
- Order timestamp

Includes inline status toggle:

```text
[ PENDING ] <-> [ DELIVERED ]
```

## Dashboard Section C — Items Sold Analytics

API:

```text
/api/admin/analytics
```

Displays:

- Total revenue in ETB
- Total print volume sold
- Top 3 ordered image codes

## Supabase schema updates

Updated:

```text
supabase/schema.sql
```

Added:

- `creators` table
- creator indexes
- `portfolio` storage bucket
- public read policy for portfolio assets
- authenticated portfolio upload policy

## Verification

Passed:

```bash
npm run verify
```
