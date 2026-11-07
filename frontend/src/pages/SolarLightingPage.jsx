import {
  SunDim,
  BatteryCharging,
  House,
  Tree,
  RoadHorizon,
  Warehouse,
  Buildings,
  Tent,
  PlugsConnected,
  CheckCircle,
} from '@phosphor-icons/react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useSite } from '../services/SiteContext.jsx';
import { useSeo } from '../hooks/useSeo.js';
import { mediaUrl } from '../utils/helpers.js';
import Breadcrumbs from '../components/Breadcrumbs.jsx';
import Reveal from '../components/Reveal.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import Button from '../components/Button.jsx';
import Prose from '../components/Prose.jsx';
import SmartImage from '../components/SmartImage.jsx';
import WhatsAppButton from '../components/WhatsAppButton.jsx';

const BENEFIT_ICONS = [SunDim, PlugsConnected, BatteryCharging, House, CheckCircle];
const APPLICATION_ICONS = [House, Tree, RoadHorizon, Warehouse, Buildings, Tent, PlugsConnected];

const SUPPLY_LIST = [
  'Solar street lights',
  'Solar flood lights',
  'Solar garden and wall lights',
  'Portable solar power products',
  'Solar accessories',
];

function collect(sections, prefix) {
  return Object.entries(sections || {})
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => value)
    .sort((a, b) => a.display_order - b.display_order);
}

export default function SolarLightingPage() {
  const { settings } = useSite();
  const { data: page } = useFetch(() => api.get('/pages/solar-lighting'), []);
  const {
    data: productData,
    loading,
    error,
    reload,
  } = useFetch(() => api.get('/products', { category: 'solar-lighting', per_page: 6 }), []);

  const sections = page?.sections || {};
  const hero = sections['solar.hero'] || {};
  const intro = sections['solar.intro'] || {};
  const benefitsSection = sections['solar.benefits'] || {};
  const benefits = collect(sections, 'solar.benefit.');
  const applicationsSection = sections['solar.applications'] || {};
  const applications = collect(sections, 'solar.application.');
  const cta = sections['solar.cta'] || {};
  const products = productData?.products || [];

  const heroImage = hero.image || 'uploads/seed/solar-hero.webp';
  const introImage = intro.image || 'uploads/seed/solar-section.webp';
  const benefitsImage = benefitsSection.image || 'uploads/seed/prod-solar-panel.webp';

  useSeo({
    title: page?.seo_title || 'Solar Lighting & Renewable Energy | GTC Holdings Sri Lanka',
    description:
      page?.seo_description ||
      'Solar street lights, flood lights, garden lights, wall lights and portable solar power products supplied across Sri Lanka.',
    image: mediaUrl(heroImage),
  });

  return (
    <>
      {/* 1. Full-bleed image hero */}
      <section className="relative flex min-h-[460px] items-center overflow-hidden bg-navy text-white md:min-h-[560px]">
        <SmartImage
          src={mediaUrl(heroImage)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/35" aria-hidden="true" />
        <div className="container-x relative py-14 md:py-20">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Solar Lighting' }]} tone="light" />
          <p className="eyebrow text-white/70">Solar lighting</p>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-semibold leading-[1.12] tracking-tight text-white sm:text-4xl md:text-[42px]">
            {hero.heading || 'Solar Lighting for Homes, Businesses and Outdoor Spaces'}
          </h1>
          {hero.subheading ? (
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/80">{hero.subheading}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to={hero.cta_url || '/contact'} variant="white" withArrow>
              {hero.cta_label || 'Enquire About Solar Products'}
            </Button>
            <WhatsAppButton
              message={`${settings.whatsapp_greeting || 'Hello GTC Holdings,'} I would like to inquire about your solar lighting products.`}
              label="Ask on WhatsApp"
              variant="outlineLight"
            />
          </div>
        </div>
      </section>

      {/* 2. Introduction: image left, copy right */}
      <section className="section">
        <div className="container-x grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="overflow-hidden rounded-xl border border-line shadow-card">
              <SmartImage
                src={mediaUrl(introImage)}
                alt="Solar lighting installation"
                className="aspect-[5/4] w-full object-cover"
              />
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-navy sm:text-3xl">
              {intro.heading || 'Reliable Solar Lighting Supply'}
            </h2>
            {intro.subheading ? <p className="mt-4 text-[15px] leading-7 text-ink">{intro.subheading}</p> : null}
            <Prose text={intro.body} className="mt-4" />

            <ul className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {SUPPLY_LIST.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-[13.5px] text-ink">
                  <CheckCircle size={16} weight="fill" className="shrink-0 text-brand" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-7">
              <Button to="/products" variant="outline" withArrow>
                Browse the full catalogue
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3. Solar products */}
      <section className="section bg-mist/60">
        <div className="container-x">
          <Reveal>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-navy sm:text-3xl">
              Solar lighting products
            </h2>
            <p className="prose-body mt-4 max-w-2xl">
              A selection from our current solar range. Contact us for availability, models and pricing.
            </p>
          </Reveal>
          <div className="mt-10">
            <ProductGrid
              products={products}
              loading={loading}
              error={error ? error.message : null}
              onRetry={reload}
              emptyMessage="Solar products will appear here once they are added in the admin panel."
            />
          </div>
        </div>
      </section>

      {/* 4. Benefits: copy left, image right (zig-zag) */}
      <section className="section">
        <div className="container-x grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-navy sm:text-3xl">
              {benefitsSection.heading || 'Benefits of Solar Lighting'}
            </h2>
            {benefitsSection.subheading ? (
              <p className="mt-4 text-[15px] leading-7 text-ink">{benefitsSection.subheading}</p>
            ) : null}

            <ul className="mt-8 space-y-5">
              {benefits.map((item, index) => {
                const Icon = BENEFIT_ICONS[index % BENEFIT_ICONS.length];
                return (
                  <li key={item.id} className="flex gap-4">
                    <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mist text-brand">
                      <Icon size={19} weight="duotone" />
                    </span>
                    <div>
                      <h3 className="text-[15px] font-semibold text-navy">{item.heading}</h3>
                      {item.body ? <p className="mt-1 text-[13.5px] leading-6 text-muted">{item.body}</p> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          <Reveal delay={80}>
            <div className="overflow-hidden rounded-xl border border-line shadow-card">
              <SmartImage
                src={mediaUrl(benefitsImage)}
                alt="Solar lighting in use"
                className="aspect-[5/4] w-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5. Applications: grouped list, no card boxes */}
      <section className="section bg-mist/60">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-navy sm:text-3xl">
              {applicationsSection.heading || 'Common Applications'}
            </h2>
            {applicationsSection.subheading ? (
              <p className="mt-4 text-[15px] leading-7 text-ink">{applicationsSection.subheading}</p>
            ) : null}
          </Reveal>

          <ul className="mt-10 grid grid-cols-1 gap-x-12 gap-y-6 sm:grid-cols-2">
            {applications.map((item, index) => {
              const Icon = APPLICATION_ICONS[index % APPLICATION_ICONS.length];
              return (
                <Reveal key={item.id} delay={index * 40} as="li" className="flex items-start gap-3.5">
                  <Icon size={20} weight="duotone" className="mt-0.5 shrink-0 text-brand" />
                  <div>
                    <h3 className="text-[14.5px] font-semibold text-navy">{item.heading}</h3>
                    {item.body ? <p className="mt-0.5 text-[13px] leading-6 text-muted">{item.body}</p> : null}
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 6. Final call to action */}
      <section className="section bg-navy">
        <div className="container-x">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl md:text-[36px]">
              {cta.heading || 'Discuss Your Solar Lighting Requirement'}
            </h2>
            {cta.subheading ? (
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-white/75">{cta.subheading}</p>
            ) : null}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button to={cta.cta_url || '/contact'} size="lg" variant="white" withArrow>
                {cta.cta_label || 'Contact Our Team'}
              </Button>
              <WhatsAppButton
                message={`${settings.whatsapp_greeting || 'Hello GTC Holdings,'} I would like to discuss a solar lighting requirement.`}
                label="WhatsApp us"
                size="lg"
                variant="outlineLight"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
