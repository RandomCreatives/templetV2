'use server';

import { randomBytes } from 'node:crypto';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

type RegisterCreatorResult =
  | {
      ok: true;
      creatorCode: string;
      fullName: string;
      contentHub: string;
      email: string;
      phone: string;
    }
  | { ok: false; error: string };

type SetPasswordResult =
  | { ok: true }
  | { ok: false; error: string };

const ETHIOPIAN_PHONE_PATTERN = /^(?:\+251|251|0)(?:9|7)\d{8}$/;
const ALPHANUMERIC = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function normalizePhone(value: string) {
  return value.replace(/[\s-]/g, '');
}

function normalizeHubCode(value: string) {
  const letters = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return (letters || 'HUBX').slice(0, 4).padEnd(4, 'X');
}

function randomBlock(length = 4) {
  const bytes = randomBytes(length);
  let output = '';
  for (const byte of bytes) {
    output += ALPHANUMERIC[byte % ALPHANUMERIC.length];
  }
  return output;
}

async function createUniqueCreatorCode(hubCode: string) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error('Supabase service role is not configured.');

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const token = `ETMM-${hubCode}-${randomBlock()}-${randomBlock()}`;
    const { data, error } = await supabase.from('creators').select('id').eq('creator_code', token).maybeSingle();
    if (error) throw new Error(`Creator code lookup failed: ${error.message}`);
    if (!data) return token;
  }
  throw new Error('Unable to generate a unique creator code. Try again.');
}

export async function registerCreator(formData: FormData): Promise<RegisterCreatorResult> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, error: 'Creator registration is unavailable until Supabase service credentials are configured.' };
  }

  const fullName = String(formData.get('fullName') ?? '').trim();
  const contentHub = String(formData.get('contentHub') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const phone = normalizePhone(String(formData.get('phone') ?? '').trim());

  if (fullName.length < 2 || fullName.length > 160)
    return { ok: false, error: 'Full name / studio identity must be between 2 and 160 characters.' };
  if (contentHub.length < 2 || contentHub.length > 120)
    return { ok: false, error: 'Primary content hub must be between 2 and 120 characters.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, error: 'Enter a valid contact email address.' };
  if (!ETHIOPIAN_PHONE_PATTERN.test(phone))
    return { ok: false, error: 'Phone must use 09..., 07..., 251..., or +251... format.' };

  try {
    const hubCode = normalizeHubCode(contentHub);
    const creatorCode = await createUniqueCreatorCode(hubCode);

    const { error } = await supabase.from('creators').insert({
      full_name: fullName,
      primary_content_hub: contentHub,
      contact_email: email,
      local_phone: phone,
      creator_code: creatorCode,
      tier: 'tier_1',
      status: 'pending_verification'
    });

    if (error) {
      if (error.code === '23505')
        return { ok: false, error: 'A creator with this email, phone, or code already exists.' };
      return { ok: false, error: `Creator registration failed: ${error.message}` };
    }

    return { ok: true, creatorCode, fullName, contentHub, email, phone };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Creator registration failed.' };
  }
}

// Step 2: create Supabase Auth account and link to creator record
export async function setCreatorPassword(
  email: string,
  password: string,
  creatorCode: string
): Promise<SetPasswordResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return { ok: false, error: 'Auth service is not configured.' };
  }

  // Use service role client to create the auth user
  const adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error: signUpError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email confirmation — creator is already verified
    user_metadata: { creator_code: creatorCode }
  });

  if (signUpError) {
    if (signUpError.message.includes('already registered'))
      return { ok: false, error: 'An account with this email already exists. Go to login.' };
    return { ok: false, error: `Account creation failed: ${signUpError.message}` };
  }

  // Update creator record status to active
  const supabase = getSupabaseServiceClient();
  if (supabase && data.user) {
    await supabase
      .from('creators')
      .update({ status: 'active' })
      .eq('contact_email', email);
  }

  return { ok: true };
}
