'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowser';
import { AdminDashboard } from './AdminDashboard';

type CreatorProfile = {
  id: string;
  full_name: string;
  primary_content_hub: string;
  contact_email: string;
  local_phone: string;
  creator_code: string;
  tier: string;
  status: string;
};

type GateStep = 'token' | 'credentials' | 'otp' | 'admin';

const CREATOR_CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function AdminGate() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<GateStep>('token');
  const [creatorCode, setCreatorCode] = useState('');
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpMethod, setOtpMethod] = useState<'email' | 'phone' | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setIsOpen(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const normalizedCode = useMemo(() => creatorCode.trim().toUpperCase(), [creatorCode]);

  function submitCreatorCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!CREATOR_CODE_PATTERN.test(normalizedCode)) {
      setError('Invalid creator code format. Use XXXX-XXXX-XXXX-XXXX.');
      return;
    }

    startTransition(async () => {
      const response = await fetch('/api/admin/creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorCode: normalizedCode })
      });
      const payload = (await response.json()) as { ok?: boolean; creator?: CreatorProfile; error?: string };

      if (!response.ok || !payload.ok || !payload.creator) {
        setError(payload.error ?? 'Creator code denied.');
        return;
      }

      setCreator(payload.creator);
      setEmail(payload.creator.contact_email);
      setStep('credentials');
    });
  }

  function submitCredentials(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!creator || email.trim().toLowerCase() !== creator.contact_email.toLowerCase()) {
      setError('Email does not match the creator profile.');
      return;
    }

    startTransition(async () => {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });

      if (authError) {
        setError(authError.message);
        return;
      }

      setStep('otp');
      setNotice('Password accepted. Select final verification channel.');
    });
  }

  function sendOtp(method: 'email' | 'phone') {
    if (!creator) return;
    setError(null);
    setNotice(null);
    setOtpMethod(method);

    startTransition(async () => {
      const supabase = getSupabaseBrowserClient();

      if (method === 'email') {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: creator.contact_email,
          options: { shouldCreateUser: false }
        });
        if (otpError) {
          setError(otpError.message);
          return;
        }
        setNotice('Email verification code sent.');
        return;
      }

      const { data: factors } = await supabase.auth.mfa.listFactors();
      const phoneFactor = [...(factors?.phone ?? []), ...(factors?.totp ?? [])].find(Boolean);

      if (phoneFactor) {
        const { error: challengeError } = await supabase.auth.mfa.challenge({ factorId: phoneFactor.id });
        if (challengeError) {
          setError(challengeError.message);
          return;
        }
        setNotice('MFA challenge sent to registered phone factor.');
        return;
      }

      const { error: phoneOtpError } = await supabase.auth.signInWithOtp({ phone: creator.local_phone, options: { shouldCreateUser: false } });
      if (phoneOtpError) {
        setError(phoneOtpError.message);
        return;
      }
      setNotice('SMS verification code sent.');
    });
  }

  function verifyPin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!creator || !otpMethod || !/^\d{6}$/.test(pin)) {
      setError('Enter the 6-digit verification PIN.');
      return;
    }

    startTransition(async () => {
      const supabase = getSupabaseBrowserClient();
      const { error: verifyError } =
        otpMethod === 'email'
          ? await supabase.auth.verifyOtp({ email: creator.contact_email, token: pin, type: 'email' })
          : await supabase.auth.verifyOtp({ phone: creator.local_phone, token: pin, type: 'sms' });

      if (verifyError) {
        setError(verifyError.message);
        return;
      }

      setStep('admin');
      setNotice(null);
    });
  }

  if (step === 'admin' && creator) {
    return <AdminDashboard creatorName={creator.full_name} />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-2 left-2 z-40 font-mono text-[9px] uppercase tracking-[0.12em] text-gray-400 hover:text-black"
        aria-label="Open creator admin gate"
      >
        [ • ]
      </button>

      {isOpen ? (
        <aside className="fixed bottom-0 right-0 z-50 h-[82dvh] w-full border-t border-black bg-white p-4 font-mono text-[11px] uppercase tracking-[0.08em] md:top-0 md:h-dvh md:max-w-[420px] md:border-l md:border-t-0" role="dialog" aria-modal="true" aria-label="Creator admin authentication gate">
          <div className="mb-6 flex items-center justify-between border-b border-black pb-3">
            <p>CREATOR 3FA GATE</p>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close creator admin gate">[ CLOSE ]</button>
          </div>

          {step === 'token' ? (
            <form onSubmit={submitCreatorCode} className="grid gap-3">
              <label className="grid gap-1 text-gray-600">
                ENTER 16-DIGIT CREATOR CODE
                <input value={creatorCode} onChange={(event) => setCreatorCode(event.target.value.toUpperCase())} placeholder="ETMM-BOLE-7F82-K9P1" className="border border-black bg-white p-3 text-black outline-none" />
              </label>
              <button disabled={isPending} className="bg-black px-4 py-3 text-white disabled:bg-gray-500">[ VERIFY TOKEN ]</button>
            </form>
          ) : null}

          {step === 'credentials' ? (
            <form onSubmit={submitCredentials} className="grid gap-3">
              <p className="text-gray-600">TOKEN ACCEPTED / {creator?.primary_content_hub}</p>
              <label className="grid gap-1 text-gray-600">
                REGISTERED EMAIL
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="border border-black bg-white p-3 text-black outline-none" />
              </label>
              <label className="grid gap-1 text-gray-600">
                PASSWORD
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" className="border border-black bg-white p-3 text-black outline-none" />
              </label>
              <button disabled={isPending} className="bg-black px-4 py-3 text-white disabled:bg-gray-500">[ CHECK CREDENTIALS ]</button>
            </form>
          ) : null}

          {step === 'otp' ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => sendOtp('phone')} className="border border-black px-3 py-3">[ SEND TO PHONE ]</button>
                <button type="button" onClick={() => sendOtp('email')} className="border border-black px-3 py-3">[ SEND TO EMAIL ]</button>
              </div>
              <form onSubmit={verifyPin} className="grid gap-3">
                <label className="grid gap-1 text-gray-600">
                  6-DIGIT PIN
                  <input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" className="border border-black bg-white p-4 text-center text-2xl tracking-[0.3em] text-black outline-none" />
                </label>
                <button disabled={isPending || !otpMethod} className="bg-black px-4 py-3 text-white disabled:bg-gray-500">[ ENTER DASHBOARD ]</button>
              </form>
            </div>
          ) : null}

          {notice ? <p className="mt-4 text-gray-600">{notice}</p> : null}
          {error ? <p className="mt-4 text-gray-700">[ DENIED ] {error}</p> : null}
        </aside>
      ) : null}
    </>
  );
}
