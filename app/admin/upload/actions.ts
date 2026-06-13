'use server';

import { cookies } from 'next/headers';
import { createHash, randomUUID } from 'node:crypto';
import { ADMIN_UPLOAD_COOKIE, verifyAdminUploadToken } from '@/lib/adminAuth';
import { getServerEnv } from '@/lib/env';
import { getSupabaseServiceClient, type PhotographInsert } from '@/lib/supabase';
import type { Photograph, Project } from '@/lib/types';

type UploadActionResult =
  | { ok: true; photo: Photograph }
  | { ok: false; error: string };

function initialsFromProject(projectId: string) {
  const tokens = projectId.split(/[^a-z0-9]+/i).filter(Boolean);
  const initials = tokens.map((token) => token[0]).join('').toUpperCase();
  return initials.slice(0, 4).padEnd(4, 'X');
}

function sanitizeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');
}

async function createImageCode(projectId: string) {
  const supabase = getSupabaseServiceClient();
  const { count } = supabase
    ? await supabase.from('photographs').select('id', { count: 'exact', head: true })
    : { count: Date.now() % 100000 };

  const sequence = String((count ?? 0) + 1).padStart(6, '0');
  const timestampHash = createHash('sha256')
    .update(`${projectId}:${Date.now()}:${randomUUID()}`)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();

  return `AA-${initialsFromProject(projectId)}-${sequence}-${timestampHash}`;
}

function mapInsertedPhoto(row: {
  id: string;
  image_code: string;
  image_url: string;
  aspect_ratio: number | string;
  title: string;
  location: string;
  category: string;
  is_print_available: boolean;
  price_tier_id: string | null;
  project_id: string | null;
  created_at: string;
}): Photograph {
  return {
    id: row.id,
    imageCode: row.image_code,
    imageUrl: row.image_url,
    aspectRatio: Number(row.aspect_ratio),
    title: row.title,
    location: row.location,
    category: row.category,
    isPrintAvailable: row.is_print_available,
    priceTierId: row.price_tier_id ?? undefined,
    projectId: row.project_id ?? undefined,
    createdAt: row.created_at
  };
}

export async function createPhotographUpload(formData: FormData): Promise<UploadActionResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_UPLOAD_COOKIE)?.value;

  if (!verifyAdminUploadToken(token)) return { ok: false, error: 'Unauthorized upload attempt.' };

  const supabase = getSupabaseServiceClient();
  const env = getServerEnv();

  if (!supabase) return { ok: false, error: 'Supabase write environment is not configured.' };

  const file = formData.get('file');
  const title = String(formData.get('title') ?? '').trim();
  const location = String(formData.get('location') ?? '').trim();
  const projectId = String(formData.get('projectId') ?? '').trim();
  const aspectRatio = Number(formData.get('aspectRatio'));
  const isPrintAvailable = String(formData.get('isPrintAvailable')) === 'true';

  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'A valid image file is required.' };
  if (!file.type.startsWith('image/')) return { ok: false, error: 'Only image uploads are accepted.' };
  if (title.length < 2 || location.length < 2) return { ok: false, error: 'Title and location are required.' };
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) return { ok: false, error: 'A valid aspect ratio is required.' };

  const imageCode = await createImageCode(projectId || 'MONO');
  const safeName = sanitizeFileName(file.name || `${imageCode}.jpg`);
  const objectPath = `${imageCode}/${safeName}`;

  const { error: uploadError } = await supabase.storage.from(env.supabaseArchiveBucket).upload(objectPath, file, {
    contentType: file.type,
    upsert: false
  });

  if (uploadError) return { ok: false, error: `Image upload failed: ${uploadError.message}` };

  const { data: publicUrl } = supabase.storage.from(env.supabaseArchiveBucket).getPublicUrl(objectPath);

  const insert: PhotographInsert = {
    image_code: imageCode,
    image_url: publicUrl.publicUrl,
    aspect_ratio: aspectRatio,
    title,
    location,
    category: 'admin-upload',
    is_print_available: isPrintAvailable,
    price_tier_id: isPrintAvailable ? 'standard' : null,
    project_id: projectId || null
  };

  const { data, error } = await supabase.from('photographs').insert(insert).select('*').single();

  if (error) return { ok: false, error: `Database insert failed: ${error.message}` };

  return { ok: true, photo: mapInsertedPhoto(data) };
}

export type { Project };
