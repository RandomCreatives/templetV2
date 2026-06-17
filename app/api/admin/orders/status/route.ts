import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '@/lib/adminAuth';

export async function PATCH(request: Request) {
  if (!await verifyAdminSession()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as { orderId?: unknown; status?: unknown } | null;
  const orderId = typeof payload?.orderId === 'string' ? payload.orderId : '';
  const status = typeof payload?.status === 'string' ? payload.status : '';

  if (!orderId || !status) {
    return NextResponse.json({ ok: false, error: 'Missing orderId or status.' }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase service is not configured.' }, { status: 503 });

  const { data, error } = await supabase
    .from('orders')
    .update({ fulfillment_status: status })
    .eq('id', orderId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, order: data });
}
