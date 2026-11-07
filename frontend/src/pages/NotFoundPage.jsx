import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from '@phosphor-icons/react';
import Button from '../components/Button.jsx';

export default function NotFoundPage() {
  return (
    <section className="section">
      <div className="container-x">
        <div className="mx-auto max-w-xl text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-mist text-brand">
            <Compass size={28} weight="duotone" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-semibold text-navy">Page not found</h1>
          <p className="mt-3 text-[15px] leading-7 text-muted">
            The page you are looking for may have been moved or is no longer available. Use the links below to continue
            browsing.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button to="/" withArrow>
              Back to home
            </Button>
            <Button to="/products" variant="outline">
              Browse products
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] text-muted">
            <Link to="/solar-lighting" className="inline-flex items-center gap-1 hover:text-brand">
              Solar lighting <ArrowRight size={12} weight="bold" />
            </Link>
            <Link to="/china-import" className="inline-flex items-center gap-1 hover:text-brand">
              China import services <ArrowRight size={12} weight="bold" />
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-1 hover:text-brand">
              Contact us <ArrowRight size={12} weight="bold" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
