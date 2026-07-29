import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const response = await fetch(`${backendUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: await request.text(),
    cache: 'no-store',
  });

  const responseBody = await response.text();
  const nextResponse = new NextResponse(responseBody, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') || 'application/json',
    },
  });

  if (response.ok) {
    try {
      const payload = JSON.parse(responseBody);
      const token =
        payload?.access_token || payload?.accessToken || payload?.token;

      if (token) {
        nextResponse.cookies.set('sa_access_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24,
        });
      }
    } catch {
      // Keep the proxied response intact even if the body is not JSON.
    }
  }

  return nextResponse;
}
