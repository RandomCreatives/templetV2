'use server';

import { getPhotographs } from '@/lib/data';

export async function fetchPhotographsAction(offset: number, limit: number) {
  try {
    const photos = await getPhotographs({ offset, limit });
    return { ok: true, photos };
  } catch (error) {
    console.error('fetchPhotographsAction error:', error);
    return { ok: false, photos: [], error: 'Failed to fetch photographs.' };
  }
}
