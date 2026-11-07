import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MagnifyingGlass, Plus, PencilSimple, Trash, Eye, EyeSlash, Star } from '@phosphor-icons/react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { mediaUrl } from '../utils/helpers.js';
import { useToast, useConfirm } from './components/Feedback.jsx';
import SmartImage from '../components/SmartImage.jsx';
import Pagination from '../components/Pagination.jsx';
import { LoadingState, ErrorState, EmptyState } from '../components/StateBlocks.jsx';

export default function AdminProducts() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const status = params.get('status') || '';
  const categoryId = params.get('category_id') || '';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const [searchInput, setSearchInput] = useState(search);

  const notify = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (searchInput === search) return undefined;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (searchInput) next.set('search', searchInput);
      else next.delete('search');
      next.delete('page');
      setParams(next, { replace: true });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const { data, loading, error, reload } = useFetch(
    () => api.get('/admin/products', { search, status, category_id: categoryId, page, per_page: 20 }),
    [search, status, categoryId, page]
  );
  const { data: categories } = useFetch(() => api.get('/admin/categories'), []);

  const products = data?.products || [];
  const meta = data?.meta || {};

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const toggle = async (product, field) => {
    try {
      await api.patch(`/admin/products/${product.id}`, { field, value: product[field] ? 0 : 1 });
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const remove = async (product) => {
    const ok = await confirm({
      title: 'Delete product',
      message: `Delete "${product.name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.del(`/admin/products/${product.id}`);
      notify('Product deleted.');
      reload();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy">Products</h1>
          <p className="mt-1 text-[13.5px] text-muted">Add, edit and publish the products shown on the website.</p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-lg bg-action px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand"
        >
          <Plus size={15} weight="bold" />
          Add product
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <MagnifyingGlass size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            className="field-input pl-10"
          />
        </div>
        <select className="field-input sm:max-w-[160px]" value={status} onChange={(event) => setParam('status', event.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select
          className="field-input sm:max-w-[220px]"
          value={categoryId}
          onChange={(event) => setParam('category_id', event.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {(categories || []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-white shadow-card">
        {loading ? (
          <LoadingState variant="spinner" label="Loading products" />
        ) : error ? (
          <div className="p-5">
            <ErrorState message={error.message} onRetry={reload} />
          </div>
        ) : products.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No products found"
              message="Adjust your filters or add a new product."
              action={
                <Link to="/admin/products/new" className="inline-flex items-center gap-2 rounded-lg bg-action px-4 py-2.5 text-[13px] font-semibold text-white">
                  <Plus size={15} weight="bold" /> Add product
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13.5px]">
              <thead className="border-b border-line bg-mist/60 text-[12px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.map((product) => (
                  <tr key={product.id} className="align-middle">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-14 shrink-0 overflow-hidden rounded-md border border-line bg-mist">
                          <SmartImage src={mediaUrl(product.main_image)} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-navy">{product.name}</p>
                          <p className="truncate text-[12px] text-muted">
                            {product.is_demo ? 'Demo product' : product.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{product.category?.name || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
                            product.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {product.is_published ? 'Published' : 'Draft'}
                        </span>
                        {product.is_featured ? (
                          <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-amber-600">
                            <Star size={11} weight="fill" /> Featured
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{product.display_order}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => toggle(product, 'is_published')}
                          title={product.is_published ? 'Unpublish' : 'Publish'}
                          aria-label={product.is_published ? 'Unpublish' : 'Publish'}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-mist hover:text-brand"
                        >
                          {product.is_published ? <EyeSlash size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggle(product, 'is_featured')}
                          title={product.is_featured ? 'Remove from featured' : 'Mark as featured'}
                          aria-label={product.is_featured ? 'Remove from featured' : 'Mark as featured'}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-mist ${
                            product.is_featured ? 'text-amber-500' : 'text-muted hover:text-amber-500'
                          }`}
                        >
                          <Star size={16} weight={product.is_featured ? 'fill' : 'regular'} />
                        </button>
                        <Link
                          to={`/admin/products/${product.id}`}
                          title="Edit"
                          aria-label="Edit"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-mist hover:text-brand"
                        >
                          <PencilSimple size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(product)}
                          title="Delete"
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

      <Pagination page={meta.page || page} lastPage={meta.last_page || 1} onChange={(next) => setParam('page', String(next))} />
    </div>
  );
}
