import { MagnifyingGlass, WarningCircle, Package, ArrowClockwise } from '@phosphor-icons/react';
import Button from './Button.jsx';

export function LoadingState({ label = 'Loading...', variant = 'cards' }) {
  if (variant === 'spinner') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted" role="status" aria-live="polite">
        <ArrowClockwise size={26} className="animate-spin text-brand" />
        <span className="text-sm">{label}</span>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-live="polite" aria-label={label}>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="skeleton aspect-[4/3] w-full" />
          <div className="space-y-3 p-5">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-5/6 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50/60 p-8 text-center">
      <WarningCircle size={30} weight="duotone" className="mx-auto text-red-500" />
      <p className="mt-3 text-sm font-medium text-red-700">{message}</p>
      {onRetry ? (
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function EmptyState({ title = 'Nothing to show yet', message, action }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-mist/50 px-6 py-14 text-center">
      <MagnifyingGlass size={30} weight="duotone" className="mx-auto text-brand/70" />
      <h3 className="mt-3 text-base font-semibold text-navy">{title}</h3>
      {message ? <p className="mx-auto mt-2 max-w-md text-sm text-muted">{message}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ProductsEmptyState({ title = 'No products found', message, onClear }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-mist/50 px-6 py-14 text-center">
      <Package size={30} weight="duotone" className="mx-auto text-brand/70" />
      <h3 className="mt-3 text-base font-semibold text-navy">{title}</h3>
      {message ? <p className="mx-auto mt-2 max-w-md text-sm text-muted">{message}</p> : null}
      {onClear ? (
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        </div>
      ) : null}
    </div>
  );
}
