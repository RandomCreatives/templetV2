import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '@/lib/adminAuth';

export async function POST(request: Request) {
  if (!await verifyAdminSession()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const payload = await request.json();
  const { imageCode, imageUrl, aspectRatio, title, location, category, projectId, priceTierId } = payload;

  if (!imageCode || !imageUrl || !aspectRatio || !title) {
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
      location: location ?? 'Unknown',
      category: category ?? 'Archive',
      project_id: projectId || null,
      is_print_available: true,
      price_tier_id: priceTierId || null
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, photograph: data });
}
