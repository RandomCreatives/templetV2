import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '@/lib/adminAuth';

export async function GET() {
  if (!await verifyAdminSession()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase service is not configured.' }, { status: 503 });

  const { data, error } = await supabase.from('orders').select('image_code, amount_etb, payment_status');
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const paid = (data || []).filter((order) => order.payment_status === 'paid');
  const totalRevenue = paid.reduce((sum, order) => sum + Number(order.amount_etb ?? 0), 0);
  const counts = new Map<string, number>();

  paid.forEach((order) => counts.set(order.image_code, (counts.get(order.image_code) ?? 0) + 1));

  const topAssets = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([imageCode, count]) => ({ imageCode, count }));

  return NextResponse.json({ ok: true, analytics: { totalRevenue, volume: paid.length, topAssets } });
}
