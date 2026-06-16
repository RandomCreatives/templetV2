import { NextResponse } from 'next/server';
import { approveManualTransferOrder } from '@/lib/orders';

export async function PATCH(request: Request) {
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
