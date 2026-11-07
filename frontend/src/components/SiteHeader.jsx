import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Phone, EnvelopeSimple, MapPin } from '@phosphor-icons/react';
import { useSite } from '../services/SiteContext.jsx';
import { mediaUrl, telHref } from '../utils/helpers.js';
import ContactStrip from './ContactStrip.jsx';
import Button from './Button.jsx';

const DEFAULT_NAV = [
  { label: 'Home', url: '/' },
  { label: 'Products', url: '/products' },
  { label: 'Solar Lighting', url: '/solar-lighting' },
  { label: 'China Import Services', url: '/china-import' },
  { label: 'About Us', url: '/about' },
  { label: 'Contact', url: '/contact' },
];

export default function SiteHeader() {
  const { settings, navigation } = useSite();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = navigation?.header?.length ? navigation.header : DEFAULT_NAV;
  const mark = mediaUrl(settings.logo_mark) || mediaUrl(settings.logo);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const navLinkClass = ({ isActive }) =>
    `relative py-2 text-[14px] font-medium transition-colors duration-200 ${
      isActive ? 'text-brand' : 'text-ink hover:text-brand'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <ContactStrip />

      <div className="container-x flex h-16 items-center justify-between gap-4 md:h-[72px]">
        <Link to="/" className="flex items-center gap-3" aria-label={`${settings.company_name} home`}>
          {mark ? (
            <img src={mark} alt={settings.company_name} className="h-10 w-auto md:h-11" />
          ) : (
            <span className="font-display text-lg font-bold text-navy">{settings.company_short_name}</span>
          )}
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-display text-[15px] font-bold tracking-tight text-navy">
              {settings.company_short_name}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Import &amp; Wholesale
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {links.map((item) => (
            <NavLink key={item.id ?? item.label} to={item.url} end={item.url === '/'} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button to="/contact" variant="primary" size="md" className="hidden sm:inline-flex">
            Get a Quote
          </Button>

          <button
            type="button"
            className="relative z-50 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-navy transition-colors hover:bg-mist lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="sr-only">Menu</span>
            <span className="relative block h-4 w-5">
              <span
                className={`absolute left-0 block h-0.5 w-5 rounded bg-current transition-all duration-300 ease-smooth ${
                  open ? 'top-1.5 rotate-45' : 'top-0.5'
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 block h-0.5 w-5 rounded bg-current transition-all duration-200 ${
                  open ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-5 rounded bg-current transition-all duration-300 ease-smooth ${
                  open ? 'top-1.5 -rotate-45' : 'top-2.5'
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu — anchored directly below the header so it works at every breakpoint. */}
      <div
        id="mobile-menu"
        className={`absolute inset-x-0 top-full z-40 origin-top border-b border-line bg-white transition-all duration-300 ease-smooth lg:hidden ${
          open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
      >
        <div className="container-x max-h-[calc(100dvh-5rem)] overflow-y-auto py-5">
          <nav className="flex flex-col divide-y divide-line" aria-label="Mobile navigation">
            {links.map((item) => (
              <NavLink
                key={item.id ?? item.label}
                to={item.url}
                end={item.url === '/'}
                className={({ isActive }) =>
                  `py-3.5 text-[15px] font-medium ${isActive ? 'text-brand' : 'text-ink'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-5 space-y-3 text-sm">
            {settings.phone_mobile ? (
              <a href={telHref(settings.phone_mobile)} className="flex items-center gap-2.5 text-ink">
                <Phone size={16} weight="fill" className="text-brand" />
                {settings.phone_mobile}
              </a>
            ) : null}
            {settings.email ? (
              <a href={`mailto:${settings.email}`} className="flex items-center gap-2.5 text-ink">
                <EnvelopeSimple size={16} weight="fill" className="text-brand" />
                {settings.email}
              </a>
            ) : null}
            {settings.address ? (
              <p className="flex items-start gap-2.5 text-muted">
                <MapPin size={16} weight="fill" className="mt-0.5 shrink-0 text-brand" />
                {settings.address}
              </p>
            ) : null}
          </div>

          <div className="mt-5">
            <Button to="/contact" className="w-full" size="lg">
              Get a Quote
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
