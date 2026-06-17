import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase';
import { verifyAdminSession } from '@/lib/adminAuth';

export async function GET() {
  if (!await verifyAdminSession()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase service is not configured.' }, { status: 503 });

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, projects: data });
}

export async function POST(request: Request) {
  if (!await verifyAdminSession()) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const payload = await request.json();
  const { title, description, coverImageUrl } = payload;

  if (!title || !description || !coverImageUrl) {
    return NextResponse.json({ ok: false, error: 'Missing required project fields.' }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: 'Supabase service is not configured.' }, { status: 503 });

  const { data, error } = await supabase
    .from('projects')
    .insert({
      title,
      description,
      cover_image_url: coverImageUrl
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, project: data });
}
