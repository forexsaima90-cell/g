'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Status = 'active' | 'ended' | 'revoked';
type User = { username: string; email: string | null; licenseKey: string; deviceId: string | null; validFrom: string; validTill: string; status: Status };
type FormState = { username: string; email: string; validityDays: number | string };
type ApiData = { users?: User[]; licenseKey?: string; error?: string };

const statuses: Status[] = ['active', 'ended', 'revoked'];

function abbreviatedLicenseKey(key: string) {
  if (key.length <= 36) return key;
  return `${key.slice(0, 18)}...${key.slice(-14)}`;
}

function abbreviatedDeviceId(deviceId: string) {
  if (deviceId.length <= 36) return deviceId;
  return `${deviceId.slice(0, 18)}...${deviceId.slice(-14)}`;
}

async function readResponse(response: Response): Promise<ApiData> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) throw new Error(`API returned ${response.status} ${response.statusText}`);
  const data = (await response.json()) as ApiData;
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export default function Dashboard() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<FormState>({ username: '', email: '', validityDays: 7 });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [expandedLicenseKeys, setExpandedLicenseKeys] = useState<Set<string>>(new Set());
  const [expandedDeviceIds, setExpandedDeviceIds] = useState<Set<string>>(new Set());

  async function request(path: string, options: RequestInit = {}): Promise<ApiData> {
    const response = await fetch(`/api${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options.headers || {}) }
    });
    if (response.status === 401) {
      sessionStorage.removeItem('adminToken');
      router.replace('/login');
    }
    return readResponse(response);
  }

  async function loadUsers() {
    try {
      const data = await request('/admin/users');
      setUsers(data.users || []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load users');
    }
  }

  useEffect(() => {
    const savedToken = sessionStorage.getItem('adminToken');
    if (savedToken) {
      // The token is only available in the browser after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(savedToken);
    } else {
      router.replace('/login');
    }
  }, [router]);
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { if (token) void loadUsers(); }, [token]);

  async function createLicense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const data = await request('/admin/users', { method: 'POST', body: JSON.stringify(form) });
      setForm({ username: '', email: '', validityDays: 7 });
      setMessage(`License created: ${data.licenseKey}`);
      await loadUsers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create license');
    }
  }

  async function updateStatus(username: string, status: Status) {
    try {
      await request(`/admin/users/${encodeURIComponent(username)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await loadUsers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update status');
    }
  }

  async function deleteLicense(username: string) {
    if (!window.confirm(`Delete the license for "${username}"? This cannot be undone.`)) return;
    setError('');
    setMessage('');
    try {
      await request(`/admin/users/${encodeURIComponent(username)}`, { method: 'DELETE' });
      setMessage(`License deleted: ${username}`);
      await loadUsers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete license');
    }
  }

  function toggleLicenseKey(username: string) {
    setExpandedLicenseKeys((current) => {
      const next = new Set(current);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  }

  function toggleDeviceId(username: string) {
    setExpandedDeviceIds((current) => {
      const next = new Set(current);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  }

  if (!token) return null;
  return (
    <main className="shell">
      <header className="header"><div><p className="kicker">QADMIN // LICENSE CONTROL</p><h1>License command center</h1></div><button className="secondary" onClick={() => { sessionStorage.removeItem('adminToken'); router.push('/login'); }}>Sign out</button></header>
      <div className="grid">
        <form className="card form-card" onSubmit={createLicense}>
          <h2>Provision license</h2><p className="muted">Create a license without assigning it to a device.</p>
          <label>Username<input required pattern="[A-Za-z0-9_-]{1,64}" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></label>
          <label>Email <span>(optional)</span><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label>Validity days<input required min="1" step="1" type="number" value={form.validityDays} onChange={e => setForm({ ...form, validityDays: e.target.value })} /></label>
          <button type="submit">Generate license</button>{message && <p className="success">{message}</p>}{error && <p className="error">{error}</p>}
        </form>
        <section className="card"><div className="section-title"><h2>Users</h2><b>{users.length}</b></div>
          <div className="table-wrap"><table><thead><tr><th>Username</th><th>Email</th><th>License key</th><th>Device</th><th>Valid from</th><th>Valid till</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {users.map(user => {
              const isLicenseExpanded = expandedLicenseKeys.has(user.username);
              const isDeviceExpanded = expandedDeviceIds.has(user.username);
              const hasLongDeviceId = Boolean(user.deviceId && user.deviceId.length > 36);
              return <tr key={user.username}><td>{user.username}</td><td>{user.email || '—'}</td><td><code className={`license-key${isLicenseExpanded ? ' expanded' : ''}`}>{isLicenseExpanded ? user.licenseKey : abbreviatedLicenseKey(user.licenseKey)}</code><button type="button" className="key-toggle" onClick={() => toggleLicenseKey(user.username)}>{isLicenseExpanded ? 'Show less' : 'Show more'}</button></td><td>{user.deviceId ? <><code className={`license-key${isDeviceExpanded ? ' expanded' : ''}`}>{isDeviceExpanded ? user.deviceId : abbreviatedDeviceId(user.deviceId)}</code>{hasLongDeviceId && <button type="button" className="key-toggle" onClick={() => toggleDeviceId(user.username)}>{isDeviceExpanded ? 'Show less' : 'Show more'}</button>}</> : <span className="muted">Unassigned</span>}</td><td>{new Date(user.validFrom).toLocaleString()}</td><td>{new Date(user.validTill).toLocaleString()}</td><td><select value={user.status} onChange={e => void updateStatus(user.username, e.target.value as Status)}>{statuses.map(status => <option key={status}>{status}</option>)}</select></td><td><button type="button" className="danger" onClick={() => void deleteLicense(user.username)}>Delete</button></td></tr>;
            })}
          </tbody></table>{!users.length && <p className="muted empty">No licenses provisioned yet.</p>}</div>
        </section>
      </div>
    </main>
  );
}
