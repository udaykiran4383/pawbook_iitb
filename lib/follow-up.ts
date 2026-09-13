/**
 * The follow-up question: "Last time you saw Bruno near H11. Still around?"
 *
 * FixMyStreet asks reporters four weeks later whether the pothole was fixed,
 * and that one question is where most of its outcome data comes from. Ours is
 * the same shape. A person who logged a sighting is the one person who knows
 * where to look again, and asking them once, a week or a month on, is how the
 * app learns that an animal has moved or gone — the absence signal that a
 * feed of sightings alone never produces.
 *
 * Which animals this device has interacted with lives in localStorage, keyed
 * by animal id with the time of the last interaction. Nothing about who is
 * stored, only that this phone was near that animal.
 */

import type { Animal } from './demo-data';

export const MY_SIGHTINGS_KEY = 'pawbook_my_sightings';
export const FOLLOWUP_SHOWN_KEY = 'pawbook_followup_shown';

/** Ask after a week — long enough for things to change — and not after a month, when nobody remembers. */
export const FOLLOWUP_MIN_DAYS = 7;
export const FOLLOWUP_MAX_DAYS = 30;

/** animalId -> ISO time of this device's last sighting/feed for it. */
export type MySightings = Record<string, string>;

export interface FollowUp {
  animal: Animal;
  /** Where they were when this device last logged them. */
  zone: string;
  daysAgo: number;
}

const DAY = 86_400_000;

/**
 * The one animal worth asking about, or null.
 *
 * Pure so it can be tested against fixtures: given the current animal list,
 * this device's interaction history and the clock, pick the animal whose
 * last interaction is 7–30 days old. Deceased animals are skipped (the answer
 * is known), and so are ids that are no longer in the list. When several
 * qualify, the oldest interaction wins — that is the one closest to falling
 * out of the window.
 */
export function pickFollowUp(
  animals: Animal[],
  mySightings: MySightings,
  now = Date.now(),
): FollowUp | null {
  let best: FollowUp | null = null;

  for (const [idStr, lastAtISO] of Object.entries(mySightings ?? {})) {
    const at = Date.parse(lastAtISO);
    if (Number.isNaN(at)) continue;
    const daysAgo = Math.floor((now - at) / DAY);
    if (daysAgo < FOLLOWUP_MIN_DAYS || daysAgo > FOLLOWUP_MAX_DAYS) continue;

    const animal = animals.find((a) => a.id === Number(idStr));
    if (!animal || animal.status === 'deceased') continue;

    if (!best || daysAgo > best.daysAgo) {
      // The most recent zone in the log is where they were; fall back to the
      // home location for animals that predate the sighting log.
      const zone = animal.sightings?.[0]?.zone || animal.location;
      best = { animal, zone, daysAgo };
    }
  }

  return best;
}

/** Read this device's history. Blocked or missing storage reads as empty. */
export function readMySightings(): MySightings {
  try {
    const raw = window.localStorage.getItem(MY_SIGHTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Note that this device just logged something for an animal. Called after the
 * store write, never instead of it: if storage is blocked the sighting still
 * counts, we just won't ask about it later.
 */
export function rememberMySighting(animalId: number, at = new Date()): void {
  try {
    const mine = readMySightings();
    mine[String(animalId)] = at.toISOString();
    window.localStorage.setItem(MY_SIGHTINGS_KEY, JSON.stringify(mine));
  } catch {
    // Storage blocked; nothing to remember with.
  }
}

/** Forget an animal once we've asked, so the same question is never asked twice. */
export function forgetMySighting(animalId: number): void {
  try {
    const mine = readMySightings();
    delete mine[String(animalId)];
    window.localStorage.setItem(MY_SIGHTINGS_KEY, JSON.stringify(mine));
  } catch {}
}

/** True at most once per calendar day on this device. */
export function shownToday(now = new Date()): boolean {
  try {
    return window.localStorage.getItem(FOLLOWUP_SHOWN_KEY) === now.toISOString().slice(0, 10);
  } catch {
    return false;
  }
}

export function markShownToday(now = new Date()): void {
  try {
    window.localStorage.setItem(FOLLOWUP_SHOWN_KEY, now.toISOString().slice(0, 10));
  } catch {}
}
