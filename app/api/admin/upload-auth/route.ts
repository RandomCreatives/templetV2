import { NextResponse } from 'next/server';
import { verifyAdminUploadPassword, createAdminUploadToken, ADMIN_UPLOAD_COOKIE } from '@/lib/adminAuth';

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof payload?.password === 'string' ? payload.password : '';

  if (!password || !verifyAdminUploadPassword(password)) {
    return NextResponse.json({ ok: false, error: 'Access denied.' }, { status: 401 });
  }

  const token = createAdminUploadToken();
  const response = NextResponse.json({ ok: true, token });

  response.cookies.set(ADMIN_UPLOAD_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 12 // 12 hours
  });

  return response;
}
