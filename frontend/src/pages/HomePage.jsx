import { Link } from 'react-router-dom';
import {
  CurrencyCircleDollar,
  Storefront,
  SquaresFour,
  Truck,
  Headset,
  GlobeHemisphereWest,
  ArrowRight,
} from '@phosphor-icons/react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useSite } from '../services/SiteContext.jsx';
import { useSeo } from '../hooks/useSeo.js';
import { mediaUrl } from '../utils/helpers.js';
import Button from '../components/Button.jsx';
import Reveal from '../components/Reveal.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import CategoryCard from '../components/CategoryCard.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import SmartImage from '../components/SmartImage.jsx';
import Prose from '../components/Prose.jsx';

const WHY_ICONS = [
  CurrencyCircleDollar,
  Storefront,
  SquaresFour,
  Truck,
  Headset,
  GlobeHemisphereWest,
];

function collectPrefixed(sections, prefix) {
  return Object.entries(sections || {})
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => value)
    .sort((a, b) => a.display_order - b.display_order);
}

export default function HomePage() {
  const { settings } = useSite();
  const { data: page } = useFetch(() => api.get('/pages/home'), []);
  const { data: categories, loading: categoriesLoading } = useFetch(() => api.get('/categories'), []);
  const {
    data: featured,
    loading: featuredLoading,
    error: featuredError,
    reload: reloadFeatured,
  } = useFetch(() => api.get('/products', { featured: 1, per_page: 6 }), []);

  const sections = page?.sections || {};
  const hero = sections['home.hero'] || {};
  const heroCta2 = sections['home.hero.cta2'] || {};
  const intro = sections['home.intro'] || {};
  const categoriesSection = sections['home.categories'] || {};
  const featuredSection = sections['home.featured'] || {};
  const solar = sections['home.solar'] || {};
  const why = sections['home.why'] || {};
  const whyItems = collectPrefixed(sections, 'home.why.');
  const importSection = sections['home.import'] || {};
  const wholesale = sections['home.wholesale'] || {};
  const finalCta = sections['home.cta'] || {};

  useSeo({
    title: page?.seo_title || settings.seo_default_title,
    description: page?.seo_description || settings.seo_default_description,
    image: mediaUrl(settings.og_image),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: settings.company_name,
      url: window.location.origin,
      email: settings.email,
      telephone: settings.phone_mobile,
      address: {
        '@type': 'PostalAddress',
        streetAddress: settings.address,
        addressCountry: 'LK',
      },
    },
  });

  const heroImage = mediaUrl(hero.image) || mediaUrl(settings.og_image);
  const products = featured?.products || [];

  return (
    <>
      {/* 1. Hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand/25 blur-3xl" aria-hidden="true" />
        <div className="container-x relative grid grid-cols-1 items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_1fr]">
          <div className="animate-fade-up">
            <span className="eyebrow text-white/70">Solar lighting &amp; import solutions</span>
            <h1 className="mt-4 max-w-xl font-display text-3xl font-semibold uppercase leading-[1.08] tracking-tight text-white sm:text-4xl md:text-[46px]">
              {hero.heading || 'Powering a Brighter, Greener Tomorrow'}
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-white/75">
              {hero.subheading ||
                'Discover reliable solar lighting, renewable energy products, electrical equipment, automotive accessories and general merchandise for homes and businesses across Sri Lanka.'}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to={hero.cta_url || '/solar-lighting'} size="lg" variant="white" withArrow>
                {hero.cta_label || 'Explore Solar Products'}
              </Button>
              <Button
                to={heroCta2.cta_url || '/contact'}
                size="lg"
                variant="outlineLight"
              >
                {heroCta2.cta_label || 'Contact Our Team'}
              </Button>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-white/60">
              <li>Retail &amp; wholesale supply</li>
              <li>Islandwide delivery</li>
              <li>China sourcing &amp; cargo</li>
            </ul>
          </div>

          <div className="relative animate-fade-in">
            <div className="overflow-hidden rounded-2xl border border-white/15 shadow-lift">
              <SmartImage
                src={heroImage}
                alt="Solar lighting and renewable energy products"
                className="aspect-[4/3] w-full object-cover"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Company introduction */}
      <section className="section">
        <div className="container-x grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <Reveal className="order-2 lg:order-1">
            <div className="overflow-hidden rounded-xl border border-line shadow-card">
              <SmartImage
                src={mediaUrl(intro.image)}
                alt="GTC Holdings supply and distribution"
                className="aspect-[5/4] w-full object-cover"
              />
            </div>
          </Reveal>
          <Reveal className="order-1 lg:order-2">
            <p className="eyebrow mb-3">Who we are</p>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-navy sm:text-3xl md:text-[34px]">
              {intro.heading || 'A Trusted Supply Partner in Sri Lanka'}
            </h2>
            {intro.subheading ? <p className="mt-4 text-[15px] leading-7 text-ink">{intro.subheading}</p> : null}
            <Prose text={intro.body} className="mt-4" />
            {intro.cta_label ? (
              <div className="mt-7">
                <Button to={intro.cta_url || '/about'} variant="outline" withArrow>
                  {intro.cta_label}
                </Button>
              </div>
            ) : null}
          </Reveal>
        </div>
      </section>

      {/* 3. Product categories */}
      <section className="section bg-mist/60">
        <div className="container-x">
          <SectionHeading
            eyebrow="Product range"
            title={categoriesSection.heading || 'Explore Our Product Range'}
            description={categoriesSection.subheading}
          />
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {categoriesLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className={`skeleton min-h-[230px] rounded-xl ${index === 0 ? 'md:col-span-3' : ''}`} />
              ))
            ) : (categories || []).length ? (
              (categories || []).map((category, index) => (
                <div key={category.id} className={index === 0 ? 'md:col-span-3' : ''}>
                  <Reveal delay={index * 60} className="h-full">
                    <CategoryCard category={category} prominent={index === 0} />
                  </Reveal>
                </div>
              ))
            ) : null}
          </div>
        </div>
      </section>

      {/* 4. Featured products */}
      <section className="section">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Selected items"
              title={featuredSection.heading || 'Featured Products'}
              description={featuredSection.subheading}
            />
            <Reveal>
              <Button to="/products" variant="ghost" withArrow>
                View full catalogue
              </Button>
            </Reveal>
          </div>
          <div className="mt-10">
            <ProductGrid
              products={products}
              loading={featuredLoading}
              error={featuredError ? featuredError.message : null}
              onRetry={reloadFeatured}
              emptyMessage="Featured products will appear here once they are added in the admin panel."
            />
          </div>
        </div>
      </section>

      {/* 5. Solar lighting showcase */}
      <section className="section bg-navy text-white">
        <div className="container-x grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow text-white/70">Solar lighting</p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl md:text-[34px]">
              {solar.heading || 'Smart Solar Lighting for Every Space'}
            </h2>
            {solar.subheading ? <p className="mt-4 text-[15px] leading-7 text-white/80">{solar.subheading}</p> : null}
            <div className="mt-4 [&_p]:text-white/70">
              <Prose text={solar.body} />
            </div>
            <div className="mt-7">
              <Button to={solar.cta_url || '/solar-lighting'} variant="white" withArrow>
                {solar.cta_label || 'View Solar Lighting'}
              </Button>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="overflow-hidden rounded-xl border border-white/15 shadow-lift">
              <SmartImage
                src={mediaUrl(solar.image)}
                alt="Solar lighting applications"
                className="aspect-[5/4] w-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 6. Why choose GTC Holdings */}
      <section className="section">
        <div className="container-x">
          <SectionHeading
            eyebrow="Our strengths"
            title={why.heading || 'Why Choose GTC Holdings'}
            description={why.subheading}
            align="center"
          />
          <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {whyItems.map((item, index) => {
              const Icon = WHY_ICONS[index % WHY_ICONS.length];
              return (
                <Reveal key={item.id} delay={index * 50} className="flex gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-mist text-brand">
                    <Icon size={22} weight="duotone" />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-navy">{item.heading}</h3>
                    <p className="mt-1.5 text-[13.5px] leading-6 text-muted">{item.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. China sourcing and cargo */}
      <section className="section bg-mist/60">
        <div className="container-x grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <Reveal className="order-2 lg:order-1">
            <div className="overflow-hidden rounded-xl border border-line shadow-card">
              <SmartImage
                src={mediaUrl(importSection.image)}
                alt="China sourcing and cargo services"
                className="aspect-[5/4] w-full object-cover"
              />
            </div>
          </Reveal>
          <Reveal className="order-1 lg:order-2">
            <p className="eyebrow mb-3">China import services</p>
            <h2 className="text-2xl font-semibold uppercase leading-tight tracking-tight text-navy sm:text-3xl md:text-[34px]">
              {importSection.heading || 'Import from China with Confidence'}
            </h2>
            {importSection.subheading ? (
              <p className="mt-4 text-[15px] leading-7 text-ink">{importSection.subheading}</p>
            ) : null}
            <Prose text={importSection.body} className="mt-4" />
            <div className="mt-7">
              <Button to={importSection.cta_url || '/china-import'} withArrow>
                {importSection.cta_label || 'Discuss Your Import Requirements'}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 8. Retail and wholesale */}
      <section className="section">
        <div className="container-x grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <Reveal>
            <p className="eyebrow mb-3">Buying options</p>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-navy sm:text-3xl md:text-[34px]">
              {wholesale.heading || 'Retail and Wholesale Supply'}
            </h2>
            {wholesale.subheading ? <p className="mt-4 text-[15px] leading-7 text-ink">{wholesale.subheading}</p> : null}
            <Prose text={wholesale.body} className="mt-4" />
            <div className="mt-7 flex flex-wrap gap-3">
              <Button to={wholesale.cta_url || '/contact'} withArrow>
                {wholesale.cta_label || 'Enquire About Wholesale Supply'}
              </Button>
              <Button to="/products" variant="outline">
                Browse products
              </Button>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="overflow-hidden rounded-xl border border-line shadow-card">
              <SmartImage
                src={mediaUrl(wholesale.image)}
                alt="Wholesale supply and distribution"
                className="aspect-[5/4] w-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 9. Final CTA */}
      <section className="section bg-navy">
        <div className="container-x">
          <Reveal className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl md:text-[36px]">
              {finalCta.heading || 'Looking for the Right Products or Import Solution?'}
            </h2>
            {finalCta.subheading ? (
              <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-white/75">{finalCta.subheading}</p>
            ) : null}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button to={finalCta.cta_url || '/contact'} size="lg" variant="white" withArrow>
                {finalCta.cta_label || 'Contact Us'}
              </Button>
              <Button to="/products" size="lg" variant="outlineLight">
                View products
              </Button>
            </div>
            <p className="mt-6 text-[13px] text-white/55">
              Prefer to message us? Use the WhatsApp button to reach our team directly.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
