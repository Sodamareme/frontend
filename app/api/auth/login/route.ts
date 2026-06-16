import { proxyApiRequest } from '@/lib/server/api-proxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  return proxyApiRequest(request, '/auth/login', { method: 'POST' });
}
