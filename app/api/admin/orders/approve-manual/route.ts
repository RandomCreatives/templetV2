import { NextResponse } from 'next/server';
import { approveManualTransferOrder } from '@/lib/orders';
import { verifyAdminSession } from '@/lib/adminAuth';

export async function PATCH(request: Request) {
  if (!await verifyAdminSession()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as { orderId?: unknown } | null;
  const orderId = typeof payload?.orderId === 'string' ? payload.orderId : '';

  if (!orderId) return NextResponse.json({ ok: false, error: 'Missing orderId.' }, { status: 400 });

  try {
    const order = await approveManualTransferOrder(orderId);
    return NextResponse.json({ ok: true, order });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Manual approval failed.' }, { status: 500 });
  }
}
