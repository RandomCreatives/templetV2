'use client';

import { useRef, useState, useTransition } from 'react';
import { registerCreator } from '@/app/register/actions';

type SuccessState = {
  creatorCode: string;
  fullName: string;
  contentHub: string;
  email: string;
  phone: string;
};

export function CreatorRegistrationForm() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCopyNotice(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await registerCreator(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSuccess(result);
      formRef.current?.reset();
    });
  }

  async function copyCode() {
    if (!success) return;
    await navigator.clipboard.writeText(success.creatorCode);
    setCopyNotice('Creator Code copied.');
  }

  if (success) {
    return (
      <div className="font-mono text-[11px] uppercase tracking-[0.08em]">
        <p className="mb-4 leading-relaxed text-gray-600">
          Registration successful. Save this Creator Code. It is required for all future login verification actions.
        </p>
        <div className="mb-4 border border-black bg-black p-5 text-center text-white">
          <p className="mb-2 text-[10px] text-gray-300">CREATOR CODE</p>
          <p className="text-xl tracking-[0.18em] md:text-2xl">{success.creatorCode}</p>
        </div>
        <dl className="mb-5 grid grid-cols-[140px_1fr] gap-y-2 text-gray-700">
          <dt>IDENTITY</dt>
          <dd className="text-black">{success.fullName}</dd>
          <dt>HUB</dt>
          <dd>{success.contentHub}</dd>
          <dt>EMAIL</dt>
          <dd>{success.email}</dd>
          <dt>PHONE</dt>
          <dd>{success.phone}</dd>
        </dl>
        <button type="button" onClick={copyCode} className="bg-black px-5 py-3 text-white">
          [ COPY CREATOR CODE ]
        </button>
        {copyNotice ? <p className="mt-3 text-gray-600">{copyNotice}</p> : null}
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} className="grid gap-4 font-mono text-[11px] uppercase tracking-[0.08em]">
      <label className="grid gap-1 text-gray-600">
        FULL NAME / STUDIO IDENTITY
        <input name="fullName" className="border border-black bg-white p-3 text-black outline-none" required minLength={2} />
      </label>
      <label className="grid gap-1 text-gray-600">
        PRIMARY CONTENT HUB
        <input name="contentHub" className="border border-black bg-white p-3 text-black outline-none" placeholder="BOLE / KAZANCHIS / OLD AIRPORT" required minLength={2} />
      </label>
      <label className="grid gap-1 text-gray-600">
        CONTACT EMAIL ADDRESS
        <input name="email" className="border border-black bg-white p-3 text-black outline-none" type="email" required />
      </label>
      <label className="grid gap-1 text-gray-600">
        VERIFIED LOCAL PHONE NUMBER
        <input name="phone" className="border border-black bg-white p-3 text-black outline-none" type="tel" placeholder="09..., 07..., +251..." required />
      </label>
      <button type="submit" disabled={isPending} className="mt-2 w-fit bg-black px-5 py-3 text-white disabled:bg-gray-500">
        {isPending ? '[ GENERATING CODE ]' : '[ REGISTER CREATOR ]'}
      </button>
      {error ? <p className="text-gray-700">[ ERROR ] {error}</p> : null}
    </form>
  );
}
