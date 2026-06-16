import { NextRequest } from 'next/server';
import { proxyApiRequest } from '@/lib/server/api-proxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return proxyApiRequest(request, `/modules/${id}`, { method: 'GET' });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return proxyApiRequest(request, `/modules/${id}`, { method: 'PUT' });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return proxyApiRequest(request, `/modules/${id}`, { method: 'DELETE' });
}
