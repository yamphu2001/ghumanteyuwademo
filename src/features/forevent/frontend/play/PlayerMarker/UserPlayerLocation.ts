
import { useState, useEffect, useCallback, useRef } from 'react';
import { startPlayerTracking, stopPlayerTracking } from './logic';
import type { LngLat } from './type';

export interface UsePlayerLocationOptions {
  enabled?: boolean;
  onError?: (error: GeolocationPositionError) => void;
}

export interface UsePlayerLocationReturn {
  location: LngLat | null;
  accuracy: number | null;
  error: GeolocationPositionError | null;
  isTracking: boolean;
}

/**
 * Custom hook for tracking player location
 * 
 * @param options - Configuration options
 * @returns Current location state and tracking status
 * 
 * @example
 * ```tsx
 * const { location, accuracy, error, isTracking } = usePlayerLocation({
 *   enabled: true,
 *   onError: (err) => console.error(err)
 * });
 * ```
 */
export function usePlayerLocation(
  options: UsePlayerLocationOptions = {}
): UsePlayerLocationReturn {
  const { enabled = true, onError } = options;

  const [location, setLocation] = useState<LngLat | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  
  const watchIdRef = useRef<number | null>(null);

  const handleLocationUpdate = useCallback((coords: LngLat) => {
    setLocation(coords);
    setError(null);
  }, []);

  const handleLocationError = useCallback((err: GeolocationPositionError) => {
    setError(err);
    onError?.(err);
  }, [onError]);

  useEffect(() => {
    if (!enabled) {
      setIsTracking(false);
      return;
    }

    setIsTracking(true);

    watchIdRef.current = startPlayerTracking(
      handleLocationUpdate,
      handleLocationError
    );

    return () => {
      stopPlayerTracking(watchIdRef.current);
      setIsTracking(false);
    };
  }, [enabled, handleLocationUpdate, handleLocationError]);

  return {
    location,
    accuracy,
    error,
    isTracking,
  };
}