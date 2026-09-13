'use client';

import { useEffect } from 'react';

/**
 * Registers public/sw.js, which keeps /bite reachable with no signal.
 *
 * Production only: in dev a service worker fights hot reload and serves stale
 * chunks, and the thing it protects — a static page — is not what anyone is
 * debugging locally.
 */
export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // A failed registration just means no offline copy; the site still works.
    });
  }, []);
  return null;
}
