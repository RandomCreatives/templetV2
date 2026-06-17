import type { Photograph, Project } from './types';
import { getSupabaseReadClient, type PhotographRow, type ProjectRow } from './supabase';
import { photographs as samplePhotographs, projects as sampleProjects } from '@/data/sampleData';
export { printSizes } from './printSizes';

type PaginationOptions = {
  limit?: number;
  offset?: number;
};

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

function requireReadClient() {
  const supabase = getSupabaseReadClient();
  if (!supabase) {
    return null;
  }
  return supabase;
}

export async function getProjects(): Promise<Project[]> {
  const supabase = requireReadClient();
  if (!supabase) return sampleProjects;

  const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(`Supabase getProjects failed: ${error.message}`);

  return data.map(mapProject);
}

export async function getPhotographs(options: PaginationOptions = {}): Promise<Photograph[]> {
  const supabase = requireReadClient();
  if (!supabase) {
    let results = samplePhotographs;
    if (typeof options.limit === 'number') {
      const offset = options.offset ?? 0;
      results = results.slice(offset, offset + options.limit);
    }
    return results;
  }

  let query = supabase.from('photographs').select('*').order('created_at', { ascending: false });

  if (typeof options.limit === 'number') {
    const offset = options.offset ?? 0;
    query = query.range(offset, offset + options.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Supabase getPhotographs failed: ${error.message}`);

  return data.map(mapPhotograph);
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const supabase = requireReadClient();
  if (!supabase) return sampleProjects.find((p) => p.id === id);

  const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Supabase getProjectById failed: ${error.message}`);

  return data ? mapProject(data) : undefined;
}

export async function getPhotographsByProject(projectId: string, options: PaginationOptions = {}): Promise<Photograph[]> {
  const supabase = requireReadClient();
  if (!supabase) {
    let results = samplePhotographs.filter((p) => p.projectId === projectId);
    if (typeof options.limit === 'number') {
      const offset = options.offset ?? 0;
      results = results.slice(offset, offset + options.limit);
    }
    return results;
  }

  let query = supabase.from('photographs').select('*').eq('project_id', projectId).order('created_at', { ascending: true });

  if (typeof options.limit === 'number') {
    const offset = options.offset ?? 0;
    query = query.range(offset, offset + options.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Supabase getPhotographsByProject failed: ${error.message}`);

  return data.map(mapPhotograph);
}

export async function getPhotographByCode(imageCode: string): Promise<Photograph | undefined> {
  const supabase = requireReadClient();
  if (!supabase) return samplePhotographs.find((p) => p.imageCode === imageCode);

  const { data, error } = await supabase.from('photographs').select('*').eq('image_code', imageCode).maybeSingle();
  if (error) throw new Error(`Supabase getPhotographByCode failed: ${error.message}`);

  return data ? mapPhotograph(data) : undefined;
}
