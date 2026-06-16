import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '@/lib/adminAuth';

export async function POST(request: Request) {
  if (!await verifyAdminSession()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as {
    imageCode?: unknown;
    imageUrl?: unknown;
    aspectRatio?: unknown;
    title?: unknown;
    location?: unknown;
    projectId?: unknown;
  } | null;

  const imageCode = typeof payload?.imageCode === 'string' ? payload.imageCode.trim().toUpperCase() : '';
  const imageUrl = typeof payload?.imageUrl === 'string' ? payload.imageUrl.trim() : '';
  const title = typeof payload?.title === 'string' ? payload.title.trim() : '';
  const location = typeof payload?.location === 'string' ? payload.location.trim() : '';
  const projectId = typeof payload?.projectId === 'string' && payload.projectId ? payload.projectId : null;
  const aspectRatio = Number(payload?.aspectRatio);

  if (!imageCode || !imageUrl || !title || !Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return NextResponse.json({ ok: false, error: 'Missing required photograph fields.' }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase service is not configured.' }, { status: 503 });

  const { data, error } = await supabase
    .from('photographs')
    .insert({
      image_code: imageCode,
      image_url: imageUrl,
      aspect_ratio: aspectRatio,
      title,
      location: location || 'Creator Upload',
      category: 'creator-dashboard',
      is_print_available: true,
      price_tier_id: 'standard',
      project_id: projectId
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, photograph: data });
}
