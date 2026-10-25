import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import { getDb } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { json, options, readJson } from '@/lib/http';
export const runtime = 'nodejs';
export function OPTIONS(request: Request) { return options(request); }
export async function PATCH(request: Request, context: { params: Promise<{ username: string }> }) {
  if (!verifyAdminRequest(request)) return json(request, { error: 'Invalid or expired admin token' }, 401);
  try {
    const body = await readJson(request);
    if (!['active', 'ended', 'revoked'].includes(String(body.status))) return json(request, { error: 'Status must be active, ended, or revoked' }, 400);
    const { username } = await context.params;
    const updated = await getDb().update(users).set({ status: body.status as 'active' | 'ended' | 'revoked' }).where(eq(users.username, username)).returning({ username: users.username, status: users.status });
    if (!updated.length) return json(request, { error: 'User not found' }, 404);
    return json(request, { user: updated[0] });
  } catch (error) { console.error('Update status failed:', error instanceof Error ? error.message : 'unknown error'); return json(request, { error: 'Unable to update status' }, 500); }
}
