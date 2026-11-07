import { CheckCircle, SquaresFour } from '@phosphor-icons/react';
import { mediaUrl } from '../utils/helpers.js';
import SmartImage from './SmartImage.jsx';

/**
 * Image-led category index used to filter the catalogue. Category names sit
 * below the image (not overlaid) so contrast is guaranteed and the imagery
 * stays unobstructed. The active tile is marked with a check icon as well as a
 * border, so selection is never conveyed by colour alone.
 */
function Tile({ active, onClick, name, count, image, variant }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group flex flex-col overflow-hidden rounded-xl border bg-white text-left shadow-card transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-lift ${
        active ? 'border-action ring-2 ring-action/25' : 'border-line'
      }`}
    >
      {variant === 'all' ? (
        <div className="flex aspect-[4/3] items-center justify-center bg-navy">
          <SquaresFour size={30} weight="duotone" className="text-white/85" />
        </div>
      ) : (
        <div className="aspect-[4/3] overflow-hidden bg-mist">
          <SmartImage
            src={mediaUrl(image)}
            alt={name}
            className={`h-full w-full object-cover transition-transform duration-500 ease-smooth group-hover:scale-[1.04] ${
              active ? '' : 'opacity-85 group-hover:opacity-100'
            }`}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-3.5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[13.5px] font-semibold leading-tight text-navy">{name}</span>
          {active ? (
            <CheckCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-action" aria-hidden="true" />
          ) : null}
        </div>
        <span className="mt-1 text-[11.5px] text-muted">
          {count} {count === 1 ? 'product' : 'products'}
        </span>
      </div>
    </button>
  );
}

function TileSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="skeleton aspect-[4/3] w-full" />
      <div className="space-y-2 p-3.5">
        <div className="skeleton h-3.5 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

export default function CategoryShowcase({
  categories = [],
  active = '',
  onSelect,
  total = 0,
  heading = 'Browse by category',
  loading = false,
}) {
  const tiles = [
    { key: '', name: 'All products', count: total, variant: 'all' },
    ...categories.map((category) => ({
      key: category.slug,
      name: category.name,
      count: category.product_count ?? 0,
      image: category.image,
      variant: 'image',
    })),
  ];

  return (
    <div>
      {heading ? (
        <h2 className="font-display text-lg font-semibold tracking-tight text-navy sm:text-xl">{heading}</h2>
      ) : null}

      {/* 2 columns on phones, 3 on tablets, a single row on desktop. */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, index) => <TileSkeleton key={index} />)
          : tiles.map((tile) => (
              <Tile
                key={tile.key || 'all'}
                name={tile.name}
                count={tile.count}
                image={tile.image}
                variant={tile.variant}
                active={active === tile.key}
                onClick={() => onSelect(tile.key)}
              />
            ))}
      </div>
    </div>
  );
}
