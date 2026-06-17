export type PaymentMode = 'CHAPA' | 'MANUAL';

type RuntimeEnv = {
  nodeEnv: 'development' | 'test' | 'production';
  siteUrl: string;
  isProduction: boolean;
  currency: string;
  paymentMode: PaymentMode;
  manualBankDetails: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  formspreeEndpoint?: string;
  resendApiKey?: string;
  contactToEmail?: string;
  adminUploadPassword?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
  supabaseArchiveBucket: string;
  supabaseReceiptsBucket: string;
  chapaSecretKey?: string;
  chapaWebhookSecret?: string;
};

function trim(value: string | undefined) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

function normalizeSiteUrl() {
  const explicit = trim(process.env.NEXT_PUBLIC_SITE_URL);
  if (explicit) return explicit.replace(/\/$/, '');

  const vercelUrl = trim(process.env.VERCEL_URL);
  if (vercelUrl) return `https://${vercelUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;

  return 'http://localhost:3000';
}

export function getServerEnv(): RuntimeEnv {
  const nodeEnv = process.env.NODE_ENV === 'production' ? 'production' : process.env.NODE_ENV === 'test' ? 'test' : 'development';

  return {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    siteUrl: normalizeSiteUrl(),
    currency: trim(process.env.NEXT_PUBLIC_CURRENCY)?.toLowerCase() ?? 'usd',
    paymentMode: process.env.NEXT_PUBLIC_PAYMENT_MODE === 'MANUAL' ? 'MANUAL' : 'CHAPA',
    manualBankDetails: trim(process.env.NEXT_PUBLIC_MANUAL_BANK_DETAILS) ?? 'Manual transfer details are not configured.',
    stripeSecretKey: trim(process.env.STRIPE_SECRET_KEY),
    stripeWebhookSecret: trim(process.env.STRIPE_WEBHOOK_SECRET),
    formspreeEndpoint: trim(process.env.FORMSPREE_ENDPOINT),
    resendApiKey: trim(process.env.RESEND_API_KEY),
    contactToEmail: trim(process.env.CONTACT_TO_EMAIL),
    adminUploadPassword: trim(process.env.ADMIN_UPLOAD_PASSWORD),
    supabaseUrl: trim(process.env.SUPABASE_URL) ?? trim(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: trim(process.env.SUPABASE_ANON_KEY) ?? trim(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRoleKey: trim(process.env.SUPABASE_SERVICE_ROLE_KEY),
    supabaseArchiveBucket: trim(process.env.SUPABASE_ARCHIVE_BUCKET) ?? 'archive',
    supabaseReceiptsBucket: trim(process.env.SUPABASE_RECEIPTS_BUCKET) ?? 'receipts',
    chapaSecretKey: trim(process.env.CHAPA_SECRET_KEY),
    chapaWebhookSecret: trim(process.env.CHAPA_WEBHOOK_SECRET)
  };
}

export function isConfiguredSecret(value: string | undefined, prefix?: string): value is string {
  if (!value) return false;
  if (value.includes('replace_me')) return false;
  if (value.includes('replace-with')) return false;
  if (prefix && !value.startsWith(prefix)) return false;
  return true;
}

export function hasSupabaseReadEnv(env = getServerEnv()) {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey && !env.supabaseAnonKey.includes('replace_me'));
}

export function hasSupabaseWriteEnv(env = getServerEnv()) {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey && !env.supabaseServiceRoleKey.includes('replace_me'));
}
