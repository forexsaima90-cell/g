export function corsHeaders(_request: Request): HeadersInit {
  const origin = _request.headers.get('origin');
  const localhost = origin && /^https?:\/\/localhost(?::\d+)?$/.test(origin) ? origin : '';
  return { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || (process.env.NODE_ENV !== 'production' ? localhost : ''), 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
}
export function json(request: Request, body: unknown, status = 200) { return Response.json(body, { status, headers: corsHeaders(request) }); }
export function options(request: Request) { return new Response(null, { status: 204, headers: corsHeaders(request) }); }
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try { const body: unknown = await request.json(); if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error(); return body as Record<string, unknown>; }
  catch { throw new Error('Request body must be valid JSON'); }
}
