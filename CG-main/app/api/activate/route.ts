import { and, eq, isNull } from 'drizzle-orm';
import { users } from '@/db/schema';
import { getDb } from '@/lib/db';
import { json, options, readJson } from '@/lib/http';

export const runtime = 'nodejs';

export function OPTIONS(request: Request) { return options(request); }

function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  while (current && typeof current === 'object') {
    if ('code' in current && current.code === '23505') return true;
    current = 'cause' in current ? current.cause : undefined;
  }
  return false;
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const licenseKey = typeof body.licenseKey === 'string' ? body.licenseKey.trim() : '';
    const deviceId = typeof body.deviceId === 'string' ? body.deviceId.trim() : '';

    if (!licenseKey || licenseKey.length > 255 || !deviceId || deviceId.length > 255) {
      return json(request, { error: 'License key and device ID are required' }, 400);
    }

    const db = getDb();
    
    // সরাসরি ডাটাবেজে লাইসেন্স কি দিয়ে খোঁজা হচ্ছে
    const found = await db.select().from(users).where(eq(users.licenseKey, licenseKey)).limit(1);

    if (!found.length) {
      return json(request, { error: 'Invalid license key' }, 401);
    }

    const user = found[0];

    if (user.status !== 'active') return json(request, { error: 'License is not active' }, 403);
    if (user.validTill.getTime() <= Date.now()) return json(request, { error: 'License has expired' }, 403);
    if (user.deviceId && user.deviceId !== deviceId) return json(request, { error: 'License is assigned to another device' }, 409);

    if (!user.deviceId) {
      const assigned = await db.update(users)
        .set({ deviceId })
        .where(and(eq(users.username, user.username), isNull(users.deviceId)))
        .returning({ deviceId: users.deviceId });

      if (!assigned.length) return json(request, { error: 'Device assignment conflict' }, 409);
    }

    return json(request, { ok: true, username: user.username, deviceId });
  } catch (error: unknown) {
    if (isUniqueViolation(error)) return json(request, { error: 'Device is already assigned to another license' }, 409);
    console.error('Activation failed:', error instanceof Error ? error.message : 'unknown error');
    return json(request, { error: 'Unable to activate license' }, 500);
  }
}