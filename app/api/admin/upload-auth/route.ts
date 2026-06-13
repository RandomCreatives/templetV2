import { NextResponse } from 'next/server';
import {
  ADMIN_UPLOAD_COOKIE,
  createAdminUploadToken,
  isAdminUploadConfigured,
  verifyAdminUploadPassword
} from '@/lib/adminAuth';
import { getServerEnv } from '@/lib/env';
import { getClientIp, rateLimit, rateLimitHeaders } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const limit = rateLimit({ key: `admin-upload:${getClientIp(request)}`, limit: 8, windowMs: 60 * 60 * 1000 });

  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many unlock attempts. Try again later.' },
      { status: 429, headers: rateLimitHeaders(limit) }
    );
  }

  if (!isAdminUploadConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Admin upload is disabled. Set ADMIN_UPLOAD_PASSWORD in the deployment environment.' },
      { status: 503 }
    );
  }

  const payload = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const password = typeof payload?.password === 'string' ? payload.password : '';

  if (!verifyAdminUploadPassword(password)) {
    return NextResponse.json({ ok: false, error: 'Invalid password.' }, { status: 401 });
  }

  const env = getServerEnv();
  const response = NextResponse.json({ ok: true });

  response.cookies.set({
    name: ADMIN_UPLOAD_COOKIE,
    value: createAdminUploadToken(),
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    path: '/admin/upload',
    maxAge: 60 * 60 * 8
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({ name: ADMIN_UPLOAD_COOKIE, value: '', path: '/admin/upload', maxAge: 0 });
  return response;
}
