'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { MUTED_GRAY_BLUR_DATA_URL } from '@/lib/image';
import type { Photograph } from '@/lib/types';
import { usePrintDrawer } from './PrintDrawerProvider';

type Props = {
  photo: Photograph;
  onClose: () => void;
};

export function ExpandedPhotoCard({ photo, onClose }: Props) {
  const { openPrintDrawer } = usePrintDrawer();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="mb-4 flex w-full justify-start">
      {/* Card capped at ~520px wide, image + info side by side */}
      <div
        className="flex border border-black bg-white shadow-sm"
        style={{ maxWidth: 520, width: '100%' }}
        role="region"
        aria-label={`Photo detail: ${photo.title}`}
      >
        {/* Image — fixed width, natural aspect ratio */}
        <div
          className="relative shrink-0 bg-gray-100"
          style={{ width: 240, aspectRatio: `${photo.aspectRatio}` }}
        >
          <Image
            src={photo.imageUrl}
            alt={photo.title}
            fill
            sizes="240px"
            placeholder="blur"
            blurDataURL={MUTED_GRAY_BLUR_DATA_URL}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            className="select-none object-cover"
            priority
          />
        </div>

        {/* Info panel */}
        <div className="flex flex-1 flex-col justify-between px-4 py-3 font-mono text-[10px] uppercase tracking-[0.08em]">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between">
            <p className="text-[9px] text-gray-400">DETAIL</p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-[9px] text-black hover:text-gray-500"
            >
              [ × ]
            </button>
          </div>

          {/* Metadata */}
          <dl className="grid gap-2 text-gray-600">
            <div>
              <dt className="text-[8px] text-gray-400">CODE</dt>
              <dd className="text-black">{photo.imageCode}</dd>
            </div>
            <div>
              <dt className="text-[8px] text-gray-400">TITLE</dt>
              <dd className="text-black">{photo.title}</dd>
            </div>
            <div>
              <dt className="text-[8px] text-gray-400">LOCATION</dt>
              <dd>{photo.location}</dd>
            </div>
            <div>
              <dt className="text-[8px] text-gray-400">CATEGORY</dt>
              <dd>{photo.category}</dd>
            </div>
          </dl>

          {/* Action */}
          <div className="mt-3">
            {photo.isPrintAvailable ? (
              <button
                type="button"
                onClick={() => { onClose(); openPrintDrawer(photo); }}
                className="w-full border border-black bg-black px-3 py-2 text-center text-[9px] text-white transition-colors hover:bg-white hover:text-black"
              >
                [ ORDER PRINT ]
              </button>
            ) : (
              <p className="text-[9px] text-gray-400">PRINT NOT AVAILABLE</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
