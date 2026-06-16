import { NextResponse } from 'next/server';
import { APP_RUNTIME_VERSION } from '@/lib/app-version';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    {
      version: APP_RUNTIME_VERSION,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  );
}
