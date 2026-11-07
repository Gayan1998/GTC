import { useEffect, useState } from 'react';
import { FloppyDisk, LockKey } from '@phosphor-icons/react';
import { api, setCsrfToken } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useToast } from './components/Feedback.jsx';
import ImagePicker from './components/ImagePicker.jsx';
import Button from '../components/Button.jsx';
import { LoadingState, ErrorState } from '../components/StateBlocks.jsx';

const TEXT_FIELDS = [
  ['company_name', 'Company name'],
  ['company_short_name', 'Short name'],
  ['company_tagline', 'Tagline'],
  ['phone_mobile', 'Mobile number'],
  ['phone_office', 'Office number'],
  ['email', 'Email address'],
  ['address', 'Physical address'],
  ['whatsapp_number', 'WhatsApp number (international, digits only)'],
  ['whatsapp_greeting', 'WhatsApp greeting'],
  ['contact_strip_message', 'Header contact strip message'],
  ['footer_copyright', 'Footer copyright line'],
  ['social_facebook', 'Facebook URL'],
  ['social_instagram', 'Instagram URL'],
  ['social_linkedin', 'LinkedIn URL'],
  ['social_youtube', 'YouTube URL'],
  ['seo_default_title', 'Default SEO title'],
];

export default function AdminSettings() {
  const notify = useToast();
  const { data, loading, error, reload } = useFetch(() => api.get('/admin/settings'), []);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' });
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (data) setForm({ ...data });
  }, [data]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', form);
      notify('Settings saved.');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setChanging(true);
    try {
      const result = await api.post('/admin/change-password', passwords);
      // The server rotates the CSRF token after a password change.
      if (result?.csrf_token) setCsrfToken(result.csrf_token);
      notify('Password updated.');
      setPasswords({ current_password: '', new_password: '' });
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setChanging(false);
    }
  };

  if (loading) return <LoadingState variant="spinner" label="Loading settings" />;
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (!form) return null;

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy">Settings</h1>
        <p className="mt-1 text-[13.5px] text-muted">Company details, contact information and website branding.</p>
      </div>

      <form onSubmit={save} className="mt-6 space-y-6">
        <section className="rounded-xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-[15px] font-semibold text-navy">Company and contact</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {TEXT_FIELDS.map(([key, label]) => (
              <div key={key} className={key === 'address' || key === 'contact_strip_message' ? 'sm:col-span-2' : ''}>
                <label htmlFor={`set-${key}`} className="field-label">
                  {label}
                </label>
                <input id={`set-${key}`} className="field-input" value={form[key] || ''} onChange={(event) => set(key, event.target.value)} />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <label htmlFor="footer_description" className="field-label">
              Footer description
            </label>
            <textarea id="footer_description" rows={3} className="field-input resize-y" value={form.footer_description || ''} onChange={(event) => set('footer_description', event.target.value)} />
          </div>
        </section>

        <section className="rounded-xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-[15px] font-semibold text-navy">Branding</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ImagePicker label="Logo (full)" value={form.logo || ''} onChange={(value) => set('logo', value)} />
            <ImagePicker label="Logo mark (header)" value={form.logo_mark || ''} onChange={(value) => set('logo_mark', value)} />
            <ImagePicker label="Favicon" value={form.favicon || ''} onChange={(value) => set('favicon', value)} />
            <ImagePicker label="Social share image" value={form.og_image || ''} onChange={(value) => set('og_image', value)} />
          </div>
          <div className="mt-4">
            <label htmlFor="seo_default_description" className="field-label">
              Default SEO description
            </label>
            <textarea id="seo_default_description" rows={3} className="field-input resize-y" value={form.seo_default_description || ''} onChange={(event) => set('seo_default_description', event.target.value)} />
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            <FloppyDisk size={15} weight="bold" />
            {saving ? 'Saving...' : 'Save settings'}
          </Button>
        </div>
      </form>

      <form onSubmit={changePassword} className="mt-8 rounded-xl border border-line bg-white p-5 shadow-card sm:p-6">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-navy">
          <LockKey size={16} weight="duotone" className="text-brand" />
          Change password
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="current_password" className="field-label">
              Current password
            </label>
            <input
              id="current_password"
              type="password"
              className="field-input"
              autoComplete="current-password"
              value={passwords.current_password}
              onChange={(event) => setPasswords((prev) => ({ ...prev, current_password: event.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="new_password" className="field-label">
              New password (min 10 characters)
            </label>
            <input
              id="new_password"
              type="password"
              className="field-input"
              autoComplete="new-password"
              value={passwords.new_password}
              onChange={(event) => setPasswords((prev) => ({ ...prev, new_password: event.target.value }))}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" variant="navy" disabled={changing}>
            {changing ? 'Updating...' : 'Update password'}
          </Button>
        </div>
      </form>
    </div>
  );
}
