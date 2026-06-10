const ENGINE_URL = process.env.ENGINE_URL ?? 'http://localhost:8000';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') ?? '/health';

  try {
    const response = await fetch(`${ENGINE_URL}${path}`);
    const data = await response.json();
    return Response.json(data);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Engine unreachable';
    return Response.json({ error: errorMsg }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') ?? '/score';

  try {
    const body = await request.json();
    const response = await fetch(`${ENGINE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return Response.json(data);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Engine unreachable';
    return Response.json({ error: errorMsg }, { status: 502 });
  }
}
