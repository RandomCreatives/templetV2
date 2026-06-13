import { NextResponse } from 'next/server';
import { getPhotographByCode, printSizes } from '@/lib/data';
import { getServerEnv, isConfiguredSecret } from '@/lib/env';
import { getClientIp, rateLimit, rateLimitHeaders } from '@/lib/rateLimit';

const ETHIOPIAN_PHONE_PATTERN = /^(?:\+251|251|0)(?:9|7)\d{8}$/;

type CheckoutRequest = {
  imageCode?: string;
  sizeId?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  locationDetails?: string;
};

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.shift() ?? '';
  const lastName = parts.join(' ') || firstName;
  return { firstName, lastName };
}

function normalizePhone(value: string) {
  return value.replace(/[\s-]/g, '');
}

export async function POST(request: Request) {
  const limit = rateLimit({ key: `checkout:${getClientIp(request)}`, limit: 20, windowMs: 60 * 60 * 1000 });

  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many checkout attempts. Try again later.' },
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  const env = getServerEnv();
  const body = (await request.json().catch(() => null)) as CheckoutRequest | null;

  const imageCode = body?.imageCode?.trim() ?? '';
  const sizeId = body?.sizeId?.trim() ?? '';
  const fullName = body?.fullName?.trim() ?? '';
  const email = body?.email?.trim().toLowerCase() ?? '';
  const phoneNumber = normalizePhone(body?.phoneNumber?.trim() ?? '');
  const locationDetails = body?.locationDetails?.trim() ?? '';

  if (!imageCode || !sizeId || !fullName || !email || !phoneNumber || !locationDetails) {
    return NextResponse.json({ ok: false, error: 'Missing required checkout or delivery fields.' }, { status: 400 });
  }

  if (!email.includes('@')) {
    return NextResponse.json({ ok: false, error: 'A valid email address is required.' }, { status: 400 });
  }

  if (!ETHIOPIAN_PHONE_PATTERN.test(phoneNumber)) {
    return NextResponse.json({ ok: false, error: 'Phone must use 09..., 07..., 251..., or +251... format.' }, { status: 400 });
  }

  if (locationDetails.length < 10) {
    return NextResponse.json({ ok: false, error: 'Delivery location details must include a local landmark or neighborhood.' }, { status: 400 });
  }

  const photo = await getPhotographByCode(imageCode);
  const size = printSizes.find((printSize) => printSize.id === sizeId);

  if (!photo || !photo.isPrintAvailable || !size) {
    return NextResponse.json({ ok: false, error: 'Print is unavailable.' }, { status: 404 });
  }

  if (!isConfiguredSecret(env.chapaSecretKey)) {
    return NextResponse.json({ ok: false, error: 'Chapa is not configured. Add CHAPA_SECRET_KEY.' }, { status: 503 });
  }

  const { firstName, lastName } = splitName(fullName);
  const txRef = `ET-MONO-${Date.now()}`;
  const amountBasedOnSize = Math.round(size.priceCents / 100);

  const raw = JSON.stringify({
    amount: amountBasedOnSize,
    currency: 'ETB',
    email,
    first_name: firstName,
    last_name: lastName,
    phone_number: phoneNumber,
    tx_ref: txRef,
    callback_url: `${env.siteUrl}/api/webhooks/payment`,
    return_url: `${env.siteUrl}/archive?status=success`,
    'customization[title]': 'EverydayThings Store',
    'customization[description]': 'Fine Art Monochrome Print Shop Order',
    'meta[imageCode]': imageCode,
    'meta[sizeId]': sizeId,
    'meta[delivery_address]': locationDetails,
    'meta[full_name]': fullName,
    'meta[phone_number]': phoneNumber,
    'meta[print_dimensions]': size.dimensions
  });

  const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.chapaSecretKey}`,
      'Content-Type': 'application/json'
    },
    body: raw,
    cache: 'no-store'
  });

  const payload = (await response.json().catch(() => null)) as { status?: string; message?: string; data?: { checkout_url?: string } } | null;
  const checkoutUrl = payload?.data?.checkout_url;

  if (!response.ok || !checkoutUrl) {
    return NextResponse.json(
      { ok: false, error: payload?.message ?? 'Unable to initialize Chapa checkout.' },
      { status: response.ok ? 502 : response.status }
    );
  }

  return NextResponse.json({ ok: true, mode: 'chapa', txRef, checkoutUrl });
}
