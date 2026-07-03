'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ARCHIVE_IMAGE_SIZES, MUTED_GRAY_BLUR_DATA_URL } from '@/lib/image';
import type { Photograph } from '@/lib/types';
import { usePrintDrawer } from './PrintDrawerProvider';

type ProtectedImageProps = {
  photo: Photograph;
  priority?: boolean;
  sizes?: string;
};

export function ProtectedImage({ photo, priority = false, sizes = ARCHIVE_IMAGE_SIZES }: ProtectedImageProps) {
  const { openPrintDrawer } = usePrintDrawer();
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(window.localStorage.getItem('savedImageCodes') ?? '[]') as string[];
    setIsSaved(saved.includes(photo.imageCode));
  }, [photo.imageCode]);

  function toggleSaved(e: React.MouseEvent) {
    e.stopPropagation();
    const saved = JSON.parse(window.localStorage.getItem('savedImageCodes') ?? '[]') as string[];
    const nextSaved = saved.includes(photo.imageCode)
      ? saved.filter((code) => code !== photo.imageCode)
      : [...saved, photo.imageCode];

    window.localStorage.setItem('savedImageCodes', JSON.stringify(nextSaved));
    setIsSaved(nextSaved.includes(photo.imageCode));
  }

  return (
    <figure className="group relative mb-3 break-inside-avoid md:mb-4">
      <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: `${photo.aspectRatio}` }}>
        <Image
          src={photo.imageUrl}
          alt={photo.title}
          fill
          priority={priority}
          sizes={sizes}
          placeholder="blur"
          blurDataURL={MUTED_GRAY_BLUR_DATA_URL}
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
          className="select-none object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Pinterest-style Interactive Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-full flex-col justify-between p-4 font-mono text-[9px] uppercase tracking-[0.1em] text-white">
            <div className="flex items-start justify-between">
              <span className="bg-black/60 px-2 py-1.5 backdrop-blur-md border border-white/10">
                {photo.imageCode}
              </span>
              <button
                type="button"
                onClick={toggleSaved}
                className="bg-black/60 px-3 py-1.5 transition-all hover:bg-white hover:text-black backdrop-blur-md border border-white/10"
              >
                {isSaved ? '[ SAVED ]' : '[ SAVE ]'}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="bg-black/60 p-3 backdrop-blur-md border border-white/10">
                <p className="font-sans text-[12px] font-medium tracking-normal leading-tight">
                  {photo.title}
                </p>
                <div className="mt-2 flex items-center justify-between opacity-80">
                  <p>{photo.location}</p>
                  <p>{photo.category}</p>
                </div>
              </div>

              {photo.isPrintAvailable ? (
                <button
                  type="button"
                  className="w-full bg-white py-2.5 text-black transition-all hover:bg-gray-200 active:scale-[0.98]"
                  onClick={(e) => {
                    e.stopPropagation();
                    openPrintDrawer(photo);
                  }}
                >
                  [ ORDER ARCHIVAL PRINT ]
                </button>
              ) : (
                <span className="w-full border border-white/30 bg-black/40 py-2.5 text-center text-white/50 backdrop-blur-md">
                  [ PRINT UNAVAILABLE ]
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}
