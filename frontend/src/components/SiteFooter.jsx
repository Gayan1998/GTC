import { Link } from 'react-router-dom';
import { Phone, EnvelopeSimple, MapPin, FacebookLogo, InstagramLogo, LinkedinLogo, YoutubeLogo } from '@phosphor-icons/react';
import { useSite } from '../services/SiteContext.jsx';
import { mediaUrl, telHref, whatsappUrl } from '../utils/helpers.js';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../services/api.js';
import SmartImage from './SmartImage.jsx';

const DEFAULT_QUICK = [
  { label: 'Home', url: '/' },
  { label: 'Products', url: '/products' },
  { label: 'Solar Lighting', url: '/solar-lighting' },
  { label: 'China Import Services', url: '/china-import' },
  { label: 'About Us', url: '/about' },
  { label: 'Contact', url: '/contact' },
];

export default function SiteFooter() {
  const { settings, navigation } = useSite();
  const { data: categories } = useFetch(() => api.get('/categories'), []);
  const quickLinks = navigation?.footer_quick?.length ? navigation.footer_quick : DEFAULT_QUICK;
  const year = new Date().getFullYear();
  const logo = mediaUrl(settings.logo) || mediaUrl(settings.logo_mark);

  const socials = [
    { key: 'social_facebook', href: settings.social_facebook, Icon: FacebookLogo, label: 'Facebook' },
    { key: 'social_instagram', href: settings.social_instagram, Icon: InstagramLogo, label: 'Instagram' },
    { key: 'social_linkedin', href: settings.social_linkedin, Icon: LinkedinLogo, label: 'LinkedIn' },
    { key: 'social_youtube', href: settings.social_youtube, Icon: YoutubeLogo, label: 'YouTube' },
  ].filter((item) => item.href);

  return (
    <footer className="border-t border-line bg-navy text-white/80">
      <div className="container-x grid grid-cols-1 gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          {logo ? (
            <div className="inline-flex rounded-lg bg-white p-2.5">
              <img src={logo} alt={settings.company_name} className="h-12 w-auto" />
            </div>
          ) : (
            <p className="font-display text-lg font-bold text-white">{settings.company_name}</p>
          )}
          <p className="mt-4 text-[13.5px] leading-6 text-white/70">{settings.footer_description}</p>

          {socials.length ? (
            <div className="mt-5 flex items-center gap-2">
              {socials.map(({ key, href, Icon, label }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/80 transition-colors hover:border-white/40 hover:text-white"
                >
                  <Icon size={17} weight="fill" />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white">Quick Links</h3>
          <ul className="mt-4 space-y-2.5 text-[13.5px]">
            {quickLinks.map((item) => (
              <li key={item.id ?? item.label}>
                <Link to={item.url} className="transition-colors hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white">Product Categories</h3>
          <ul className="mt-4 space-y-2.5 text-[13.5px]">
            {(categories || []).map((category) => (
              <li key={category.id}>
                <Link to={`/categories/${category.slug}`} className="transition-colors hover:text-white">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white">Contact</h3>
          <ul className="mt-4 space-y-3 text-[13.5px]">
            {settings.phone_mobile ? (
              <li>
                <a href={telHref(settings.phone_mobile)} className="flex items-start gap-2.5 transition-colors hover:text-white">
                  <Phone size={16} weight="fill" className="mt-0.5 shrink-0 text-white/60" />
                  <span>
                    <span className="block text-white/50">Mobile</span>
                    {settings.phone_mobile}
                  </span>
                </a>
              </li>
            ) : null}
            {settings.phone_office ? (
              <li>
                <a href={telHref(settings.phone_office)} className="flex items-start gap-2.5 transition-colors hover:text-white">
                  <Phone size={16} weight="fill" className="mt-0.5 shrink-0 text-white/60" />
                  <span>
                    <span className="block text-white/50">Office</span>
                    {settings.phone_office}
                  </span>
                </a>
              </li>
            ) : null}
            {settings.email ? (
              <li>
                <a href={`mailto:${settings.email}`} className="flex items-start gap-2.5 transition-colors hover:text-white">
                  <EnvelopeSimple size={16} weight="fill" className="mt-0.5 shrink-0 text-white/60" />
                  {settings.email}
                </a>
              </li>
            ) : null}
            {settings.address ? (
              <li className="flex items-start gap-2.5">
                <MapPin size={16} weight="fill" className="mt-0.5 shrink-0 text-white/60" />
                {settings.address}
              </li>
            ) : null}
            {settings.whatsapp_number ? (
              <li>
                <a
                  href={whatsappUrl(settings, settings.whatsapp_greeting)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:border-white/50"
                >
                  Chat on WhatsApp
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-[12.5px] text-white/55 sm:flex-row">
          <p>
            &copy; {year} {settings.footer_copyright}
          </p>
          <p>Designed for GTC Holdings Int (Pvt) Ltd</p>
        </div>
      </div>
    </footer>
  );
}
