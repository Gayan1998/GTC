import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';

const BASE =
  'group inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-300 ease-smooth active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60';

const SIZES = {
  sm: 'px-3.5 py-2 text-[13px]',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-[15px]',
};

const VARIANTS = {
  primary: 'bg-action text-white shadow-[0_12px_28px_-14px_rgba(23,105,210,0.85)] hover:bg-brand',
  navy: 'bg-navy text-white hover:bg-[#0e2f52]',
  outline: 'border border-line bg-white text-navy hover:border-brand hover:text-brand',
  ghost: 'text-navy hover:bg-mist',
  white: 'bg-white text-navy shadow-card hover:bg-mist',
  whatsapp: 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  outlineLight: 'border border-white/50 bg-transparent text-white hover:border-white hover:bg-white/10',
};

export default function Button({
  to,
  href,
  children,
  variant = 'primary',
  size = 'md',
  withArrow = false,
  className = '',
  type = 'button',
  ...rest
}) {
  const classes = `${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${className}`;
  const content = (
    <>
      {children}
      {withArrow ? (
        <ArrowRight
          size={16}
          weight="bold"
          className="transition-transform duration-300 ease-smooth group-hover:translate-x-0.5"
        />
      ) : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button type={type} className={classes} {...rest}>
      {content}
    </button>
  );
}
