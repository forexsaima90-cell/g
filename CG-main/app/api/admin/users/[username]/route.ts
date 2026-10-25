import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import { getDb } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { json, options } from '@/lib/http';

export const runtime = 'nodejs';

export function OPTIONS(request: Request) {
  return options(request);
}

export async function DELETE(request: Request, context: { params: Promise<{ username: string }> }) {
  if (!verifyAdminRequest(request)) return json(request, { error: 'Invalid or expired admin token' }, 401);

  try {
    const { username } = await context.params;
    const deleted = await getDb()
      .delete(users)
      .where(eq(users.username, username))
      .returning({ username: users.username });

    if (!deleted.length) return json(request, { error: 'User not found' }, 404);
    return json(request, { ok: true, username: deleted[0].username });
  } catch (error) {
    console.error('Delete license failed:', error instanceof Error ? error.message : 'unknown error');
    return json(request, { error: 'Unable to delete license' }, 500);
  }
}
