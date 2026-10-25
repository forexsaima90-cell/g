import crypto from 'node:crypto';
import jwt, { type JwtPayload } from 'jsonwebtoken';

function secret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return process.env.JWT_SECRET;
}
export function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export function signAdminToken() { return jwt.sign({ type: 'admin' }, secret(), { expiresIn: '24h' }); }
export function verifyAdminRequest(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) return false;
  try {
    const payload = jwt.verify(authorization.slice(7), secret()) as JwtPayload & { type?: string };
    return payload.type === 'admin';
  } catch { return false; }
}
export function signLicenseToken(username: string, validTill: Date) {
  return jwt.sign({ type: 'license', username }, secret(), { expiresIn: Math.max(1, Math.floor((validTill.getTime() - Date.now()) / 1000)) });
}
export function verifyLicenseToken(token: string) { return jwt.verify(token, secret()) as JwtPayload & { type?: string; username?: string }; }
