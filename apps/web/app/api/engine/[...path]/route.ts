import type { NextRequest } from 'next/server';

const ENGINE_URL = process.env.ENGINE_URL ?? 'http://localhost:8000';

function buildTarget(path: string[], search: string): string {
  const suffix = path.length ? `/${path.join('/')}` : '';
  return `${ENGINE_URL}${suffix}${search}`;
}

async function proxy(request: NextRequest, path: string[]): Promise<Response> {
  const { search } = new URL(request.url);
  const target = buildTarget(path, search);

  const init: RequestInit = { method: request.method };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = await request.text();
  }

  try {
    const response = await fetch(target, init);
    const data = await response.json().catch(() => ({}));
    return Response.json(data, { status: response.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Engine unreachable';
    return Response.json(
      { error: 'Engine unreachable', detail: message },
      { status: 503 },
    );
  }
}

export async function GET(
  request: NextRequest,
  ctx: RouteContext<'/api/engine/[...path]'>,
): Promise<Response> {
  const { path } = await ctx.params;
  return proxy(request, path ?? []);
}

export async function POST(
  request: NextRequest,
  ctx: RouteContext<'/api/engine/[...path]'>,
): Promise<Response> {
  const { path } = await ctx.params;
  return proxy(request, path ?? []);
}
