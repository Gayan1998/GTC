import { Phone, EnvelopeSimple } from '@phosphor-icons/react';
import { useSite } from '../services/SiteContext.jsx';
import { telHref } from '../utils/helpers.js';

export default function ContactStrip() {
  const { settings } = useSite();

  return (
    <div className="hidden border-b border-white/10 bg-navy text-white md:block">
      <div className="container-x flex h-9 items-center justify-between gap-4 text-[12.5px]">
        <p className="truncate text-white/75">{settings.contact_strip_message}</p>
        <div className="flex shrink-0 items-center gap-5">
          {settings.phone_mobile ? (
            <a href={telHref(settings.phone_mobile)} className="inline-flex items-center gap-1.5 transition-colors hover:text-white/80">
              <Phone size={14} weight="fill" />
              {settings.phone_mobile}
            </a>
          ) : null}
          {settings.email ? (
            <a href={`mailto:${settings.email}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-white/80">
              <EnvelopeSimple size={14} weight="fill" />
              {settings.email}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
