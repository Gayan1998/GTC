import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useSeo } from '../hooks/useSeo.js';
import PageHero from '../components/PageHero.jsx';
import CategoryShowcase from '../components/CategoryShowcase.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Pagination from '../components/Pagination.jsx';

const PER_PAGE = 9;

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Debounce typing into the URL query string.
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

  const { data: pageData } = useFetch(() => api.get('/pages/products'), []);
  const { data: categories, loading: categoriesLoading } = useFetch(() => api.get('/categories'), []);
  const { data, loading, error, reload } = useFetch(
    () => api.get('/products', { search, category, page, per_page: PER_PAGE }),
    [search, category, page]
  );

  const sections = pageData?.sections || {};
  const hero = sections['products.hero'] || {};
  const products = data?.products || [];
  const meta = data?.meta || {};

  const categoryList = categories || [];
  const totalPublished = categoryList.reduce((sum, item) => sum + (item.product_count || 0), 0);
  const activeCategory = categoryList.find((item) => item.slug === category);
  const resultCount = meta.total ?? products.length;

  useSeo({
    title: pageData?.seo_title || 'Product Catalogue | GTC Holdings Int (Pvt) Ltd',
    description:
      pageData?.seo_description ||
      'Browse solar lighting, electrical, automotive and general merchandise products supplied by GTC Holdings in Sri Lanka.',
  });

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const clearFilters = () => {
    setSearchInput('');
    setParams(new URLSearchParams(), { replace: true });
  };

  const hasFilters = Boolean(search || category);

  return (
    <>
      <PageHero
        eyebrow="Catalogue"
        title={hero.heading || 'Product Catalogue'}
        subtitle={hero.subheading || 'Browse our product range by category or search for a specific item.'}
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Products' }]}
      />

      {/* Category index: image-led selector that filters the catalogue below. */}
      <section className="border-b border-line bg-mist/50 py-10 md:py-12">
        <div className="container-x">
          <CategoryShowcase
            categories={categoryList}
            active={category}
            loading={categoriesLoading}
            total={totalPublished}
            heading="Browse by category"
            onSelect={(slug) => updateParam('category', slug)}
          />
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <MagnifyingGlass
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search products"
                aria-label="Search products"
                className="field-input pl-10"
              />
            </div>

            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <p className="text-[13px] text-muted" aria-live="polite">
                {loading
                  ? 'Loading products...'
                  : `${resultCount} ${resultCount === 1 ? 'product' : 'products'}${
                      activeCategory ? ` in ${activeCategory.name}` : ''
                    }`}
              </p>
              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-brand transition-colors hover:text-navy"
                >
                  <X size={13} weight="bold" />
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6">
            <ProductGrid
              products={products}
              loading={loading}
              error={error ? error.message : null}
              onRetry={reload}
              onClear={clearFilters}
            />
          </div>

          <Pagination page={meta.page || page} lastPage={meta.last_page || 1} onChange={(next) => updateParam('page', String(next))} />
        </div>
      </section>
    </>
  );
}
