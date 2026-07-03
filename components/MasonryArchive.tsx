'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Masonry from 'react-masonry-css';
import type { Photograph } from '@/lib/types';
import { ProtectedImage } from './ProtectedImage';
import { fetchPhotographsAction } from '@/app/archive/actions';

const INITIAL_LIMIT = 12;
const SCROLL_LIMIT = 8;

const breakpointColumnsObj = {
  default: 5,
  1536: 4,
  1280: 3,
  768: 2,
  640: 1
};

export function MasonryArchive({ initialPhotographs }: { initialPhotographs: Photograph[] }) {
  const [photographs, setPhotographs] = useState<Photograph[]>(initialPhotographs);
  const [offset, setOffset] = useState(initialPhotographs.length);
  const [hasMore, setHasMore] = useState(initialPhotographs.length >= INITIAL_LIMIT);
  const [isPending, startTransition] = useTransition();
  const observerTarget = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isPending) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isPending, offset]);

  function loadMore() {
    startTransition(async () => {
      const result = await fetchPhotographsAction(offset, SCROLL_LIMIT);
      if (result.ok && result.photos.length > 0) {
        setPhotographs((prev) => {
          // Avoid duplicates if initial photos were already loaded
          const newPhotos = result.photos.filter((p) => !prev.some((existing) => existing.id === p.id));
          return [...prev, ...newPhotos];
        });
        setOffset((prev) => prev + result.photos.length);
        setHasMore(result.photos.length === SCROLL_LIMIT);
      } else {
        setHasMore(false);
      }
    });
  }

  return (
    <div className="archive-masonry-container">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex -ml-3 md:-ml-4 w-auto"
        columnClassName="pl-3 md:pl-4 bg-clip-padding"
      >
        {photographs.map((photo, index) => (
          <ProtectedImage key={photo.id} photo={photo} priority={index < 4} />
        ))}
      </Masonry>

      <div ref={observerTarget} className="h-10 w-full flex items-center justify-center mt-8">
        {isPending && (
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-400 animate-pulse">
            [ LOADING ASSETS ]
          </div>
        )}
        {!hasMore && photographs.length > 0 && (
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-400">
            [ END OF ARCHIVE ]
          </div>
        )}
      </div>
    </div>
  );
}
