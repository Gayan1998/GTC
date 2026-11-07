import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash, ArrowLeft } from '@phosphor-icons/react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useToast } from './components/Feedback.jsx';
import ImagePicker from './components/ImagePicker.jsx';
import Button from '../components/Button.jsx';
import { LoadingState, ErrorState } from '../components/StateBlocks.jsx';

const EMPTY = {
  name: '',
  slug: '',
  category_id: '',
  short_description: '',
  description: '',
  features: [],
  specifications: [],
  price: '',
  show_price: 0,
  main_image: '',
  images: [],
  is_featured: 0,
  is_published: 1,
  is_demo: 0,
  seo_title: '',
  seo_description: '',
  display_order: 0,
};

function Repeater({ label, items, onChange, fields, addLabel }) {
  const update = (index, key, value) => {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    onChange(next);
  };
  const remove = (index) => onChange(items.filter((_, i) => i !== index));
  const add = () => onChange([...items, fields.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {})]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="field-label mb-0">{label}</span>
        <button type="button" onClick={add} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:text-navy">
          <Plus size={13} weight="bold" /> {addLabel}
        </button>
      </div>
      <div className="mt-2 space-y-3">
        {items.length === 0 ? <p className="text-[12.5px] text-muted">None added.</p> : null}
        {items.map((item, index) => (
          <div key={index} className="flex flex-col gap-2 rounded-lg border border-line bg-mist/40 p-3 sm:flex-row sm:items-start">
            {fields.map((field) => (
              <input
                key={field.key}
                className="field-input"
                placeholder={field.placeholder}
                value={item[field.key] || ''}
                onChange={(event) => update(index, field.key, event.target.value)}
                aria-label={field.placeholder}
              />
            ))}
            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Remove item"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-muted transition-colors hover:border-red-200 hover:text-red-600"
            >
              <Trash size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const notify = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const { data: categories } = useFetch(() => api.get('/admin/categories'), []);
  const { data: product, loading, error } = useFetch(
    () => (isEdit ? api.get(`/admin/products/${id}`) : Promise.resolve(null)),
    [id]
  );

  useEffect(() => {
    if (product) {
      setForm({
        ...EMPTY,
        ...product,
        category_id: product.category_id ? String(product.category_id) : '',
        price: product.price ?? '',
        features: product.features || [],
        specifications: product.specifications || [],
        images: (product.images || []).map((item) => item.image),
        main_image: product.main_image || '',
      });
    }
  }, [product]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    if (!form.name.trim()) {
      setErrors({ name: 'A product name is required.' });
      notify('Please enter a product name.', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      category_id: form.category_id || null,
      price: form.price === '' ? null : form.price,
    };
    try {
      if (isEdit) {
        await api.put(`/admin/products/${id}`, payload);
        notify('Product updated.');
      } else {
        await api.post('/admin/products', payload);
        notify('Product created.');
      }
      navigate('/admin/products');
    } catch (err) {
      notify(err.message, 'error');
      if (err.details) setErrors(err.details);
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loading) {
    return <LoadingState variant="spinner" label="Loading product" />;
  }
  if (isEdit && error) {
    return <ErrorState message={error.message} />;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/admin/products" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-navy hover:border-brand hover:text-brand" aria-label="Back to products">
            <ArrowLeft size={16} weight="bold" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-semibold text-navy">{isEdit ? 'Edit product' : 'Add product'}</h1>
            <p className="mt-0.5 text-[13px] text-muted">{isEdit ? form.name : 'Create a new product for the catalogue.'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button to="/admin/products" variant="outline" size="sm">
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-[15px] font-semibold text-navy">Basic details</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="field-label">
                  Product name <span className="text-action">*</span>
                </label>
                <input id="name" className="field-input" value={form.name} onChange={(event) => set('name', event.target.value)} />
                {errors.name ? <p className="field-error">{errors.name}</p> : null}
              </div>
              <div>
                <label htmlFor="slug" className="field-label">
                  URL slug
                </label>
                <input
                  id="slug"
                  className="field-input"
                  value={form.slug}
                  onChange={(event) => set('slug', event.target.value)}
                  placeholder="Generated from the product name if left blank"
                />
              </div>
              <div>
                <label htmlFor="category_id" className="field-label">
                  Category
                </label>
                <select id="category_id" className="field-input" value={form.category_id} onChange={(event) => set('category_id', event.target.value)}>
                  <option value="">No category</option>
                  {(categories || []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="short_description" className="field-label">
                  Short description
                </label>
                <textarea
                  id="short_description"
                  rows={2}
                  className="field-input resize-y"
                  value={form.short_description}
                  onChange={(event) => set('short_description', event.target.value)}
                  placeholder="Shown on product cards"
                />
              </div>
              <div>
                <label htmlFor="description" className="field-label">
                  Full description
                </label>
                <textarea
                  id="description"
                  rows={7}
                  className="field-input resize-y"
                  value={form.description}
                  onChange={(event) => set('description', event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-[15px] font-semibold text-navy">Features and specifications</h2>
            <div className="mt-4 space-y-6">
              <Repeater
                label="Features"
                addLabel="Add feature"
                items={form.features}
                onChange={(items) => set('features', items)}
                fields={[
                  { key: 'title', placeholder: 'Feature title' },
                  { key: 'text', placeholder: 'Feature description' },
                ]}
              />
              <Repeater
                label="Specifications"
                addLabel="Add specification"
                items={form.specifications}
                onChange={(items) => set('specifications', items)}
                fields={[
                  { key: 'label', placeholder: 'Label (e.g. Capacity)' },
                  { key: 'value', placeholder: 'Value' },
                ]}
              />
              <p className="text-[12px] text-muted">
                Only add specifications the company can confirm. Leave empty if details are not available.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-[15px] font-semibold text-navy">Images</h2>
            <div className="mt-4 space-y-5">
              <ImagePicker label="Main image" value={form.main_image} onChange={(value) => set('main_image', value)} />

              <div>
                <div className="flex items-center justify-between">
                  <span className="field-label mb-0">Additional images</span>
                  <button
                    type="button"
                    onClick={() => set('images', [...form.images, ''])}
                    className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:text-navy"
                  >
                    <Plus size={13} weight="bold" /> Add image
                  </button>
                </div>
                <div className="mt-3 space-y-4">
                  {form.images.length === 0 ? <p className="text-[12.5px] text-muted">No additional images.</p> : null}
                  {form.images.map((image, index) => (
                    <div key={index} className="flex items-end gap-3">
                      <div className="flex-1">
                        <ImagePicker
                          label={`Image ${index + 1}`}
                          value={image}
                          onChange={(value) => {
                            const next = [...form.images];
                            next[index] = value;
                            set('images', next);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => set('images', form.images.filter((_, i) => i !== index))}
                        aria-label="Remove image"
                        className="mb-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-muted transition-colors hover:border-red-200 hover:text-red-600"
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-[15px] font-semibold text-navy">Search engine listing</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="seo_title" className="field-label">
                  SEO title
                </label>
                <input id="seo_title" className="field-input" value={form.seo_title} onChange={(event) => set('seo_title', event.target.value)} />
              </div>
              <div>
                <label htmlFor="seo_description" className="field-label">
                  SEO description
                </label>
                <textarea
                  id="seo_description"
                  rows={3}
                  className="field-input resize-y"
                  value={form.seo_description}
                  onChange={(event) => set('seo_description', event.target.value)}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-line bg-white p-5 shadow-card">
            <h2 className="text-[15px] font-semibold text-navy">Visibility</h2>
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 text-[13.5px] text-ink">
                <input type="checkbox" className="h-4 w-4 rounded border-line text-action" checked={!!form.is_published} onChange={(event) => set('is_published', event.target.checked ? 1 : 0)} />
                Published on the website
              </label>
              <label className="flex items-center gap-3 text-[13.5px] text-ink">
                <input type="checkbox" className="h-4 w-4 rounded border-line text-action" checked={!!form.is_featured} onChange={(event) => set('is_featured', event.target.checked ? 1 : 0)} />
                Featured on the homepage
              </label>
              <label className="flex items-center gap-3 text-[13.5px] text-ink">
                <input type="checkbox" className="h-4 w-4 rounded border-line text-action" checked={!!form.is_demo} onChange={(event) => set('is_demo', event.target.checked ? 1 : 0)} />
                Mark as demo content
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white p-5 shadow-card">
            <h2 className="text-[15px] font-semibold text-navy">Pricing</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="price" className="field-label">
                  Price (optional)
                </label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  className="field-input"
                  value={form.price}
                  onChange={(event) => set('price', event.target.value)}
                  placeholder="Leave blank to hide"
                />
              </div>
              <label className="flex items-center gap-3 text-[13.5px] text-ink">
                <input type="checkbox" className="h-4 w-4 rounded border-line text-action" checked={!!form.show_price} onChange={(event) => set('show_price', event.target.checked ? 1 : 0)} />
                Display this price on the website
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white p-5 shadow-card">
            <h2 className="text-[15px] font-semibold text-navy">Display</h2>
            <div className="mt-4">
              <label htmlFor="display_order" className="field-label">
                Display order
              </label>
              <input
                id="display_order"
                type="number"
                className="field-input"
                value={form.display_order}
                onChange={(event) => set('display_order', event.target.value)}
              />
              <p className="mt-1.5 text-[12px] text-muted">Lower numbers appear first.</p>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
