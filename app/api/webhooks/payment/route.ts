import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getServerEnv, isConfiguredSecret } from '@/lib/env';
import { persistOrder } from '@/lib/orders';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {};
}

function stringValue(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function readMeta(payload: UnknownRecord) {
  const data = asRecord(payload.data);
  const nestedMeta = asRecord(data.meta);
  const rootMeta = asRecord(payload.meta);
  const metadata = asRecord(payload.metadata);

  return {
    ...metadata,
    ...rootMeta,
    ...nestedMeta,
    imageCode: stringValue(nestedMeta.imageCode) || stringValue(rootMeta.imageCode) || stringValue(metadata.imageCode) || stringValue(payload.imageCode),
    sizeId: stringValue(nestedMeta.sizeId) || stringValue(rootMeta.sizeId) || stringValue(metadata.sizeId) || stringValue(payload.sizeId),
    deliveryAddress:
      stringValue(nestedMeta.delivery_address) || stringValue(rootMeta.delivery_address) || stringValue(metadata.delivery_address) || stringValue(payload.delivery_address),
    fullName: stringValue(nestedMeta.full_name) || stringValue(rootMeta.full_name) || stringValue(metadata.full_name) || stringValue(payload.full_name),
    phoneNumber: stringValue(nestedMeta.phone_number) || stringValue(rootMeta.phone_number) || stringValue(metadata.phone_number) || stringValue(payload.phone_number),
    printDimensions:
      stringValue(nestedMeta.print_dimensions) || stringValue(rootMeta.print_dimensions) || stringValue(metadata.print_dimensions) || stringValue(payload.print_dimensions)
  };
}

function verifySignature(rawBody: string, headerSignature: string | null, secret: string) {
  if (!headerSignature) return false;

  const expectedHex = createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBase64 = createHmac('sha256', secret).update(rawBody).digest('base64');
  const supplied = headerSignature.replace(/^sha256=/i, '').trim();

  const candidates = [expectedHex, expectedBase64];

  return candidates.some((candidate) => {
    const suppliedBuffer = Buffer.from(supplied);
    const candidateBuffer = Buffer.from(candidate);
    return suppliedBuffer.length === candidateBuffer.length && timingSafeEqual(suppliedBuffer, candidateBuffer);
  });
}

export async function POST(request: Request) {
  const env = getServerEnv();

  if (!isConfiguredSecret(env.chapaWebhookSecret)) {
    return NextResponse.json({ ok: false, error: 'Chapa webhook secret is not configured.' }, { status: 500 });
  }

  const rawBody = await request.text();
  const headerSignature = request.headers.get('x-chapa-signature');

  if (!verifySignature(rawBody, headerSignature, env.chapaWebhookSecret)) {
    return NextResponse.json({ ok: false, error: 'Invalid Chapa webhook signature.' }, { status: 401 });
  }

  let payload: UnknownRecord;

  try {
    payload = JSON.parse(rawBody) as UnknownRecord;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid Chapa webhook payload.' }, { status: 400 });
  }

  const data = asRecord(payload.data);
  const status = stringValue(payload.status) || stringValue(data.status);

  if (status !== 'success') {
    return NextResponse.json({ ok: true, ignored: true, status });
  }

  const meta = readMeta(payload);
  const txRef = stringValue(payload.tx_ref) || stringValue(data.tx_ref);
  const imageCode = stringValue(meta.imageCode);
  const sizeId = stringValue(meta.sizeId);
  const customerEmail = stringValue(payload.email) || stringValue(data.email);
  const customerName = stringValue(meta.fullName) || `${stringValue(payload.first_name) || stringValue(data.first_name)} ${stringValue(payload.last_name) || stringValue(data.last_name)}`.trim();
  const customerPhone = stringValue(meta.phoneNumber) || stringValue(payload.phone_number) || stringValue(data.phone_number);
  const deliveryAddress = stringValue(meta.deliveryAddress);
  const amountEtb = Number(stringValue(payload.amount) || stringValue(data.amount));

  if (!txRef || !imageCode || !sizeId || !customerEmail || !customerName || !customerPhone || !deliveryAddress || !Number.isFinite(amountEtb)) {
    return NextResponse.json({ ok: false, error: 'Verified webhook is missing required fulfillment metadata.' }, { status: 400 });
  }

  const result = await persistOrder({
    txRef,
    provider: 'chapa_telebirr',
    imageCode,
    sizeId,
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    amountEtb,
    metadata: { chapa: payload, printDimensions: meta.printDimensions }
  });

  return NextResponse.json({ ok: true, persisted: result.mode });
}
