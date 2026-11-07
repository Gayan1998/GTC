import { useReveal } from '../hooks/useFetch.js';

/** Fade-up wrapper used for section entry animation. */
export default function Reveal({ children, className = '', delay = 0, as: Tag = 'div' }) {
  const ref = useReveal();
  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
