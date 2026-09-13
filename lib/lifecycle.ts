/**
 * Where an animal is in campus life.
 *
 * The status field has always had four values — active, adopted, missing,
 * deceased — but the app only ever used two of them. Peking University's campus
 * cat atlas (猫谱) runs the same four states under campus metaphors, and that
 * framing did two useful things at real scale: it turned a list of profiles
 * into a living census, and it gave memories a natural moment to be written.
 *
 *   On campus   — active, seen recently
 *   On leave    — missing; nobody has seen them in a while
 *   Graduated   — adopted; left campus for a home
 *   Passed away — deceased
 *
 * "On leave" is suggested, never applied automatically. Six quiet weeks is
 * usually the app not being opened rather than the animal being gone, so the
 * app asks a person to confirm instead of deciding for them.
 */

import type { Animal } from './demo-data';
import { getPresence } from './presence';

export type Lifecycle = Animal['status'];

export const LIFECYCLE: Record<Lifecycle, { label: string; emoji: string; description: string }> = {
  active: { label: 'On campus', emoji: '🎒', description: 'Living on campus and seen recently' },
  missing: { label: 'On leave', emoji: '🧳', description: 'Nobody has seen them in a while' },
  adopted: { label: 'Graduated', emoji: '🎓', description: 'Found a home and left campus' },
  deceased: { label: 'Passed away', emoji: '🕊️', description: 'Remembered on the Rainbow Bridge' },
};

export function lifecycleLabel(status: Lifecycle): string {
  return LIFECYCLE[status]?.label ?? status;
}

/**
 * A status change worth asking about, or null.
 *
 * Only one transition is ever suggested: active → missing, once presence has
 * reached "unseen". The others (someone adopted them, someone found them
 * again, someone died) are things a person knows and the data does not.
 */
export function suggestedLifecycle(
  animal: Pick<Animal, 'status' | 'last_seen' | 'last_fed' | 'last_cared_at'>,
  now = Date.now(),
): { to: Lifecycle; reason: string } | null {
  if (animal.status !== 'active') return null;
  const presence = getPresence(animal, now);
  if (presence.state !== 'unseen') return null;
  return {
    to: 'missing',
    reason: `Not seen in ${presence.daysSinceSeen} days. Mark as on leave? You can undo this the moment someone spots them.`,
  };
}

/** Counts by lifecycle, for the homepage census line. */
export function lifecycleCounts(animals: Pick<Animal, 'status'>[]): Record<Lifecycle, number> {
  const counts: Record<Lifecycle, number> = { active: 0, missing: 0, adopted: 0, deceased: 0 };
  for (const animal of animals) {
    if (animal.status in counts) counts[animal.status] += 1;
  }
  return counts;
}
