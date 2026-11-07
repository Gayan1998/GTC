import { Phone, DeviceMobile, EnvelopeSimple, MapPin, Clock } from '@phosphor-icons/react';
import { api } from '../services/api.js';
import { useFetch } from '../hooks/useFetch.js';
import { useSite } from '../services/SiteContext.jsx';
import { useSeo } from '../hooks/useSeo.js';
import { mediaUrl, telHref, whatsappUrl } from '../utils/helpers.js';
import PageHero from '../components/PageHero.jsx';
import Reveal from '../components/Reveal.jsx';
import Prose from '../components/Prose.jsx';
import InquiryForm from '../components/InquiryForm.jsx';

export default function ContactPage() {
  const { settings } = useSite();
  const { data: page } = useFetch(() => api.get('/pages/contact'), []);
  const sections = page?.sections || {};
  const hero = sections['contact.hero'] || {};
  const intro = sections['contact.intro'] || {};

  useSeo({
    title: page?.seo_title || 'Contact GTC Holdings Int (Pvt) Ltd',
    description:
      page?.seo_description ||
      'Contact GTC Holdings by telephone, email or WhatsApp for product enquiries, wholesale supply and China import requirements.',
    image: mediaUrl(hero.image),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: settings.company_name,
      telephone: settings.phone_mobile,
      email: settings.email,
      address: { '@type': 'PostalAddress', streetAddress: settings.address, addressCountry: 'LK' },
    },
  });

  const cards = [
    settings.phone_mobile
      ? { Icon: DeviceMobile, label: 'Mobile', value: settings.phone_mobile, href: telHref(settings.phone_mobile) }
      : null,
    settings.phone_office
      ? { Icon: Phone, label: 'Office', value: settings.phone_office, href: telHref(settings.phone_office) }
      : null,
    settings.email
      ? { Icon: EnvelopeSimple, label: 'Email', value: settings.email, href: `mailto:${settings.email}` }
      : null,
    settings.whatsapp_number
      ? {
          Icon: Phone,
          label: 'WhatsApp',
          value: 'Chat with us',
          href: whatsappUrl(settings, `${settings.whatsapp_greeting || 'Hello GTC Holdings,'} I would like to make an inquiry.`),
        }
      : null,
  ].filter(Boolean);

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={hero.heading || 'Contact GTC Holdings'}
        subtitle={hero.subheading}
        image={hero.image}
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]}
      />

      <section className="section">
        <div className="container-x">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map(({ Icon, label, value, href }, index) => (
              <Reveal key={label} delay={index * 50} className="rounded-xl border border-line bg-white p-6 shadow-card">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-mist text-brand">
                  <Icon size={22} weight="duotone" />
                </span>
                <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
                <a
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="mt-1 block text-[14.5px] font-medium text-navy transition-colors hover:text-brand"
                >
                  {value}
                </a>
              </Reveal>
            ))}
          </div>

          <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1fr]">
            <Reveal>
              <p className="eyebrow mb-3">Get in touch</p>
              <h2 className="text-2xl font-semibold leading-tight tracking-tight text-navy sm:text-3xl">
                {intro.heading || 'We Are Here to Help'}
              </h2>
              {intro.subheading ? <p className="mt-4 text-[15px] leading-7 text-ink">{intro.subheading}</p> : null}
              <Prose text={intro.body} className="mt-4" />

              <div className="mt-8 space-y-4 rounded-xl border border-line bg-mist/50 p-6">
                {settings.address ? (
                  <div className="flex items-start gap-3">
                    <MapPin size={18} weight="fill" className="mt-0.5 shrink-0 text-brand" />
                    <div>
                      <p className="text-[13px] font-semibold text-navy">Address</p>
                      <p className="text-[13.5px] leading-6 text-muted">{settings.address}</p>
                    </div>
                  </div>
                ) : null}
                <div className="flex items-start gap-3">
                  <Clock size={18} weight="fill" className="mt-0.5 shrink-0 text-brand" />
                  <div>
                    <p className="text-[13px] font-semibold text-navy">Response</p>
                    <p className="text-[13.5px] leading-6 text-muted">
                      Send us a message and our team will respond as soon as possible during business hours.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={80} className="rounded-xl border border-line bg-white p-6 shadow-card sm:p-8">
              <h2 className="text-lg font-semibold text-navy">Send us a message</h2>
              <p className="mt-1.5 text-[13.5px] text-muted">
                Complete the form below and our team will get back to you.
              </p>
              <div className="mt-6">
                <InquiryForm type="contact" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
