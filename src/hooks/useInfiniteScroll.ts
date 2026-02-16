import { useEffect, useRef, useState } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number; // Distance from bottom in pixels before loading more
}

/**
 * Hook pour implémenter le chargement infini au scroll
 * Charge automatiquement plus de contenu quand l'utilisateur approche du bas de la page
 */
export function useInfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  threshold = 200
}: UseInfiniteScrollOptions) {
  const [isFetching, setIsFetching] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Si l'élément est visible et on a plus de contenu à charger
        if (entries[0].isIntersecting && hasMore && !loading && !isFetching) {
          setIsFetching(true);
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: `${threshold}px`,
        threshold: 0.1
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, isFetching, onLoadMore, threshold]);

  // Réinitialiser isFetching quand le chargement est terminé
  useEffect(() => {
    if (!loading) {
      setIsFetching(false);
    }
  }, [loading]);

  return { observerTarget, isFetching };
}
