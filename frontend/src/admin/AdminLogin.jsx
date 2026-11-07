import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LockKey, User } from '@phosphor-icons/react';
import { useAdminAuth } from './AdminAuthContext.jsx';
import { useSite } from '../services/SiteContext.jsx';
import { mediaUrl } from '../utils/helpers.js';
import Button from '../components/Button.jsx';

export default function AdminLogin() {
  const { user, loading, login } = useAdminAuth();
  const { settings } = useSite();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.username.trim(), form.password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-navy px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={mediaUrl(settings.logo_mark)} alt="" className="h-14 w-auto" />
          <h1 className="mt-4 font-display text-xl font-semibold text-white">GTC Holdings Admin</h1>
          <p className="mt-1 text-[13px] text-white/60">Sign in to manage website content</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-lift sm:p-8">
          {error ? (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>
          ) : null}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="field-label">
                Username or email
              </label>
              <div className="relative">
                <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="username"
                  name="username"
                  className="field-input pl-10"
                  autoComplete="username"
                  value={form.username}
                  onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <div className="relative">
                <LockKey size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="field-input pl-10"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-[12px] text-white/50">
          Administrator access only. Contact the site owner if you need an account.
        </p>
      </div>
    </div>
  );
}
