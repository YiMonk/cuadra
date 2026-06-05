import { useState, useCallback } from 'react';
import { ServiceError, toServiceError } from '@/lib/errors';

interface ServiceCallState<T> {
  data: T | null;
  isLoading: boolean;
  error: ServiceError | null;
}

interface ServiceCallActions<T> {
  execute: (...args: Parameters<() => Promise<T>>) => Promise<T | null>;
  reset: () => void;
}

export function useServiceCall<T>(fn: () => Promise<T>): ServiceCallState<T> & ServiceCallActions<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ServiceError | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fn();
      setData(result);
      return result;
    } catch (err) {
      const serviceError = toServiceError(err);
      setError(serviceError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fn]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, isLoading, error, execute, reset };
}
