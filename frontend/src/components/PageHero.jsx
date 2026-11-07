import Breadcrumbs from './Breadcrumbs.jsx';
import SmartImage from './SmartImage.jsx';
import { mediaUrl } from '../utils/helpers.js';

/** Dark hero band used by inner pages. */
export default function PageHero({ eyebrow, title, subtitle, image, breadcrumbs = [], children, align = 'left' }) {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      {image ? (
        <SmartImage
          src={mediaUrl(image)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/50" aria-hidden="true" />
      <div
        className={`container-x relative py-12 md:py-16 ${align === 'center' ? 'text-center' : ''}`}
      >
        {breadcrumbs.length ? (
          <div className={align === 'center' ? 'flex justify-center' : ''}>
            <Breadcrumbs items={breadcrumbs} tone="light" />
          </div>
        ) : null}
        {eyebrow ? <p className="eyebrow text-white/70">{eyebrow}</p> : null}
        <h1 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-[1.12] tracking-tight text-white sm:text-4xl md:text-[42px]">
          {title}
        </h1>
        {subtitle ? (
          <p className={`mt-4 max-w-2xl text-[15px] leading-7 text-white/75 ${align === 'center' ? 'mx-auto' : ''}`}>
            {subtitle}
          </p>
        ) : null}
        {children ? <div className="mt-7">{children}</div> : null}
      </div>
    </section>
  );
}
