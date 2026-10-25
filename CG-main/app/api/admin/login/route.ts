import { safeEqual, signAdminToken } from '@/lib/auth';
import { json, options, readJson } from '@/lib/http';
export const runtime = 'nodejs';
export function OPTIONS(request: Request) { return options(request); }
export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    if (typeof body.hash !== 'string' || !body.hash) return json(request, { error: 'Admin hash is required' }, 400);
    if (!process.env.ADMIN_HASH) return json(request, { error: 'Admin authentication is not configured' }, 500);
    if (!safeEqual(body.hash, process.env.ADMIN_HASH)) return json(request, { error: 'Invalid admin credentials' }, 401);
    return json(request, { token: signAdminToken(), expiresIn: 86400 });
  } catch (error) {
    console.error('Admin login failed:', error instanceof Error ? error.message : 'unknown error');
    return json(request, { error: 'Unable to login' }, 500);
  }
}
