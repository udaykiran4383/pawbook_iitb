/**
 * Server-side read of the shared state row.
 *
 * The app's data lives in one `pawbook_state` row that the browser normally
 * loads through /api/state. Server components need it too — a per-animal page
 * has to render its content and its link-preview metadata before any JavaScript
 * runs — so this reads the same row directly.
 *
 * Every failure degrades to an empty list rather than throwing. The Supabase
 * project can be paused or the credentials absent (lib/supabase-admin.ts throws
 * at import when they are), and a missing database should give a clean "not
 * found" page, not a crashed route.
 */

import type { Animal } from './demo-data';
import { DEFAULT_CAMPUS_SLUG, stateIdFor } from './campuses';

export async function getAnimalsFromDb(campusSlug: string = DEFAULT_CAMPUS_SLUG): Promise<Animal[]> {
  const STATE_ID = stateIdFor(campusSlug);
  try {
    // Imported lazily and inside the try so absent credentials degrade here
    // instead of taking down every route that touches this module.
    const { supabaseAdmin } = await import('./supabase-admin');

    const { data, error } = await supabaseAdmin
      .from('pawbook_state')
      .select('data')
      .eq('id', STATE_ID)
      .single();

    if (error) return [];

    const animals = (data as any)?.data?.state?.animals;
    return Array.isArray(animals) ? (animals as Animal[]) : [];
  } catch {
    return [];
  }
}

export async function getAnimalById(id: number, campusSlug: string = DEFAULT_CAMPUS_SLUG): Promise<Animal | null> {
  const animals = await getAnimalsFromDb(campusSlug);
  return animals.find((animal) => animal?.id === id) ?? null;
}
