# Vercel & Supabase Deployment Checklist

## 1. Required Build Settings (Vercel)

- Framework Preset: `Next.js`
- Node.js Version: `20.x` or newer
- Install Command: `npm install`
- Build Command: `npm run build`

## 2. Environment Variables

Configure these in **Vercel Project → Settings → Environment Variables**.

### 2.1 Core Application
- `NEXT_PUBLIC_SITE_URL`: Your production URL. Falls back to `VERCEL_URL` if omitted.
- `ADMIN_UPLOAD_PASSWORD`: Secure password for `/admin/upload`.

### 2.2 Payment & Currency
- `NEXT_PUBLIC_CURRENCY`: e.g., `etb`
- `NEXT_PUBLIC_PAYMENT_MODE`: `CHAPA` or `MANUAL`
- `NEXT_PUBLIC_MANUAL_BANK_DETAILS`: Bank info for manual transfers.

### 2.3 Supabase (Marketplace Integration Recommended)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ARCHIVE_BUCKET`: `archive`
- `SUPABASE_RECEIPTS_BUCKET`: `receipts`

> **Note**: For optimal performance, ensure your Vercel Project Region matches your Supabase Project Region (e.g., `us-east-1` or `eu-central-1`).

### 2.4 External Gateways
- **Stripe**: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Chapa**: `CHAPA_SECRET_KEY`, `CHAPA_WEBHOOK_SECRET`
- **Resend**: `RESEND_API_KEY`, `CONTACT_TO_EMAIL`

## 3. Marketplace Integration
Vercel offers an official **Supabase Integration**. Enabling this in the Vercel Dashboard will:
1. Automatically link your projects.
2. Synchronize environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, etc.).
3. Provide a direct link to the Supabase dashboard from Vercel.

## 4. Observability
The application is pre-configured with:
- **Vercel Analytics**: Track page views and unique visitors.
- **Speed Insights**: Monitor Web Vitals and performance in real-time.

Enable these in the **Vercel Dashboard → Analytics / Speed Insights** tabs.

## 5. Security & Infrastructure
- **CSP**: `vercel.json` enforces a strict Content Security Policy.
- **HSTS**: Standard on all Vercel deployments.
- **Edge Config**: API routes are optimized for standard Node.js runtime but can be opted into Edge via `export const runtime = 'edge'` if lower latency is required for global users.

## 6. Pre-flight Check
Before pushing to production, run:
```bash
npm run verify
```
This runs type-checking, the monochrome design audit, and a production build.
