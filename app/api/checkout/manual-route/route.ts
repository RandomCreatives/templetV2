import { NextResponse } from 'next/server';
import { getPhotographByCode, printSizes } from '@/lib/data';
import { getSupabaseServiceClient } from '@/lib/supabase';

const ETHIOPIAN_PHONE_PATTERN = /^(?:\+251|251|0)(?:9|7)\d{8}$/;

// Simple in-memory rate limiting for manual transfer route
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 5;

function checkRateLimit(ip: string) {
  const now = Date.now();
  const limit = rateLimits.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + LIMIT_WINDOW_MS });
    return true;
  }

  if (limit.count >= MAX_REQUESTS_PER_WINDOW) return false;

  limit.count++;
  return true;
}

function normalizePhone(value: string) {
  return value.replace(/[\s-]/g, '');
}

function cleanFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '') || 'transfer-receipt.jpg';
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ ok: false, error: 'Too many requests. Please try again in an hour.' }, { status: 429 });
  }

  const formData = await request.formData();
  const imageCode = String(formData.get('imageCode') ?? '').trim();
  const sizeId = String(formData.get('sizeId') ?? '').trim();
  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const phoneNumber = normalizePhone(String(formData.get('phoneNumber') ?? '').trim());
  const locationDetails = String(formData.get('locationDetails') ?? '').trim();
  const transferReference = String(formData.get('transferReference') ?? '').trim();
  const receiptFile = formData.get('receiptFile');

  if (!imageCode || !sizeId || !fullName || !email || !phoneNumber || !locationDetails || !transferReference) {
    return NextResponse.json({ ok: false, error: 'Missing required manual transfer fields.' }, { status: 400 });
  }

  if (!email.includes('@')) return NextResponse.json({ ok: false, error: 'A valid email is required.' }, { status: 400 });
  if (!ETHIOPIAN_PHONE_PATTERN.test(phoneNumber)) return NextResponse.json({ ok: false, error: 'Invalid Ethiopian phone format.' }, { status: 400 });
  if (!(receiptFile instanceof File) || receiptFile.size === 0 || !receiptFile.type.startsWith('image/')) {
    return NextResponse.json({ ok: false, error: 'A transfer receipt screenshot image is required.' }, { status: 400 });
  }

  const [photo] = await Promise.all([getPhotographByCode(imageCode)]);
  const size = printSizes.find((item) => item.id === sizeId);
  if (!photo || !photo.isPrintAvailable || !size) return NextResponse.json({ ok: false, error: 'Print is unavailable.' }, { status: 404 });

  const supabase = getSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase service is not configured.' }, { status: 503 });

  const txRef = `MANUAL-${Date.now()}`;
  const objectPath = `${txRef}/${cleanFileName(receiptFile.name)}`;
  const { error: uploadError } = await supabase.storage.from('transfer_receipts').upload(objectPath, receiptFile, {
    contentType: receiptFile.type,
    upsert: false
  });

  if (uploadError) return NextResponse.json({ ok: false, error: `Transfer receipt upload failed: ${uploadError.message}` }, { status: 500 });

  const { data: publicReceipt } = supabase.storage.from('transfer_receipts').getPublicUrl(objectPath);
  const amountEtb = Math.round(size.priceCents / 100);

  const { data, error } = await supabase
    .from('orders')
    .insert({
      tx_ref: txRef,
      provider: 'manual_transfer',
      image_code: imageCode,
      size_id: sizeId,
      print_dimensions: size.dimensions,
      customer_name: fullName,
      customer_email: email,
      customer_phone: phoneNumber,
      delivery_address: locationDetails,
      amount_etb: amountEtb,
      currency: 'ETB',
      payment_status: 'unpaid_verify_transfer',
      fulfillment_status: 'unpaid_verify_transfer',
      receipt_url: null,
      metadata: {
        orderType: 'manual_transfer',
        transferReference,
        transferReceiptUrl: publicReceipt.publicUrl,
        transferReceiptPath: objectPath
      }
    })
    .select('id, tx_ref')
    .single();

  if (error) return NextResponse.json({ ok: false, error: `Manual order insert failed: ${error.message}` }, { status: 500 });

  return NextResponse.json({ ok: true, mode: 'manual', txRef: data.tx_ref, orderId: data.id });
}
