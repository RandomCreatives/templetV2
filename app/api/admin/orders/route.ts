import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '@/lib/adminAuth';

export async function GET() {
  if (!await verifyAdminSession()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase service is not configured.' }, { status: 503 });

  const { data, error } = await supabase
    .from('orders')
    .select('id, tx_ref, provider, customer_name, customer_email, customer_phone, delivery_address, size_id, image_code, amount_etb, payment_status, fulfillment_status, receipt_url, metadata, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // For manual transfers, we need to generate signed URLs for the screenshots
  const orders = await Promise.all((data || []).map(async (order) => {
    if (order.provider === 'manual_transfer' && order.metadata?.transferReceiptPath) {
      const { data: signed } = await supabase.storage
        .from('transfer_receipts')
        .createSignedUrl(order.metadata.transferReceiptPath as string, 3600);

      return {
        ...order,
        metadata: {
          ...order.metadata,
          transferReceiptUrl: signed?.signedUrl ?? order.metadata.transferReceiptUrl
        }
      };
    }
    return order;
  }));

  return NextResponse.json({ ok: true, orders });
}
