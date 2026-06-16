import { NextResponse } from 'next/server';
import { getProjects } from '@/lib/data';

export async function GET() {
  const projects = await getProjects();
  return NextResponse.json({ ok: true, projects });
}
