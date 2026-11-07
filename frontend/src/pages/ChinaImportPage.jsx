import {
  MagnifyingGlass,
  Handshake,
  ShoppingCart,
  ClipboardText,
  AirplaneTilt,
  Boat,
  Warehouse,
  Truck,
  BellRinging,
  MapPin,
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
import InquiryForm from '../components/InquiryForm.jsx';
import WhatsAppButton from '../components/WhatsAppButton.jsx';

const SERVICE_ICONS = [
  MagnifyingGlass,
  Handshake,
  ShoppingCart,
  ClipboardText,
  AirplaneTilt,
  Boat,
  Warehouse,
  Truck,
  BellRinging,
];

function collect(sections, prefix) {
  return Object.entries(sections || {})
    .filter(([key]) => key.startsWith(prefix))
    .map(([, value]) => value)
    .sort((a, b) => a.display_order - b.display_order);
}

export default function ChinaImportPage() {
  const { settings } = useSite();
  const { data: page } = useFetch(() => api.get('/pages/china-import'), []);
  const sections = page?.sections || {};

  const hero = sections['import.hero'] || {};
  const intro = sections['import.intro'] || {};
  const servicesSection = sections['import.services'] || {};
  const services = collect(sections, 'import.service.');
  const locations = sections['import.locations'] || {};
  const processSection = sections['import.process'] || {};
  const steps = collect(sections, 'import.step.');
  const cta = sections['import.cta'] || {};

  useSeo({
    title: page?.seo_title || 'China Sourcing & Cargo Services | GTC Holdings Sri Lanka',
    description:
      page?.seo_description ||
      'Product sourcing, supplier coordination, purchasing support and air and sea cargo arrangements for Sri Lankan businesses importing from China.',
    image: mediaUrl(hero.image),
  });

  return (
    <>
      <PageHero
        eyebrow="China import services"
        title={hero.heading || 'Your Trusted Partner for Importing from China'}
        subtitle={hero.subheading}
        image={hero.image}
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'China Import Services' }]}
      >
        <div className="flex flex-wrap gap-3">
          <Button href="#import-enquiry" variant="white" withArrow>
            {hero.cta_label || 'Discuss Your Import Requirements'}
          </Button>
          <WhatsAppButton
            message={`${settings.whatsapp_greeting || 'Hello GTC Holdings,'} I would like to discuss a China import requirement.`}
            label="Ask on WhatsApp"
            variant="outlineLight"
          />
        </div>
      </PageHero>

      <section className="section">
        <div className="container-x grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow mb-3">Overview</p>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight text-navy sm:text-3xl">
              {intro.heading || 'Practical Import Support'}
            </h2>
            {intro.subheading ? <p className="mt-4 text-[15px] leading-7 text-ink">{intro.subheading}</p> : null}
            <Prose text={intro.body} className="mt-4" />
          </Reveal>

          <Reveal delay={80} className="rounded-xl border border-line bg-mist/60 p-6">
            <div className="flex items-center gap-2.5 text-navy">
              <MapPin size={20} weight="duotone" className="text-brand" />
              <h3 className="text-[15px] font-semibold">{locations.heading || 'Where We Source'}</h3>
            </div>
            <p className="mt-3 text-[13.5px] leading-6 text-muted">{locations.body}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['Guangzhou', 'Yiwu'].map((city) => (
                <span
                  key={city}
                  className="rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] font-medium text-navy"
                >
                  {city}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section bg-mist/60">
        <div className="container-x">
          <SectionHeading
            eyebrow="What we do"
            title={servicesSection.heading || 'Our Import Services'}
            description={servicesSection.subheading}
          />
          <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((item, index) => {
              const Icon = SERVICE_ICONS[index % SERVICE_ICONS.length];
              return (
                <Reveal key={item.id} delay={index * 40} className="flex gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-brand shadow-card">
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

      <section className="section">
        <div className="container-x">
          <SectionHeading
            eyebrow="How it works"
            title={processSection.heading || 'How the Process Works'}
            description={processSection.subheading}
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <Reveal key={step.id} delay={index * 60} className="relative rounded-xl border border-line bg-white p-6 shadow-card">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-navy font-display text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-[15px] font-semibold text-navy">{step.heading}</h3>
                <p className="mt-2 text-[13.5px] leading-6 text-muted">{step.body}</p>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 flex items-start gap-2 text-[12.5px] leading-5 text-muted">
            <CheckCircle size={15} weight="fill" className="mt-0.5 shrink-0 text-brand" />
            This is a general overview of how we work with customers. Specific arrangements are discussed and agreed
            for each requirement.
          </p>
        </div>
      </section>

      <section id="import-enquiry" className="section scroll-mt-24 bg-navy text-white">
        <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1fr]">
          <Reveal>
            <p className="eyebrow text-white/70">Import enquiry</p>
            <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
              {cta.heading || 'Have an Import Requirement?'}
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-white/75">
              {cta.subheading || 'Share the details and our team will get back to you to discuss the options.'}
            </p>
            <div className="mt-6">
              <WhatsAppButton
                message={`${settings.whatsapp_greeting || 'Hello GTC Holdings,'} I have a China import requirement I would like to discuss.`}
                label="Chat on WhatsApp"
                variant="white"
              />
            </div>
          </Reveal>
          <Reveal delay={80} className="rounded-xl bg-white p-6 shadow-lift sm:p-8">
            <h3 className="text-lg font-semibold text-navy">Submit an import enquiry</h3>
            <p className="mt-1.5 text-[13.5px] text-muted">
              Tell us what you would like to source and we will follow up with the available options.
            </p>
            <div className="mt-6">
              <InquiryForm type="import" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
