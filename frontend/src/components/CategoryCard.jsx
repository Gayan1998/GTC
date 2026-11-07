import { Link } from 'react-router-dom';
import { ArrowUpRight } from '@phosphor-icons/react';
import { mediaUrl } from '../utils/helpers.js';
import SmartImage from './SmartImage.jsx';

export default function CategoryCard({ category, prominent = false }) {
  return (
    <Link
      to={`/categories/${category.slug}`}
      className={`group relative flex overflow-hidden rounded-xl border border-line bg-navy shadow-card transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-lift ${
        prominent ? 'min-h-[300px] sm:min-h-[340px]' : 'min-h-[230px]'
      }`}
    >
      <SmartImage
        src={mediaUrl(category.image)}
        alt={category.name}
        className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-700 ease-smooth group-hover:scale-[1.05]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/10" aria-hidden="true" />
      <div className="relative mt-auto w-full p-5 sm:p-6">
        <span className="eyebrow text-white/70">Product category</span>
        <h3 className={`mt-2 font-semibold leading-snug text-white ${prominent ? 'text-xl sm:text-2xl' : 'text-lg'}`}>
          {category.name}
        </h3>
        {category.description ? (
          <p className="mt-2 line-clamp-2 max-w-md text-[13px] leading-6 text-white/75">{category.description}</p>
        ) : null}
        <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white">
          Browse products
          <ArrowUpRight
            size={14}
            weight="bold"
            className="transition-transform duration-300 ease-smooth group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
