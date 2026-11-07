import {
  Download,
  Storefront,
  ShoppingBag,
  GlobeHemisphereWest,
  Target,
  Eye,
  CheckCircle,
} from '@phosphor-icons/react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useSite } from '../services/SiteContext.jsx';
import { useSeo } from '../hooks/useSeo.js';
import { mediaUrl } from '../utils/helpers.js';
import PageHero from '../components/PageHero.jsx';
import Reveal from '../components/Reveal.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import Button from '../components/Button.jsx';
import Prose from '../components/Prose.jsx';
import CategoryCard from '../components/CategoryCard.jsx';

const ACTIVITY_ICONS = [Download, Storefront, ShoppingBag, GlobeHemisphereWest];

function collect(sections, prefix) {
  return Object.entries(sections || {})
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => value)
    .sort((a, b) => a.display_order - b.display_order);
}

export default function AboutPage() {
  const { settings } = useSite();
  const { data: page } = useFetch(() => api.get('/pages/about'), []);
  const { data: categories } = useFetch(() => api.get('/categories'), []);
  const sections = page?.sections || {};

  const hero = sections['about.hero'] || {};
  const overview = sections['about.overview'] || {};
  const activitiesSection = sections['about.activities'] || {};
  const activities = collect(sections, 'about.activity.');
  const productsSection = sections['about.products'] || {};
  const retail = sections['about.retail'] || {};
  const importSection = sections['about.import'] || {};
  const mission = sections['about.mission'] || {};
  const vision = sections['about.vision'] || {};
  const cta = sections['about.cta'] || {};

  useSeo({
    title: page?.seo_title || 'About GTC Holdings Int (Pvt) Ltd',
    description: page?.seo_description || overview.subheading,
    image: mediaUrl(hero.image),
  });

  return (
    <>
      <PageHero
        eyebrow="About us"
        title={hero.heading || 'About GTC Holdings Int (Pvt) Ltd'}
        subtitle={hero.subheading}
        image={hero.image}
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'About Us' }]}
      />

      <section className="section">
        <div className="container-x grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow mb-3">Company overview</p>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-navy sm:text-3xl">
              {overview.heading || 'Who We Are'}
            </h2>
            {overview.subheading ? <p className="mt-4 text-[15px] leading-7 text-ink">{overview.subheading}</p> : null}
            <Prose text={overview.body} className="mt-4" />
          </Reveal>

          <Reveal delay={80}>
            <div className="overflow-hidden rounded-xl border border-line shadow-card">
              <img
                src={mediaUrl(hero.image)}
                alt="GTC Holdings company"
                loading="lazy"
                className="aspect-[5/4] w-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section bg-mist/60">
        <div className="container-x">
          <SectionHeading eyebrow="Activities" title={activitiesSection.heading || 'What We Do'} description={activitiesSection.subheading} />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {activities.map((item, index) => {
              const Icon = ACTIVITY_ICONS[index % ACTIVITY_ICONS.length];
              return (
                <Reveal key={item.id} delay={index * 50} className="rounded-xl border border-line bg-white p-6 shadow-card">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-mist text-brand">
                    <Icon size={22} weight="duotone" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold text-navy">{item.heading}</h3>
                  <p className="mt-2 text-[13.5px] leading-6 text-muted">{item.body}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <SectionHeading
            eyebrow="Product range"
            title={productsSection.heading || 'Our Product Range'}
            description={productsSection.subheading}
          />
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(categories || []).map((category, index) => (
              <Reveal key={category.id} delay={index * 50} className="h-full">
                <CategoryCard category={category} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-mist/60">
        <div className="container-x grid grid-cols-1 gap-10 lg:grid-cols-2">
          <Reveal className="rounded-xl border border-line bg-white p-7 shadow-card">
            <h3 className="text-lg font-semibold text-navy">{retail.heading || 'Retail and Wholesale'}</h3>
            <Prose text={retail.body} className="mt-3" />
          </Reveal>
          <Reveal delay={80} className="rounded-xl border border-line bg-white p-7 shadow-card">
            <h3 className="text-lg font-semibold text-navy">{importSection.heading || 'China Sourcing and Import Support'}</h3>
            <Prose text={importSection.body} className="mt-3" />
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container-x grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Reveal className="rounded-xl border border-line bg-navy p-8 text-white">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
              <Target size={22} weight="duotone" className="text-white" />
            </span>
            <h2 className="mt-4 text-xl font-semibold text-white">{mission.heading || 'Our Mission'}</h2>
            <p className="mt-3 text-[15px] leading-7 text-white/80">{mission.subheading}</p>
          </Reveal>
          <Reveal delay={80} className="rounded-xl border border-line bg-mist/70 p-8">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white text-brand shadow-card">
              <Eye size={22} weight="duotone" />
            </span>
            <h2 className="mt-4 text-xl font-semibold text-navy">{vision.heading || 'Our Vision'}</h2>
            <p className="mt-3 text-[15px] leading-7 text-muted">{vision.subheading}</p>
          </Reveal>
        </div>
      </section>

      <section className="section bg-mist/60">
        <div className="container-x">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-navy sm:text-3xl">
              {cta.heading || 'Work With GTC Holdings'}
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-muted">{cta.subheading}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button to={cta.cta_url || '/contact'} withArrow>
                {cta.cta_label || 'Contact Us'}
              </Button>
              <Button to="/products" variant="outline">
                Browse products
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
