import Reveal from './Reveal.jsx';

export default function SectionHeading({ eyebrow, title, description, align = 'left', className = '' }) {
  const alignment = align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl';
  return (
    <Reveal className={`${alignment} ${className}`}>
      {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
      {title ? (
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-navy sm:text-3xl md:text-[34px]">
          {title}
        </h2>
      ) : null}
      {description ? <p className="prose-body mt-4">{description}</p> : null}
    </Reveal>
  );
}
