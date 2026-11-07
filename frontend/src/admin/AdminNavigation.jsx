import { useState } from 'react';
import { Plus, PencilSimple, Trash, Eye, EyeSlash } from '@phosphor-icons/react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useToast, useConfirm } from './components/Feedback.jsx';
import Button from '../components/Button.jsx';
import { LoadingState, ErrorState } from '../components/StateBlocks.jsx';

const LOCATIONS = [
  { value: 'header', label: 'Main header navigation' },
  { value: 'footer_quick', label: 'Footer quick links' },
  { value: 'footer_categories', label: 'Footer categories' },
];

const EMPTY = { label: '', url: '', location: 'header', is_visible: 1, display_order: 0 };

export default function AdminNavigation() {
  const notify = useToast();
  const confirm = useConfirm();
  const { data, loading, error, reload } = useFetch(() => api.get('/admin/navigation'), []);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const items = data || [];
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (event) => {
    event.preventDefault();
    if (!form.label.trim() || !form.url.trim()) {
      notify('A label and link are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await api.put(`/admin/navigation/${form.id}`, form);
        notify('Navigation item updated.');
      } else {
        await api.post('/admin/navigation', form);
        notify('Navigation item added.');
      }
      setForm(null);
      reload();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item) => {
    try {
      await api.put(`/admin/navigation/${item.id}`, { ...item, is_visible: item.is_visible ? 0 : 1 });
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const remove = async (item) => {
    const ok = await confirm({
      title: 'Delete link',
      message: `Delete "${item.label}" from the navigation?`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.del(`/admin/navigation/${item.id}`);
      notify('Navigation item deleted.');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">Navigation</h1>
          <p className="mt-1 text-[13.5px] text-muted">Manage the links shown in the header and footer.</p>
        </div>
        <Button size="sm" onClick={() => setForm({ ...EMPTY })}>
          <Plus size={15} weight="bold" />
          Add link
        </Button>
      </div>

      {form ? (
        <form onSubmit={save} className="mt-6 rounded-xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-[15px] font-semibold text-navy">{form.id ? 'Edit link' : 'New link'}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="nav-label" className="field-label">
                Label
              </label>
              <input id="nav-label" className="field-input" value={form.label} onChange={(event) => set('label', event.target.value)} />
            </div>
            <div>
              <label htmlFor="nav-url" className="field-label">
                Link
              </label>
              <input id="nav-url" className="field-input" value={form.url} onChange={(event) => set('url', event.target.value)} placeholder="/products" />
            </div>
            <div>
              <label htmlFor="nav-location" className="field-label">
                Location
              </label>
              <select id="nav-location" className="field-input" value={form.location} onChange={(event) => set('location', event.target.value)}>
                {LOCATIONS.map((location) => (
                  <option key={location.value} value={location.value}>
                    {location.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="nav-order" className="field-label">
                Display order
              </label>
              <input id="nav-order" type="number" className="field-input" value={form.display_order} onChange={(event) => set('display_order', event.target.value)} />
            </div>
          </div>
          <label className="mt-4 flex items-center gap-3 text-[13.5px] text-ink">
            <input type="checkbox" className="h-4 w-4 rounded border-line text-action" checked={!!form.is_visible} onChange={(event) => set('is_visible', event.target.checked ? 1 : 0)} />
            Visible
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setForm(null)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Saving...' : form.id ? 'Save changes' : 'Add link'}
            </Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <LoadingState variant="spinner" label="Loading navigation" />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : (
        <div className="mt-6 space-y-6">
          {LOCATIONS.map((location) => {
            const group = items.filter((item) => item.location === location.value);
            return (
              <div key={location.value} className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
                <div className="border-b border-line bg-mist/60 px-4 py-3">
                  <h2 className="text-[13.5px] font-semibold text-navy">{location.label}</h2>
                </div>
                {group.length === 0 ? (
                  <p className="px-4 py-6 text-[13px] text-muted">No links in this location.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {group.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-medium text-navy">{item.label}</p>
                          <p className="truncate text-[12px] text-muted">
                            {item.url} &middot; order {item.display_order}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => toggle(item)}
                            aria-label={item.is_visible ? 'Hide' : 'Show'}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-mist hover:text-brand"
                          >
                            {item.is_visible ? <EyeSlash size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm({ ...item })}
                            aria-label="Edit"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-mist hover:text-brand"
                          >
                            <PencilSimple size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(item)}
                            aria-label="Delete"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
