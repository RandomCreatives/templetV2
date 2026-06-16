import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';

const CREATOR_CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { creatorCode?: unknown } | null;
  const creatorCode = typeof payload?.creatorCode === 'string' ? payload.creatorCode.trim().toUpperCase() : '';

  if (!CREATOR_CODE_PATTERN.test(creatorCode)) {
    return NextResponse.json({ ok: false, error: 'Invalid creator code format.' }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase service is not configured.' }, { status: 503 });

  const { data, error } = await supabase
    .from('creators')
    .select('id, full_name, primary_content_hub, contact_email, local_phone, creator_code, tier, status')
    .eq('creator_code', creatorCode)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: 'Creator code not found.' }, { status: 404 });

  return NextResponse.json({ ok: true, creator: data });
}
