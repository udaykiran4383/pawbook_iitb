import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the service-role key.
 *
 * The client is created lazily on first use rather than at module load.
 * Throwing at import time breaks `next build`: page-data collection imports
 * every route module, so one missing runtime secret fails the whole build and
 * nothing deploys — including the pages that don't need Supabase at all.
 *
 * Deferring the check keeps the build green and turns a missing key into a
 * clear runtime error on the routes that actually need it. Callers should
 * catch `SupabaseAdminUnavailableError` and return 503.
 */

export class SupabaseAdminUnavailableError extends Error {
  constructor() {
    super(
      'Supabase admin environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
    this.name = 'SupabaseAdminUnavailableError';
  }
}

let client: SupabaseClient | null = null;

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Note: an env var that is present but empty counts as missing.
  if (!supabaseUrl || !serviceRoleKey) {
    throw new SupabaseAdminUnavailableError();
  }

  client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return client;
}

/**
 * Backwards-compatible proxy so existing `supabaseAdmin.from(...)` call sites
 * keep working unchanged. Property access is what triggers construction, so
 * merely importing this module is always safe.
 */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, property, receiver) {
    const value = Reflect.get(getSupabaseAdmin() as object, property, receiver);
    return typeof value === 'function' ? value.bind(getSupabaseAdmin()) : value;
  },
});
