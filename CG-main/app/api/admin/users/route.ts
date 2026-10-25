import { desc } from 'drizzle-orm';
import { users } from '@/db/schema';
import { getDb } from '@/lib/db';
import { verifyAdminRequest } from '@/lib/auth';
import { json, options, readJson } from '@/lib/http';
import crypto from 'crypto';

export const runtime = 'nodejs';

export function OPTIONS(request: Request) { 
  return options(request); 
}

function clientUser(row: typeof users.$inferSelect) { 
  return { 
    username: row.username, 
    email: row.email, 
    licenseKey: row.licenseKey, 
    deviceId: row.deviceId, 
    validFrom: row.validFrom, 
    validTill: row.validTill, 
    status: row.status 
  }; 
}

// ছোট ও সুন্দর লাইসেন্স কি জেনারেটর (Format: CG-XXXX-XXXX)
function generateShortLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // সহজে পড়তে পড়া যায় এমন অক্ষর
  let part1 = '';
  let part2 = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 4; i++) {
    part1 += chars[bytes[i] % chars.length];
    part2 += chars[bytes[i + 4] % chars.length];
  }
  return `CG-${part1}-${part2}`;
}

export async function GET(request: Request) {
  if (!verifyAdminRequest(request)) return json(request, { error: 'Invalid or expired admin token' }, 401);
  try { 
    return json(request, { users: (await getDb().select().from(users).orderBy(desc(users.validFrom))).map(clientUser) }); 
  } catch (error) { 
    console.error('List users failed:', error instanceof Error ? error.message : 'unknown error'); 
    return json(request, { error: 'Unable to load users' }, 500); 
  }
}

export async function POST(request: Request) {
  if (!verifyAdminRequest(request)) return json(request, { error: 'Invalid or expired admin token' }, 401);
  try {
    const body = await readJson(request);
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const email = body.email == null || body.email === '' ? null : String(body.email).trim();
    const validityDays = Number(body.validityDays);

    if (!/^[A-Za-z0-9_-]{1,64}$/.test(username)) return json(request, { error: 'Username must be 1-64 letters, numbers, underscores, or hyphens' }, 400);
    if (email !== null && (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return json(request, { error: 'Email is invalid' }, 400);
    if (!Number.isInteger(validityDays) || validityDays < 1 || validityDays > 36500) return json(request, { error: 'Validity days must be a positive whole number' }, 400);

    const validFrom = new Date();
    const validTill = new Date(validFrom.getTime() + validityDays * 86400000);

    // JWT এর পরিবর্তে এখন ছোট ইউনিক লাইসেন্স কি তৈরি হবে
    const licenseKey = generateShortLicenseKey();

    const inserted = await getDb().insert(users).values({ 
      username, 
      email, 
      licenseKey, 
      deviceId: null, 
      validFrom, 
      validTill 
    }).returning();

    return json(request, { licenseKey, validFrom: inserted[0].validFrom, validTill: inserted[0].validTill }, 201);
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') return json(request, { error: 'Username or license already exists' }, 409);
    console.error('Create user failed:', error instanceof Error ? error.message : 'unknown error');
    return json(request, { error: 'Unable to create license' }, 500);
  }
}