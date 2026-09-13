/**
 * How confidently we can say an animal is still around.
 *
 * The homepage used to treat "not seen for 12 hours" as an emergency, which on
 * a campus of ~250 dogs where PawBook tracks nine is mostly noise — nobody
 * logging a sighting is far more often the app not being opened than the dog
 * being gone. These thresholds follow the Peking University campus-cat app's
 * status taxonomy, which has run at real scale: a fortnight without a sighting
 * is worth a nudge, six weeks is worth a question.
 *
 * None of this is a population estimate. PawBook's data covers too small a
 * fraction of the campus for any count derived from it to mean anything, and
 * this module makes no attempt to produce one.
 */

import type { Animal } from './demo-data';

export type Presence = 'recent' | 'fading' | 'unseen' | 'unknown';

export const FADING_AFTER_DAYS = 14;
export const UNSEEN_AFTER_DAYS = 45;

export interface PresenceInfo {
  state: Presence;
  /** Whole days since the last sighting, or null when there has never been one. */
  daysSinceSeen: number | null;
  label: string;
}

function lastSightingMs(animal: Pick<Animal, 'last_seen' | 'last_fed' | 'last_cared_at'>): number | null {
  const stamps = [animal.last_seen, animal.last_fed, animal.last_cared_at]
    .map((value) => (value ? Date.parse(value) : NaN))
    .filter((value) => !Number.isNaN(value));
  return stamps.length ? Math.max(...stamps) : null;
}

export function getPresence(
  animal: Pick<Animal, 'last_seen' | 'last_fed' | 'last_cared_at' | 'status'>,
  now = Date.now(),
): PresenceInfo {
  if (animal.status === 'deceased') {
    return { state: 'unknown', daysSinceSeen: null, label: '' };
  }

  const last = lastSightingMs(animal);
  if (last === null) {
    return { state: 'unknown', daysSinceSeen: null, label: 'No sightings recorded yet' };
  }

  const days = Math.floor((now - last) / 86_400_000);

  if (days >= UNSEEN_AFTER_DAYS) {
    return { state: 'unseen', daysSinceSeen: days, label: `Not seen in ${days} days — is everything alright?` };
  }
  if (days >= FADING_AFTER_DAYS) {
    return { state: 'fading', daysSinceSeen: days, label: `Not seen in ${days} days` };
  }
  return { state: 'recent', daysSinceSeen: days, label: days === 0 ? 'Seen today' : `Seen ${days} day${days === 1 ? '' : 's'} ago` };
}
