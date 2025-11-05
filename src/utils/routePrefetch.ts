import { useEffect } from 'react';

export const usePrefetchRoute = (path: string) => {
  useEffect(() => {
    const prefetchTimeout = setTimeout(() => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = path;
      document.head.appendChild(link);
    }, 1000);

    return () => clearTimeout(prefetchTimeout);
  }, [path]);
};
