import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  try {
    await fetch(`${backendUrl}/auth/logout`, {
      method: 'POST',
      cache: 'no-store',
    });
  } catch {
    // Even if the backend is unreachable, clear the frontend cookie.
  }

  const response = NextResponse.json({
    success: true,
    message: 'Session fermee avec succes',
  });

  response.cookies.set('sa_access_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
