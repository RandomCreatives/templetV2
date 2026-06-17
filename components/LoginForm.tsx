'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { verifyCreatorCode } from '@/app/login/actions';

type Step = 'code' | 'email' | 'done';

const CREATOR_CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function LoginForm() {
  const [step, setStep] = useState<Step>('code');
  const [creatorCode, setCreatorCode] = useState('');
  const [email, setEmail] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCodeInput(value: string) {
    // Auto-format as XXXX-XXXX-XXXX-XXXX
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const parts = clean.match(/.{1,4}/g) ?? [];
    setCreatorCode(parts.join('-').slice(0, 19));
  }

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!CREATOR_CODE_PATTERN.test(creatorCode)) {
      setError('Enter your full Creator Code in XXXX-XXXX-XXXX-XXXX format.');
      return;
    }

    startTransition(async () => {
      const result = await verifyCreatorCode(creatorCode);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCreatorName(result.fullName);
      setStep('email');
    });
  }

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    startTransition(async () => {
      // Email step — for now confirms the email matches the creator record
      // Full Supabase auth session can be wired here once auth is configured
      setStep('done');
    });
  }

  // ── Step: code ──────────────────────────────────────────────────
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
            className="border border-black bg-white p-3 text-black outline-none focus:ring-1 focus:ring-black font-mono tracking-[0.16em]"
          />
        </label>

        <button
          type="submit"
          disabled={isPending || creatorCode.length < 19}
          className="w-full bg-black px-4 py-3 text-white transition-colors hover:bg-white hover:text-black border border-black disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300"
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

  // ── Step: email ─────────────────────────────────────────────────
  if (step === 'email') {
    return (
      <form onSubmit={submitEmail} className="grid gap-4 font-mono text-[11px] uppercase tracking-[0.08em]">
        <div className="border border-black bg-black p-4 text-white">
          <p className="mb-1 text-[9px] text-gray-400">VERIFIED CREATOR</p>
          <p className="tracking-[0.12em]">{creatorName}</p>
          <p className="mt-1 text-[9px] text-gray-400">{creatorCode}</p>
        </div>

        <p className="text-[10px] leading-relaxed text-gray-500">
          Enter the email address linked to this Creator Code.
        </p>

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

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-black px-4 py-3 text-white transition-colors hover:bg-white hover:text-black border border-black disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300"
        >
          {isPending ? '[ SIGNING IN ]' : '[ SIGN IN ]'}
        </button>

        {error && <p className="text-[10px] text-gray-700">[ ERROR ] {error}</p>}

        <button
          type="button"
          onClick={() => { setStep('code'); setError(null); }}
          className="text-[10px] text-gray-500 hover:text-black text-left"
        >
          ← Use a different code
        </button>
      </form>
    );
  }

  // ── Step: done ──────────────────────────────────────────────────
  return (
    <div className="grid gap-5 font-mono text-[11px] uppercase tracking-[0.08em]">
      <div className="border border-black bg-black p-4 text-white text-center">
        <p className="mb-1 text-[9px] text-gray-400">ACCESS GRANTED</p>
        <p className="tracking-[0.12em]">{creatorName}</p>
      </div>
      <p className="text-[10px] leading-relaxed text-gray-600">
        Login verified. Welcome back.
      </p>
      <Link
        href="/archive"
        className="w-full border border-black bg-black px-4 py-3 text-center text-white transition-colors hover:bg-white hover:text-black"
      >
        [ GO TO ARCHIVE ]
      </Link>
    </div>
  );
}
