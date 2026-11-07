import { useState } from 'react';
import { ImageSquare } from '@phosphor-icons/react';

/**
 * Image with lazy loading and a graceful fallback when the source is missing
 * or fails to load. Tracks the specific source that failed so a later valid
 * source (after async data loads) is still displayed.
 */
export default function SmartImage({ src, alt = '', className = '', ...rest }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showFallback = !src || failedSrc === src;

  if (showFallback) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-mist ${className}`}
      >
        <ImageSquare size={30} weight="duotone" className="text-brand/40" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailedSrc(src)}
      className={className}
      {...rest}
    />
  );
}
