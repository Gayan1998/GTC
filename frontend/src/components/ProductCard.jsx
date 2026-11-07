import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { mediaUrl, productWhatsAppMessage, formatPrice } from '../utils/helpers.js';
import { useSite } from '../services/SiteContext.jsx';
import SmartImage from './SmartImage.jsx';
import WhatsAppButton from './WhatsAppButton.jsx';

export default function ProductCard({ product }) {
  const { settings } = useSite();
  const detailUrl = `/products/${product.slug}`;
  const price = product.show_price && product.price ? formatPrice(product.price) : null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-lift">
      <Link to={detailUrl} className="block overflow-hidden bg-mist" tabIndex={-1} aria-hidden="true">
        <SmartImage
          src={mediaUrl(product.main_image)}
          alt={product.name}
          className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-smooth group-hover:scale-[1.04]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        {product.category?.name ? <span className="eyebrow mb-2">{product.category.name}</span> : null}
        <h3 className="text-base font-semibold leading-snug text-navy">
          <Link to={detailUrl} className="transition-colors hover:text-brand">
            {product.name}
          </Link>
        </h3>
        {product.short_description ? (
          <p className="mt-2 line-clamp-2 text-[13.5px] leading-6 text-muted">{product.short_description}</p>
        ) : null}
        {price ? <p className="mt-3 text-sm font-semibold text-navy">{price}</p> : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-5">
          <Link
            to={detailUrl}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand transition-colors hover:text-navy"
          >
            View details
            <ArrowRight size={14} weight="bold" />
          </Link>
          <WhatsAppButton
            message={productWhatsAppMessage(settings, product)}
            label={`Inquire about ${product.name} on WhatsApp`}
            iconOnly
            size="sm"
          />
        </div>
      </div>
    </article>
  );
}
