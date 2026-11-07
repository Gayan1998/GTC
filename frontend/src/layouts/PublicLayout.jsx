import { Outlet } from 'react-router-dom';
import { WhatsappLogo } from '@phosphor-icons/react';
import SiteHeader from '../components/SiteHeader.jsx';
import SiteFooter from '../components/SiteFooter.jsx';
import ScrollToTop from '../components/ScrollToTop.jsx';
import { useSite } from '../services/SiteContext.jsx';
import { whatsappUrl } from '../utils/helpers.js';

export default function PublicLayout() {
  const { settings } = useSite();
  const whatsappHref = whatsappUrl(
    settings,
    `${settings.whatsapp_greeting || 'Hello GTC Holdings,'} I would like to make an inquiry.`
  );

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <ScrollToTop />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />

      {settings.whatsapp_number ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with GTC Holdings on WhatsApp"
          className="fixed bottom-5 right-5 z-30 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lift transition-transform duration-300 ease-smooth hover:scale-105 active:scale-95"
        >
          <WhatsappLogo size={26} weight="fill" />
        </a>
      ) : null}
    </div>
  );
}
