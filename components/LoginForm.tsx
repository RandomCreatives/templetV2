'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { signInCreator, verifyCreatorCode } from '@/app/login/actions';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowser';

type Step = 'code' | 'password' | 'done';

const CREATOR_CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('code');
  const [creatorCode, setCreatorCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCodeInput(value: string) {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const parts = clean.match(/.{1,4}/g) ?? [];
    setCreatorCode(parts.join('-').slice(0, 19));
  }

  // ── Step 1: verify creator code ─────────────────────────────
  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!CREATOR_CODE_PATTERN.test(creatorCode)) {
      setError('Enter your full Creator Code in XXXX-XXXX-XXXX-XXXX format.');
      return;
    }

    startTransition(async () => {
      const result = await verifyCreatorCode(creatorCode);
      if (!result.ok) { setError(result.error); return; }
      setCreatorName(result.fullName);
      setEmail(result.email); // pre-fill email from record
      setStep('password');
    });
  }

  // ── Step 2: email + password sign-in ────────────────────────
  function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.includes('@')) { setError('Enter a valid email address.'); return; }
    if (password.length < 6) { setError('Password is too short.'); return; }

    startTransition(async () => {
      // Server: confirm email matches creator code record
      const verify = await signInCreator(creatorCode, email, password);
      if (!verify.ok) { setError(verify.error); return; }

      // Client: actual Supabase Auth sign-in
      try {
        const supabase = getSupabaseBrowserClient();
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
          setError(authError.message === 'Invalid login credentials'
            ? 'Incorrect email or password.'
            : authError.message);
          return;
        }

        setStep('done');
        setTimeout(() => router.push('/dashboard'), 800);
      } catch {
        // Supabase not configured — dev mode, just redirect
        setStep('done');
        setTimeout(() => router.push('/dashboard'), 800);
      }
    });
  }

  // ── Step: code ───────────────────────────────────────────────
  if (step === 'code') {
    return (
      <form onSubmit={submitCode} className="grid gap-4 font-mono text-[11px] uppercase tracking-[0.08em]">
        <p className="text-[10px] leading-relaxed text-gray-500">
          Enter the 16-character Creator Code you received on registration.
        </p>

        <label className="grid gap-1 text-gray-600">
          CREATOR CODE
          <input
            value={creatorCode}
            onChange={(e) => handleCodeInput(e.target.value)}
            placeholder="ETMM-XXXX-XXXX-XXXX"
            maxLength={19}
            autoComplete="off"
            spellCheck={false}
            required
            className="border border-black bg-white p-3 font-mono tracking-[0.16em] text-black outline-none focus:ring-1 focus:ring-black"
          />
        </label>

        <button
          type="submit"
          disabled={isPending || creatorCode.length < 19}
          className="w-full border border-black bg-black px-4 py-3 text-white transition-colors hover:bg-white hover:text-black disabled:border-gray-300 disabled:bg-gray-300 disabled:text-gray-500"
        >
          {isPending ? '[ VERIFYING CODE ]' : '[ CONTINUE ]'}
        </button>

        {error && <p className="text-[10px] text-gray-700">[ ERROR ] {error}</p>}

        <p className="text-[10px] text-gray-500">
          No code?{' '}
          <Link href="/register" className="text-black underline hover:text-gray-500">
            Register here
          </Link>
        </p>
      </form>
    );
  }

  // ── Step: password ───────────────────────────────────────────
  if (step === 'password') {
    return (
      <form onSubmit={submitPassword} className="grid gap-4 font-mono text-[11px] uppercase tracking-[0.08em]">
        {/* Verified creator banner */}
        <div className="border border-black bg-black p-4 text-white">
          <p className="mb-1 text-[9px] text-gray-400">VERIFIED CREATOR</p>
          <p className="tracking-[0.12em]">{creatorName}</p>
          <p className="mt-1 text-[9px] text-gray-400">{creatorCode}</p>
        </div>

        <label className="grid gap-1 text-gray-600">
          EMAIL ADDRESS
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="border border-black bg-white p-3 text-black outline-none focus:ring-1 focus:ring-black"
          />
        </label>

        <label className="grid gap-1 text-gray-600">
          PASSWORD
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="border border-black bg-white p-3 text-black outline-none focus:ring-1 focus:ring-black"
          />
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="w-full border border-black bg-black px-4 py-3 text-white transition-colors hover:bg-white hover:text-black disabled:border-gray-300 disabled:bg-gray-300 disabled:text-gray-500"
        >
          {isPending ? '[ SIGNING IN ]' : '[ SIGN IN ]'}
        </button>

        {error && <p className="text-[10px] text-gray-700">[ ERROR ] {error}</p>}

        <button
          type="button"
          onClick={() => { setStep('code'); setError(null); setPassword(''); }}
          className="text-left text-[10px] text-gray-500 hover:text-black"
        >
          ← Use a different code
        </button>
      </form>
    );
  }

  // ── Step: done ───────────────────────────────────────────────
  return (
    <div className="grid gap-5 font-mono text-[11px] uppercase tracking-[0.08em]">
      <div className="border border-black bg-black p-4 text-center text-white">
        <p className="mb-1 text-[9px] text-gray-400">ACCESS GRANTED</p>
        <p className="tracking-[0.12em]">{creatorName}</p>
      </div>
      <p className="text-[10px] text-gray-500">Redirecting to your dashboard...</p>
    </div>
  );
}
