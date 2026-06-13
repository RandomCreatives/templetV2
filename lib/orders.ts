import { printSizes } from './data';
import { getServerEnv, isConfiguredSecret } from './env';
import { getSupabaseServiceClient, type OrderInsert } from './supabase';

type ConfirmationEmailInput = {
  txRef: string;
  imageCode: string;
  sizeId: string;
  customerEmail?: string | null;
  amountCents: number;
  currency: string;
};

export async function sendOrderConfirmationEmail(input: ConfirmationEmailInput) {
  const env = getServerEnv();
  const recipient = env.contactToEmail;

  if (!recipient || !isConfiguredSecret(env.resendApiKey, 're_')) {
    console.log('ORDER_CONFIRMATION_EMAIL_STUB', input);
    return { ok: true, mode: 'stub' as const };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Portfolio Orders <onboarding@resend.dev>',
      to: [recipient],
      reply_to: input.customerEmail ?? recipient,
      subject: `Pending print shipment — ${input.imageCode}`,
      text: [
        'A new print order is ready for fulfillment.',
        '',
        `Transaction: ${input.txRef}`,
        `Image code: ${input.imageCode}`,
        `Size: ${input.sizeId}`,
        `Customer email: ${input.customerEmail ?? 'not supplied'}`,
        `Amount: ${(input.amountCents / 100).toFixed(2)} ${input.currency.toUpperCase()}`
      ].join('\n')
    })
  });

  if (!response.ok) throw new Error('Unable to send order confirmation email.');
  return { ok: true, mode: 'resend' as const };
}

export async function persistOrder(input: {
  txRef: string;
  provider: string;
  imageCode: string;
  sizeId: string;
  customerEmail?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const env = getServerEnv();
  const supabase = getSupabaseServiceClient();
  const size = printSizes.find((item) => item.id === input.sizeId);
  const amountCents = size?.priceCents ?? 0;

  const order: OrderInsert = {
    tx_ref: input.txRef,
    provider: input.provider,
    image_code: input.imageCode,
    size_id: input.sizeId,
    customer_email: input.customerEmail ?? null,
    amount_cents: amountCents,
    currency: env.currency,
    fulfillment_state: 'pending_print_shipment',
    payment_status: 'paid',
    metadata: input.metadata ?? {}
  };

  if (!supabase) {
    console.log('ORDER_PERSISTENCE_STUB', order);
    await sendOrderConfirmationEmail({
      txRef: input.txRef,
      imageCode: input.imageCode,
      sizeId: input.sizeId,
      customerEmail: input.customerEmail,
      amountCents,
      currency: env.currency
    });
    return { ok: true, mode: 'stub' as const, order };
  }

  const { data, error } = await supabase.from('orders').insert(order).select('*').single();

  if (error) throw new Error(`Unable to persist order: ${error.message}`);

  await sendOrderConfirmationEmail({
    txRef: input.txRef,
    imageCode: input.imageCode,
    sizeId: input.sizeId,
    customerEmail: input.customerEmail,
    amountCents,
    currency: env.currency
  });

  return { ok: true, mode: 'supabase' as const, order: data };
}
