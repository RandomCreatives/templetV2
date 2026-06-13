'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { printSizes } from '@/lib/data';
import { DRAWER_IMAGE_SIZES, MUTED_GRAY_BLUR_DATA_URL } from '@/lib/image';
import { usePrintDrawer } from './PrintDrawerProvider';

const ETHIOPIAN_PHONE_PATTERN = /^(?:\+251|251|0)(?:9|7)\d{8}$/;

function normalizePhone(value: string) {
  return value.replace(/[\s-]/g, '');
}

export function PrintDrawer() {
  const { selectedPhoto, closePrintDrawer } = usePrintDrawer();
  const [sizeId, setSizeId] = useState(printSizes[1]?.id ?? 'medium');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSize = printSizes.find((size) => size.id === sizeId) ?? printSizes[0];
  const isPhoneValid = useMemo(() => ETHIOPIAN_PHONE_PATTERN.test(normalizePhone(phoneNumber)), [phoneNumber]);
  const canSubmit = Boolean(
    selectedPhoto &&
      selectedSize &&
      fullName.trim().length >= 2 &&
      email.includes('@') &&
      isPhoneValid &&
      locationDetails.trim().length >= 10
  );

  async function proceedToCheckout() {
    if (!selectedPhoto || !selectedSize) return;

    if (!canSubmit) {
      setError('Complete all delivery fields. Phone must use 09..., 07..., 251..., or +251... format.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageCode: selectedPhoto.imageCode,
          sizeId: selectedSize.id,
          fullName,
          email,
          phoneNumber: normalizePhone(phoneNumber),
          locationDetails
        })
      });

      const payload = (await response.json()) as { checkoutUrl?: string; url?: string; error?: string };
      const checkoutUrl = payload.checkoutUrl ?? payload.url;

      if (!response.ok || !checkoutUrl) {
        throw new Error(payload.error ?? 'Unable to create Chapa checkout session.');
      }

      window.location.assign(checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Checkout failed.');
      setIsLoading(false);
    }
  }

  return (
    <aside
      aria-hidden={!selectedPhoto}
      role="dialog"
      aria-modal="true"
      aria-label="Print order panel"
      className={`fixed bottom-0 right-0 z-50 h-[86dvh] w-full border-t border-black bg-white transition-transform duration-150 ease-linear md:top-0 md:h-dvh md:max-w-[430px] md:border-l md:border-t-0 ${
        selectedPhoto ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full md:translate-y-0'
      }`}
    >
      <div className="flex h-full flex-col overflow-y-auto p-4 font-mono text-[11px] uppercase tracking-[0.08em]">
        <div className="mb-6 flex items-center justify-between border-b border-black pb-3">
          <p>PRINT ORDER</p>
          <button className="text-black" type="button" onClick={closePrintDrawer} aria-label="Close print order panel">
            [ CLOSE ]
          </button>
        </div>

        {selectedPhoto ? (
          <>
            <div className="relative mb-3 w-full bg-gray-200" style={{ aspectRatio: `${selectedPhoto.aspectRatio}` }}>
              <Image
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.title}
                fill
                sizes={DRAWER_IMAGE_SIZES}
                placeholder="blur"
                blurDataURL={MUTED_GRAY_BLUR_DATA_URL}
                onContextMenu={(event) => event.preventDefault()}
                className="select-none object-cover"
                draggable={false}
              />
            </div>
            <dl className="mb-5 grid grid-cols-[92px_1fr] gap-y-2 text-gray-700">
              <dt>CODE</dt>
              <dd className="text-black">{selectedPhoto.imageCode}</dd>
              <dt>TITLE</dt>
              <dd>{selectedPhoto.title}</dd>
              <dt>LOCATION</dt>
              <dd>{selectedPhoto.location}</dd>
            </dl>

            <div className="grid gap-3 pb-4">
              <label className="grid gap-1 text-gray-600" htmlFor="print-size">
                SIZE
                <select
                  id="print-size"
                  value={sizeId}
                  onChange={(event) => setSizeId(event.target.value)}
                  className="w-full appearance-none border border-black bg-white p-3 font-mono text-[11px] uppercase tracking-[0.08em] text-black outline-none"
                >
                  {printSizes.map((size) => (
                    <option key={size.id} value={size.id}>
                      {size.label} — {size.dimensions} — ETB {(size.priceCents / 100).toFixed(0)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1 text-gray-600">
                FULL NAME
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="border border-black bg-white p-3 text-black outline-none" required />
              </label>
              <label className="grid gap-1 text-gray-600">
                EMAIL ADDRESS
                <input value={email} onChange={(event) => setEmail(event.target.value)} className="border border-black bg-white p-3 text-black outline-none" type="email" required />
              </label>
              <label className="grid gap-1 text-gray-600">
                PHONE NUMBER
                <input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  className="border border-black bg-white p-3 text-black outline-none"
                  type="tel"
                  placeholder="09..., 07..., +251..."
                  required
                />
              </label>
              <label className="grid gap-1 text-gray-600">
                DELIVERY LOCATION DETAILS
                <textarea
                  value={locationDetails}
                  onChange={(event) => setLocationDetails(event.target.value)}
                  className="min-h-24 border border-black bg-white p-3 text-black outline-none"
                  placeholder="Addis Ababa neighborhood, landmark, building, courier note"
                  required
                />
              </label>
            </div>

            <div className="mt-auto border-t border-black pt-3">
              <p className="mb-3 text-[10px] leading-relaxed text-gray-500">
                Delivery Commitment: Fine art printing, professional archival mounting, and local courier delivery takes up to 10 working days.
              </p>
              <button
                type="button"
                onClick={proceedToCheckout}
                disabled={isLoading || !canSubmit}
                className="w-full bg-black px-4 py-4 text-center text-white disabled:bg-gray-500"
              >
                {isLoading ? '[ CREATING CHAPA CHECKOUT ]' : '[ PROCEED TO CHAPA CHECKOUT ]'}
              </button>
              {error ? <p className="mt-3 text-gray-700">{error}</p> : null}
            </div>
          </>
        ) : null}
      </div>
    </aside>
  );
}
