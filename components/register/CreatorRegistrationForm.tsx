'use client';

import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { registerCreator, setCreatorPassword } from '@/app/register/actions';

type Step = 'form' | 'code' | 'password' | 'done';

type CreatorInfo = {
  creatorCode: string;
  fullName: string;
  contentHub: string;
  email: string;
  phone: string;
};

const PASSWORD_MIN = 8;

export function CreatorRegistrationForm() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>('form');
  const [creator, setCreator] = useState<CreatorInfo | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Password step state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ── Step 1: Registration form ────────────────────────────────
  function submitRegistration(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await registerCreator(formData);
      if (!result.ok) { setError(result.error); return; }
      setCreator(result);
      setStep('code');
      formRef.current?.reset();
    });
  }

  // ── Step 2: Copy code, then go to password ───────────────────
  async function copyCode() {
    if (!creator) return;
    await navigator.clipboard.writeText(creator.creatorCode);
    setCopyNotice('Copied.');
  }

  // ── Step 3: Set password ─────────────────────────────────────
  function submitPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password.length < PASSWORD_MIN) {
      setError(`Password must be at least ${PASSWORD_MIN} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    startTransition(async () => {
      const result = await setCreatorPassword(creator!.email, password, creator!.creatorCode);
      if (!result.ok) { setError(result.error); return; }
      setStep('done');
    });
  }

  // ── RENDER ───────────────────────────────────────────────────

  if (step === 'form') {
    return (
      <form ref={formRef} onSubmit={submitRegistration} className="grid gap-4 font-mono text-[11px] uppercase tracking-[0.08em]">
        <label className="grid gap-1 text-gray-600">
          FULL NAME / STUDIO IDENTITY
          <input name="fullName" className="border border-black bg-white p-3 text-black outline-none focus:ring-1 focus:ring-black" required minLength={2} />
        </label>
        <label className="grid gap-1 text-gray-600">
          PRIMARY CONTENT HUB
          <input name="contentHub" className="border border-black bg-white p-3 text-black outline-none focus:ring-1 focus:ring-black" placeholder="BOLE / KAZANCHIS / OLD AIRPORT" required minLength={2} />
        </label>
        <label className="grid gap-1 text-gray-600">
          CONTACT EMAIL ADDRESS
          <input name="email" type="email" className="border border-black bg-white p-3 text-black outline-none focus:ring-1 focus:ring-black" required />
        </label>
        <label className="grid gap-1 text-gray-600">
          VERIFIED LOCAL PHONE NUMBER
          <input name="phone" type="tel" className="border border-black bg-white p-3 text-black outline-none focus:ring-1 focus:ring-black" placeholder="09..., 07..., +251..." required />
        </label>
        <button type="submit" disabled={isPending} className="mt-2 w-fit bg-black px-5 py-3 text-white disabled:bg-gray-400">
          {isPending ? '[ GENERATING CODE ]' : '[ REGISTER CREATOR ]'}
        </button>
        {error && <p className="text-[10px] text-gray-700">[ ERROR ] {error}</p>}
      </form>
    );
  }

  if (step === 'code') {
    return (
      <div className="grid gap-5 font-mono text-[11px] uppercase tracking-[0.08em]">
        <p className="text-[10px] leading-relaxed text-gray-600">
          Registration successful. Save this Creator Code — you will need it every time you log in.
        </p>

        {/* Creator Code display */}
        <div className="border border-black bg-black p-5 text-center text-white">
          <p className="mb-2 text-[9px] text-gray-400">CREATOR CODE</p>
          <p className="text-xl tracking-[0.18em] md:text-2xl">{creator?.creatorCode}</p>
        </div>

        {/* Creator details */}
        <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-gray-600">
          <dt>IDENTITY</dt><dd className="text-black">{creator?.fullName}</dd>
          <dt>HUB</dt><dd>{creator?.contentHub}</dd>
          <dt>EMAIL</dt><dd>{creator?.email}</dd>
          <dt>PHONE</dt><dd>{creator?.phone}</dd>
        </dl>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={copyCode}
            className="border border-black px-5 py-3 text-black hover:bg-black hover:text-white transition-colors"
          >
            [ COPY CODE ]
          </button>
          <button
            type="button"
            onClick={() => { setStep('password'); setError(null); }}
            className="bg-black px-5 py-3 text-white hover:bg-white hover:text-black border border-black transition-colors"
          >
            [ NEXT — SET UP PASSWORD ] →
          </button>
        </div>
        {copyNotice && <p className="text-[10px] text-gray-500">{copyNotice}</p>}
      </div>
    );
  }

  if (step === 'password') {
    return (
      <form onSubmit={submitPassword} className="grid gap-4 font-mono text-[11px] uppercase tracking-[0.08em]">
        {/* Reminder of who this is for */}
        <div className="border border-black bg-black p-4 text-white">
          <p className="mb-1 text-[9px] text-gray-400">SETTING UP PASSWORD FOR</p>
          <p className="tracking-[0.12em]">{creator?.fullName}</p>
          <p className="mt-1 text-[9px] text-gray-400">{creator?.email}</p>
        </div>

        <p className="text-[10px] leading-relaxed text-gray-500">
          Choose a password for your creator account. You will use your Creator Code + email + this password to log in.
        </p>

        <label className="grid gap-1 text-gray-600">
          PASSWORD
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={PASSWORD_MIN}
            required
            className="border border-black bg-white p-3 text-black outline-none focus:ring-1 focus:ring-black"
          />
          <span className="text-[9px] text-gray-400">MINIMUM {PASSWORD_MIN} CHARACTERS</span>
        </label>

        <label className="grid gap-1 text-gray-600">
          CONFIRM PASSWORD
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            className="border border-black bg-white p-3 text-black outline-none focus:ring-1 focus:ring-black"
          />
        </label>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setStep('code'); setError(null); }}
            className="border border-black px-4 py-3 text-black hover:bg-black hover:text-white transition-colors"
          >
            ← BACK
          </button>
          <button
            type="submit"
            disabled={isPending || password.length < PASSWORD_MIN}
            className="flex-1 bg-black px-5 py-3 text-white disabled:bg-gray-400 border border-black hover:bg-white hover:text-black transition-colors"
          >
            {isPending ? '[ CREATING ACCOUNT ]' : '[ CREATE ACCOUNT ]'}
          </button>
        </div>

        {error && <p className="text-[10px] text-gray-700">[ ERROR ] {error}</p>}
      </form>
    );
  }

  // done
  return (
    <div className="grid gap-5 font-mono text-[11px] uppercase tracking-[0.08em]">
      <div className="border border-black bg-black p-5 text-center text-white">
        <p className="mb-2 text-[9px] text-gray-400">ACCOUNT CREATED</p>
        <p className="text-[13px] tracking-[0.16em]">{creator?.fullName}</p>
        <p className="mt-2 text-[9px] text-gray-400">{creator?.creatorCode}</p>
      </div>
      <p className="text-[10px] leading-relaxed text-gray-600">
        Your creator account is ready. Use your Creator Code, email, and password to log in.
      </p>
      <Link
        href="/login"
        className="w-full border border-black bg-black px-4 py-3 text-center text-white transition-colors hover:bg-white hover:text-black"
      >
        [ GO TO LOGIN ]
      </Link>
    </div>
  );
}
