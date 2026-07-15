import { useEffect, useState } from 'react';

import { useAdminAuth } from '../../auth/useAdminAuth';
import { getErrorMessage } from '../utils/errors';

export function useAdminResource<T>(fetcher: () => Promise<T>, initialValue: T) {
  const { handleSessionError } = useAdminAuth();
  const [data, setData] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetcher();

        if (!ignore) {
          setData(result);
        }
      } catch (err) {
        if (handleSessionError(err)) {
          return;
        }

        if (!ignore) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      ignore = true;
    };
  }, [fetcher, handleSessionError]);

  return { data, isLoading, error };
}
