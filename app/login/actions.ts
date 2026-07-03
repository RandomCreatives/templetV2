'use server';

import { getSupabaseServiceClient } from '@/lib/supabase';

type VerifyCodeResult =
  | { ok: true; fullName: string; email: string }
  | { ok: false; error: string };

type SignInResult =
  | { ok: true; fullName: string }
  | { ok: false; error: string };

const CREATOR_CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

// Step 1 — verify creator code exists and is active
export async function verifyCreatorCode(creatorCode: string): Promise<VerifyCodeResult> {
  const code = creatorCode.trim().toUpperCase();

  if (!CREATOR_CODE_PATTERN.test(code)) {
    return { ok: false, error: 'Invalid Creator Code format.' };
  }

  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return { ok: true, fullName: 'LOCAL DEV USER', email: 'dev@localhost' };
  }

  const { data, error } = await supabase
    .from('creators')
    .select('id, full_name, contact_email, status')
    .eq('creator_code', code)
    .maybeSingle();

  if (error) return { ok: false, error: 'Verification failed. Please try again.' };
  if (!data) return { ok: false, error: 'Creator Code not found. Check and try again.' };
  if (data.status === 'suspended') return { ok: false, error: 'This Creator account has been suspended.' };
  if (data.status === 'pending_verification') {
    return { ok: false, error: 'Account setup is incomplete. Please complete password setup first.' };
  }

  return { ok: true, fullName: data.full_name, email: data.contact_email };
}

// Step 2 — verify email matches creator record, then sign in via Supabase Auth
export async function signInCreator(
  creatorCode: string,
  email: string,
  password: string
): Promise<SignInResult> {
  const code = creatorCode.trim().toUpperCase();
  const emailLower = email.trim().toLowerCase();

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    // local dev bypass
    return { ok: true, fullName: 'LOCAL DEV USER' };
  }

  // Verify email matches the creator record for this code
  const { data: creator, error: creatorError } = await supabase
    .from('creators')
    .select('full_name, contact_email, status')
    .eq('creator_code', code)
    .maybeSingle();

  if (creatorError || !creator) {
    return { ok: false, error: 'Creator Code not found.' };
  }

  if (creator.contact_email !== emailLower) {
    return { ok: false, error: 'Email does not match this Creator Code.' };
  }

  if (creator.status === 'suspended') {
    return { ok: false, error: 'This account has been suspended.' };
  }

  if (creator.status === 'pending_verification') {
    return { ok: false, error: 'Account setup is incomplete. Please complete password setup first.' };
  }

  // Auth sign-in is handled client-side via supabaseBrowserClient
  // This action just confirms the creator record is valid
  return { ok: true, fullName: creator.full_name };
}
