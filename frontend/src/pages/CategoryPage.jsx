import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useSeo } from '../hooks/useSeo.js';
import PageHero from '../components/PageHero.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Pagination from '../components/Pagination.jsx';
import { mediaUrl } from '../utils/helpers.js';
import NotFoundPage from './NotFoundPage.jsx';

export default function CategoryPage() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1);

  const { data, loading, error, reload } = useFetch(
    () => api.get(`/categories/${slug}`, { page, per_page: 9 }),
    [slug, page]
  );

  const category = data?.category;
  const products = data?.products || [];
  const meta = data?.meta || {};

  useSeo({
    title: category?.seo_title || (category ? `${category.name} | GTC Holdings` : 'Category | GTC Holdings'),
    description: category?.seo_description || category?.description,
    image: mediaUrl(category?.image),
  });

  if (error?.status === 404) {
    return <NotFoundPage />;
  }

  return (
    <>
      <PageHero
        eyebrow="Product category"
        title={category?.name || 'Category'}
        subtitle={category?.description}
        image={category?.image}
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Products', to: '/products' },
          { label: category?.name || 'Category' },
        ]}
      />

      <section className="section">
        <div className="container-x">
          <p className="text-[13px] text-muted">
            {loading ? 'Loading products...' : `${meta.total ?? products.length} product${(meta.total ?? products.length) === 1 ? '' : 's'}`}
          </p>
          <div className="mt-6">
            <ProductGrid
              products={products}
              loading={loading}
              error={error ? error.message : null}
              onRetry={reload}
              emptyMessage="Products for this category will appear here once they are added."
            />
          </div>
          <Pagination
            page={meta.page || page}
            lastPage={meta.last_page || 1}
            onChange={(next) => {
              const nextParams = new URLSearchParams(params);
              if (next > 1) nextParams.set('page', String(next));
              else nextParams.delete('page');
              setParams(nextParams);
            }}
          />
        </div>
      </section>
    </>
  );
}
