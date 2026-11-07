import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle, Phone, EnvelopeSimple } from '@phosphor-icons/react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useSite } from '../services/SiteContext.jsx';
import { useSeo } from '../hooks/useSeo.js';
import { mediaUrl, productWhatsAppMessage, formatPrice, telHref } from '../utils/helpers.js';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import SmartImage from '../components/SmartImage.jsx';
import Button from '../components/Button.jsx';
import WhatsAppButton from '../components/WhatsAppButton.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Prose from '../components/Prose.jsx';
import { LoadingState, ErrorState } from '../components/StateBlocks.jsx';
import NotFoundPage from './NotFoundPage.jsx';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { settings } = useSite();
  const { data, loading, error, reload } = useFetch(() => api.get(`/products/${slug}`), [slug]);
  const [activeImage, setActiveImage] = useState(null);

  const product = data?.product;
  const related = data?.related || [];

  useEffect(() => {
    setActiveImage(product?.main_image || null);
  }, [product?.main_image]);

  useSeo({
    title: product?.seo_title || (product ? `${product.name} | GTC Holdings` : settings.seo_default_title),
    description: product?.seo_description || product?.short_description,
    image: mediaUrl(product?.main_image),
    type: 'product',
    jsonLd: product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description: product.short_description,
          image: mediaUrl(product.main_image),
          category: product.category?.name,
          brand: { '@type': 'Brand', name: settings.company_short_name },
        }
      : null,
  });

  if (loading) {
    return (
      <section className="section">
        <div className="container-x">
          <LoadingState variant="spinner" label="Loading product" />
        </div>
      </section>
    );
  }

  if (error?.status === 404) {
    return <NotFoundPage />;
  }

  if (error) {
    return (
      <section className="section">
        <div className="container-x">
          <ErrorState message={error.message} onRetry={reload} />
        </div>
      </section>
    );
  }

  if (!product) return null;

  const gallery = [
    product.main_image,
    ...(product.images || []).map((item) => item.image),
  ].filter(Boolean);
  const uniqueGallery = [...new Set(gallery)];
  const price = product.show_price && product.price ? formatPrice(product.price) : null;
  const hasSpecs = (product.specifications || []).length > 0;

  const breadcrumbs = [
    { label: 'Home', to: '/' },
    { label: 'Products', to: '/products' },
  ];
  if (product.category?.slug) {
    breadcrumbs.push({ label: product.category.name, to: `/categories/${product.category.slug}` });
  }
  breadcrumbs.push({ label: product.name });

  return (
    <>
      <section className="border-b border-line bg-mist/50 py-8">
        <div className="container-x">
          <Breadcrumbs items={breadcrumbs} />
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {/* Gallery */}
            <div>
              <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
                <SmartImage
                  src={mediaUrl(activeImage || product.main_image)}
                  alt={product.name}
                  className="aspect-[4/3] w-full object-cover"
                  loading="eager"
                />
              </div>
              {uniqueGallery.length > 1 ? (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {uniqueGallery.map((image) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setActiveImage(image)}
                      aria-label={`View image of ${product.name}`}
                      className={`overflow-hidden rounded-lg border transition-colors ${
                        (activeImage || product.main_image) === image ? 'border-action' : 'border-line hover:border-brand'
                      }`}
                    >
                      <SmartImage src={mediaUrl(image)} alt="" className="aspect-square w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Summary */}
            <div>
              {product.category?.name ? (
                <Link
                  to={`/categories/${product.category.slug}`}
                  className="eyebrow transition-colors hover:text-navy"
                >
                  {product.category.name}
                </Link>
              ) : null}
              <h1 className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight text-navy sm:text-3xl">
                {product.name}
              </h1>
              {price ? <p className="mt-4 text-lg font-semibold text-navy">{price}</p> : null}
              {product.short_description ? (
                <p className="mt-4 text-[15px] leading-7 text-muted">{product.short_description}</p>
              ) : null}

              {(product.features || []).length ? (
                <ul className="mt-6 space-y-3">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex gap-3">
                      <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-brand" />
                      <span className="text-[14px] leading-6 text-ink">
                        {feature.title ? <strong className="font-semibold">{feature.title}: </strong> : null}
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-7 rounded-xl border border-line bg-white p-5">
                <p className="text-[13.5px] leading-6 text-muted">
                  Contact our team to discuss availability, specifications and pricing. We supply both retail and
                  wholesale customers.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button to="/contact" withArrow>
                    Request a quote
                  </Button>
                  <WhatsAppButton
                    message={productWhatsAppMessage(settings, product)}
                    label="Inquire on WhatsApp"
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-[13px]">
                  {settings.phone_mobile ? (
                    <a href={telHref(settings.phone_mobile)} className="inline-flex items-center gap-1.5 text-ink hover:text-brand">
                      <Phone size={14} weight="fill" className="text-brand" />
                      {settings.phone_mobile}
                    </a>
                  ) : null}
                  {settings.email ? (
                    <a href={`mailto:${settings.email}`} className="inline-flex items-center gap-1.5 text-ink hover:text-brand">
                      <EnvelopeSimple size={14} weight="fill" className="text-brand" />
                      {settings.email}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {(product.description || hasSpecs) && (
        <section className="section">
          <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_1fr]">
            {product.description ? (
              <div>
                <h2 className="text-xl font-semibold text-navy">Product details</h2>
                <Prose text={product.description} className="mt-4" />
              </div>
            ) : (
              <div />
            )}

            {hasSpecs ? (
              <div>
                <h2 className="text-xl font-semibold text-navy">Specifications</h2>
                <dl className="mt-4 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
                  {product.specifications.map((spec, index) => (
                    <div key={index} className="grid grid-cols-2 gap-4 px-4 py-3">
                      <dt className="text-[13.5px] font-medium text-ink">{spec.label}</dt>
                      <dd className="text-[13.5px] text-muted">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {related.length ? (
        <section className="section bg-mist/60">
          <div className="container-x">
            <h2 className="text-xl font-semibold text-navy sm:text-2xl">Related products</h2>
            <div className="mt-8">
              <ProductGrid products={related} />
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
