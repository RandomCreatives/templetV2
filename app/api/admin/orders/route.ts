import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';

export async function GET() {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase service is not configured.' }, { status: 503 });

  const { data, error } = await supabase
    .from('orders')
    .select('id, tx_ref, provider, customer_name, customer_email, customer_phone, delivery_address, size_id, image_code, amount_etb, payment_status, fulfillment_status, receipt_url, metadata, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, orders: data });
}
