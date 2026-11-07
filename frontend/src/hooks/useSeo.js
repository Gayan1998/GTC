import { useEffect } from 'react';

// Client-side document head management. The site is a static SPA, so metadata
// is applied at runtime; see docs/architecture.md for the SEO limitations.

function upsertMeta(attribute, key, content) {
  if (!content) return;
  let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

export function useSeo({ title, description, image, type = 'website', jsonLd } = {}) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:url', window.location.href);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);
    upsertLink('canonical', window.location.origin + window.location.pathname);

    let script = null;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => {
      if (script) document.head.removeChild(script);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, image, type, JSON.stringify(jsonLd || {})]);
}
