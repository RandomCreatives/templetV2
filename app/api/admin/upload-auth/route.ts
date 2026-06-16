import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_UPLOAD_COOKIE, verifyAdminUploadPassword, createAdminUploadToken } from '@/lib/adminAuth';

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof payload?.password === 'string' ? payload.password : '';

  if (!verifyAdminUploadPassword(password)) {
    return NextResponse.json({ ok: false, error: 'Invalid admin password.' }, { status: 401 });
  }

  const token = createAdminUploadToken();
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_UPLOAD_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 // 24 hours
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_UPLOAD_COOKIE);
  return NextResponse.json({ ok: true });
}
