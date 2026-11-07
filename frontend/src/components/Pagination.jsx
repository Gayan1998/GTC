import { CaretLeft, CaretRight } from '@phosphor-icons/react';

/** Compact pagination control. `page` and `lastPage` are 1-based. */
export default function Pagination({ page = 1, lastPage = 1, onChange }) {
  if (lastPage <= 1) return null;

  const pages = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(lastPage, page + 2);
  for (let i = from; i <= to; i += 1) pages.push(i);

  const buttonClass =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        className={`${buttonClass} border-line bg-white text-navy hover:border-brand hover:text-brand`}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <CaretLeft size={16} weight="bold" />
      </button>

      {from > 1 ? (
        <>
          <button
            type="button"
            className={`${buttonClass} border-line bg-white text-navy hover:border-brand hover:text-brand`}
            onClick={() => onChange(1)}
          >
            1
          </button>
          {from > 2 ? <span className="px-1 text-muted">...</span> : null}
        </>
      ) : null}

      {pages.map((item) => (
        <button
          key={item}
          type="button"
          aria-current={item === page ? 'page' : undefined}
          className={`${buttonClass} ${
            item === page
              ? 'border-action bg-action text-white'
              : 'border-line bg-white text-navy hover:border-brand hover:text-brand'
          }`}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}

      {to < lastPage ? (
        <>
          {to < lastPage - 1 ? <span className="px-1 text-muted">...</span> : null}
          <button
            type="button"
            className={`${buttonClass} border-line bg-white text-navy hover:border-brand hover:text-brand`}
            onClick={() => onChange(lastPage)}
          >
            {lastPage}
          </button>
        </>
      ) : null}

      <button
        type="button"
        className={`${buttonClass} border-line bg-white text-navy hover:border-brand hover:text-brand`}
        onClick={() => onChange(page + 1)}
        disabled={page >= lastPage}
        aria-label="Next page"
      >
        <CaretRight size={16} weight="bold" />
      </button>
    </nav>
  );
}
