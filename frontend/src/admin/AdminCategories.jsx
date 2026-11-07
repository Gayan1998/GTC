import { useState } from 'react';
import { Plus, PencilSimple, Trash, Eye, EyeSlash } from '@phosphor-icons/react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { mediaUrl } from '../utils/helpers.js';
import { useToast, useConfirm } from './components/Feedback.jsx';
import ImagePicker from './components/ImagePicker.jsx';
import Button from '../components/Button.jsx';
import SmartImage from '../components/SmartImage.jsx';
import { LoadingState, ErrorState } from '../components/StateBlocks.jsx';

const EMPTY = {
  name: '',
  slug: '',
  description: '',
  image: '',
  is_published: 1,
  display_order: 0,
  seo_title: '',
  seo_description: '',
};

export default function AdminCategories() {
  const notify = useToast();
  const confirm = useConfirm();
  const { data, loading, error, reload } = useFetch(() => api.get('/admin/categories'), []);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const categories = data || [];

  const startNew = () => setForm({ ...EMPTY });
  const startEdit = (category) =>
    setForm({ ...EMPTY, ...category, display_order: category.display_order ?? 0 });
  const closeForm = () => setForm(null);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      notify('A category name is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await api.put(`/admin/categories/${form.id}`, form);
        notify('Category updated.');
      } else {
        await api.post('/admin/categories', form);
        notify('Category created.');
      }
      closeForm();
      reload();
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (category) => {
    try {
      await api.patch(`/admin/categories/${category.id}`, { value: category.is_published ? 0 : 1 });
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const remove = async (category) => {
    const ok = await confirm({
      title: 'Delete category',
      message: `Delete "${category.name}"? Categories with products cannot be deleted.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.del(`/admin/categories/${category.id}`);
      notify('Category deleted.');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">Categories</h1>
          <p className="mt-1 text-[13.5px] text-muted">Categories appear across the website and product forms.</p>
        </div>
        <Button size="sm" onClick={startNew}>
          <Plus size={15} weight="bold" />
          Add category
        </Button>
      </div>

      {form ? (
        <form onSubmit={save} className="mt-6 rounded-xl border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-[15px] font-semibold text-navy">{form.id ? 'Edit category' : 'New category'}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label htmlFor="cat-name" className="field-label">
                Name <span className="text-action">*</span>
              </label>
              <input id="cat-name" className="field-input" value={form.name} onChange={(event) => set('name', event.target.value)} />
            </div>
            <div>
              <label htmlFor="cat-slug" className="field-label">
                URL slug
              </label>
              <input id="cat-slug" className="field-input" value={form.slug} onChange={(event) => set('slug', event.target.value)} placeholder="Generated from name if blank" />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="cat-description" className="field-label">
                Description
              </label>
              <textarea id="cat-description" rows={3} className="field-input resize-y" value={form.description} onChange={(event) => set('description', event.target.value)} />
            </div>
            <ImagePicker label="Category image" value={form.image} onChange={(value) => set('image', value)} />
            <div className="space-y-4">
              <div>
                <label htmlFor="cat-order" className="field-label">
                  Display order
                </label>
                <input id="cat-order" type="number" className="field-input" value={form.display_order} onChange={(event) => set('display_order', event.target.value)} />
              </div>
              <label className="flex items-center gap-3 text-[13.5px] text-ink">
                <input type="checkbox" className="h-4 w-4 rounded border-line text-action" checked={!!form.is_published} onChange={(event) => set('is_published', event.target.checked ? 1 : 0)} />
                Published on the website
              </label>
            </div>
            <div>
              <label htmlFor="cat-seo-title" className="field-label">
                SEO title
              </label>
              <input id="cat-seo-title" className="field-input" value={form.seo_title} onChange={(event) => set('seo_title', event.target.value)} />
            </div>
            <div>
              <label htmlFor="cat-seo-desc" className="field-label">
                SEO description
              </label>
              <input id="cat-seo-desc" className="field-input" value={form.seo_description} onChange={(event) => set('seo_description', event.target.value)} />
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Saving...' : form.id ? 'Save changes' : 'Create category'}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-white shadow-card">
        {loading ? (
          <LoadingState variant="spinner" label="Loading categories" />
        ) : error ? (
          <div className="p-5">
            <ErrorState message={error.message} onRetry={reload} />
          </div>
        ) : categories.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">No categories yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13.5px]">
              <thead className="border-b border-line bg-mist/60 text-[12px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Slug</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md border border-line bg-mist">
                          <SmartImage src={mediaUrl(category.image)} alt="" className="h-full w-full object-cover" />
                        </div>
                        <span className="font-medium text-navy">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{category.slug}</td>
                    <td className="px-4 py-3 text-muted">{category.display_order}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
                          category.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {category.is_published ? 'Published' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => toggle(category)}
                          aria-label={category.is_published ? 'Hide' : 'Publish'}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-mist hover:text-brand"
                        >
                          {category.is_published ? <EyeSlash size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEdit(category)}
                          aria-label="Edit"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-mist hover:text-brand"
                        >
                          <PencilSimple size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(category)}
                          aria-label="Delete"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
