'use server';

import { getSupabaseServiceClient } from '@/lib/supabase';

type VerifyResult =
  | { ok: true; fullName: string; email: string }
  | { ok: false; error: string };

const CREATOR_CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export async function verifyCreatorCode(creatorCode: string): Promise<VerifyResult> {
  const code = creatorCode.trim().toUpperCase();

  if (!CREATOR_CODE_PATTERN.test(code)) {
    return { ok: false, error: 'Invalid Creator Code format.' };
  }

  const supabase = getSupabaseServiceClient();

  // If Supabase is not configured (local dev), allow any well-formed code
  if (!supabase) {
    return { ok: true, fullName: 'LOCAL DEV USER', email: 'dev@localhost' };
  }

  const { data, error } = await supabase
    .from('creators')
    .select('id, full_name, contact_email, status')
    .eq('creator_code', code)
    .maybeSingle();

  if (error) {
    return { ok: false, error: 'Verification failed. Please try again.' };
  }

  if (!data) {
    return { ok: false, error: 'Creator Code not found. Check the code and try again.' };
  }

  if (data.status === 'suspended') {
    return { ok: false, error: 'This Creator account has been suspended.' };
  }

  return { ok: true, fullName: data.full_name, email: data.contact_email };
}
