import { useState, useCallback, useEffect, DependencyList } from 'react';

interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: () => Promise<T | null>;
}

/**
 * Custom hook for making API calls with loading and error states
 * @param apiFunction The API function to call
 * @returns Object with data, loading, error, and execute function
 */
export function useApi<T, A extends any[]>(
  apiFn: (...args: A) => Promise<T>,
  ...args: A
): ApiResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFn(...args);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiFn, ...args]);

  return { data, loading, error, execute };
}

/**
 * Hook for making API calls with automatic execution
 * Executes the API call on mount and when dependencies change
 */
export function useApiEffect<T, A extends any[]>(
  apiFn: (...args: A) => Promise<T>,
  deps: DependencyList = [],
  ...args: A
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<T | null>;
} {
  const { data, loading, error, execute } = useApi(apiFn, ...args);

  // Execute API call on mount and when dependencies change
  useEffect(() => {
    execute();
  }, deps); // Note: deps is already an array

  return { data, loading, error, refetch: execute };
}

export default useApi;