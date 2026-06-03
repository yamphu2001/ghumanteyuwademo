'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistry() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[ServiceWorker] Registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('[ServiceWorker] Registration failed:', error);
        });
    }
  }, []);

  return null;
}