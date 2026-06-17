'use client';

import { useState } from 'react';
import type { Photograph } from '@/lib/types';
import { ExpandedPhotoCard } from './ExpandedPhotoCard';
import { ProtectedImage } from './ProtectedImage';

export function MasonryArchive({ photographs }: { photographs: Photograph[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedPhoto = photographs.find((p) => p.id === selectedId) ?? null;

  function handleSelect(photo: Photograph) {
    setSelectedId((prev) => (prev === photo.id ? null : photo.id));
  }

  function handleClose() {
    setSelectedId(null);
  }

  return (
    <>
      {/* Expanded card — pinned below nav, full width, above the grid */}
      {selectedPhoto && (
        <ExpandedPhotoCard photo={selectedPhoto} onClose={handleClose} />
      )}

      {/* Masonry grid */}
      <section className="columns-2 gap-3 md:columns-3 md:gap-4 xl:columns-4 2xl:columns-5">
        {photographs.map((photo, index) => (
          <ProtectedImage
            key={photo.id}
            photo={photo}
            priority={index < 2}
            isSelected={selectedId === photo.id}
            onSelect={handleSelect}
          />
        ))}
      </section>
    </>
  );
}
