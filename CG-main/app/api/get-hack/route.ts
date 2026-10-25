import { and, eq, isNull } from 'drizzle-orm';
import { users } from '@/db/schema';
import { getDb } from '@/lib/db';
import { corsHeaders, readJson } from '@/lib/http';
import payload from '@/lib/payload';

export const runtime = 'nodejs';

function publicJson(request: Request, body: unknown, status = 200) {
  const headers = new Headers(corsHeaders(request));
  headers.set('Access-Control-Allow-Origin', '*');
  return Response.json(body, { status, headers });
}

export function OPTIONS(request: Request) {
  const headers = new Headers(corsHeaders(request));
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(null, { status: 204, headers });
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const license = typeof body.license === 'string' ? body.license.trim() : '';
    const deviceId = typeof body.deviceId === 'string' ? body.deviceId.trim() : '';

    if (!license || !deviceId) {
      return publicJson(request, { error: 'License and device ID are required' }, 400);
    }

    const db = getDb();
    
    // ডাটাবেজ থেকে লাইসেন্স কি খোঁজা হচ্ছে
    const matches = await db.select().from(users).where(eq(users.licenseKey, license)).limit(1);

    if (!matches.length) {
      console.log(`[License Check Failed] Key not found in DB: "${license}"`);
      return publicJson(request, { error: 'Invalid license key' }, 401);
    }

    const user = matches[0];

    if (user.status !== 'active') {
      return publicJson(request, { error: 'License is not active' }, 403);
    }

    if (user.validTill.getTime() <= Date.now()) {
      return publicJson(request, { error: 'License has expired' }, 403);
    }

    if (user.deviceId && user.deviceId !== deviceId) {
      return publicJson(request, { error: 'License is assigned to another device' }, 409);
    }

    if (!user.deviceId) {
      await db.update(users)
        .set({ deviceId })
        .where(and(eq(users.username, user.username), isNull(users.deviceId)));
    }

    return publicJson(request, {
      status: 'success',
      payload
    });
  } catch (error) {
    console.error('License validation error:', error instanceof Error ? error.message : error);
    return publicJson(request, { error: 'Unable to validate license' }, 500);
  }
}