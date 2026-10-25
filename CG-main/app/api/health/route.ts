import { json, options } from '@/lib/http';
export const runtime = 'nodejs';
export function OPTIONS(request: Request) { return options(request); }
export function GET(request: Request) { return json(request, { ok: true, service: 'license-management' }); }
