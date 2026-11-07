import { Link } from 'react-router-dom';
import { CaretRight } from '@phosphor-icons/react';

export default function Breadcrumbs({ items = [], tone = 'dark' }) {
  const base = tone === 'light' ? 'text-white/60' : 'text-muted';
  const link = tone === 'light' ? 'hover:text-white' : 'hover:text-brand';
  const current = tone === 'light' ? 'text-white' : 'text-navy';
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className={`flex flex-wrap items-center gap-1.5 text-[13px] ${base}`}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 ? <CaretRight size={12} weight="bold" className={tone === 'light' ? 'text-white/40' : 'text-slate-400'} /> : null}
              {isLast || !item.to ? (
                <span aria-current={isLast ? 'page' : undefined} className={isLast ? `font-medium ${current}` : ''}>
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className={`transition-colors ${link}`}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
