import { photographs as fallbackPhotographs, printSizes, projects as fallbackProjects } from '@/data/sampleData';
import type { Photograph, Project } from './types';
import { getSupabaseReadClient, type PhotographRow, type ProjectRow } from './supabase';

export { printSizes };

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    createdAt: row.created_at
  };
}

function mapPhotograph(row: PhotographRow): Photograph {
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

type PaginationOptions = {
  limit?: number;
  offset?: number;
};

export async function getProjects(): Promise<Project[]> {
  const supabase = getSupabaseReadClient();
  if (!supabase) return fallbackProjects;

  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase getProjects failed; using local fallback.', error.message);
    return fallbackProjects;
  }

  return data.map(mapProject);
}

export async function getPhotographs(options: PaginationOptions = {}): Promise<Photograph[]> {
  const supabase = getSupabaseReadClient();
  if (!supabase) {
    const start = options.offset ?? 0;
    const end = options.limit ? start + options.limit : undefined;
    return fallbackPhotographs.slice(start, end);
  }

  let query = supabase.from('photographs').select('*').order('created_at', { ascending: false });

  if (typeof options.limit === 'number') {
    const offset = options.offset ?? 0;
    query = query.range(offset, offset + options.limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase getPhotographs failed; using local fallback.', error.message);
    const start = options.offset ?? 0;
    const end = options.limit ? start + options.limit : undefined;
    return fallbackPhotographs.slice(start, end);
  }

  return data.map(mapPhotograph);
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const supabase = getSupabaseReadClient();
  if (!supabase) return fallbackProjects.find((project) => project.id === id);

  const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();

  if (error) {
    console.error('Supabase getProjectById failed; using local fallback.', error.message);
    return fallbackProjects.find((project) => project.id === id);
  }

  return data ? mapProject(data) : undefined;
}

export async function getPhotographsByProject(projectId: string, options: PaginationOptions = {}): Promise<Photograph[]> {
  const supabase = getSupabaseReadClient();
  if (!supabase) {
    const full = fallbackPhotographs.filter((photo) => photo.projectId === projectId);
    const start = options.offset ?? 0;
    const end = options.limit ? start + options.limit : undefined;
    return full.slice(start, end);
  }

  let query = supabase.from('photographs').select('*').eq('project_id', projectId).order('created_at', { ascending: true });

  if (typeof options.limit === 'number') {
    const offset = options.offset ?? 0;
    query = query.range(offset, offset + options.limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase getPhotographsByProject failed; using local fallback.', error.message);
    const full = fallbackPhotographs.filter((photo) => photo.projectId === projectId);
    const start = options.offset ?? 0;
    const end = options.limit ? start + options.limit : undefined;
    return full.slice(start, end);
  }

  return data.map(mapPhotograph);
}

export async function getPhotographByCode(imageCode: string): Promise<Photograph | undefined> {
  const supabase = getSupabaseReadClient();
  if (!supabase) return fallbackPhotographs.find((photo) => photo.imageCode === imageCode);

  const { data, error } = await supabase.from('photographs').select('*').eq('image_code', imageCode).maybeSingle();

  if (error) {
    console.error('Supabase getPhotographByCode failed; using local fallback.', error.message);
    return fallbackPhotographs.find((photo) => photo.imageCode === imageCode);
  }

  return data ? mapPhotograph(data) : undefined;
}
