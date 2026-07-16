import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../auth/useAuth';
import { getErrorMessage } from '../utils/errors';

export function useResource<T>(fetcher: () => Promise<T>, initialValue: T) {
  const { handleSessionError } = useAuth();
  const [data, setData] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

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
  }, [fetcher, handleSessionError, reloadKey]);

  return { data, isLoading, error, reload };
}
