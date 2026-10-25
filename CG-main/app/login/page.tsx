'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type LoginResponse = { token?: string; error?: string };

export default function LoginPage() {
  const router = useRouter();
  const [hash, setHash] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hash }) });
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? (await response.json() as LoginResponse) : { error: `API returned ${response.status}` };
      if (!response.ok) throw new Error(data.error || 'Login failed');
      if (!data.token) throw new Error('Login response did not include a token');
      sessionStorage.setItem('adminToken', data.token);
      router.push('/');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return <main className="login-shell"><form className="card login-card" onSubmit={submit}><p className="kicker">QADMIN // SECURE ACCESS</p><h1>Administrator login</h1><p className="muted">Enter the configured administrator hash.</p><label>Admin hash<input type="password" required value={hash} onChange={e => setHash(e.target.value)} /></label><button disabled={loading}>{loading ? 'Authenticating...' : 'Enter dashboard'}</button>{error && <p className="error">{error}</p>}</form></main>;
}
