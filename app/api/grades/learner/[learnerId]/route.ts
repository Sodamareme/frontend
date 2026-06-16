import { NextRequest } from 'next/server';
import { proxyApiRequest } from '@/lib/server/api-proxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ learnerId: string }> }
) {
  const { learnerId } = await context.params;
  return proxyApiRequest(request, `/grades/learner/${learnerId}`, { method: 'GET' });
}
