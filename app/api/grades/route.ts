import { NextRequest } from 'next/server';
import { proxyApiRequest } from '@/lib/server/api-proxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  return proxyApiRequest(request, '/grades', { method: 'POST' });
}
