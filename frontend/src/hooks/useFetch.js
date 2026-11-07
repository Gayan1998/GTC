import { useEffect, useRef, useState } from 'react';

/**
 * Observe an element and add `is-visible` once it enters the viewport, used by
 * the `.reveal` CSS class. Uses IntersectionObserver (never scroll listeners).
 */
export function useReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-visible');
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px', ...options }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [options]);

  return ref;
}

/** Generic data-fetching hook with loading/error/empty states. */
export function useFetch(fetcher, deps = [], { immediate = true } = {}) {
  const [state, setState] = useState({ data: null, loading: immediate, error: null });
  const [reloadKey, setReloadKey] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!immediate && reloadKey === 0) return undefined;
    let alive = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    Promise.resolve()
      .then(() => fetcherRef.current())
      .then((data) => {
        if (alive) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (alive) setState({ data: null, loading: false, error: err });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);
  return { ...state, reload };
}
