/**
 * Designated feeding spots.
 *
 * "Fixed spot, fixed time, only what is eaten, cleared afterwards" is no
 * longer advice; on Indian campuses it is what the institution is expected to
 * arrange and what a feeder is expected to follow. Until now PawBook recorded
 * feeding per animal (last_fed) and said nothing about where. This is the
 * where: a station is a named spot in a zone, with the hours it is fed, and
 * the two facts a passer-by actually wants — is there food out, and has it
 * been cleaned up.
 *
 * Georgia Tech's Campus Cats tracks its stations the same way, as objects with
 * a stocked / needs-food state that any volunteer can flip. The Japanese
 * 地域猫 (community cat) programmes go further and make the cleared-bowl rule
 * the condition of being allowed to feed at all, which is why "Cleared up" is
 * a first-class action here and not a note.
 *
 * A station is a zone, never a coordinate. The whole point of a designated
 * spot is that it is public knowledge on campus; the point of not storing a
 * position is that it is not public knowledge to the internet.
 */

export interface FeedingStation {
  id: string;
  /** "Bowl behind H11", "Library steps". */
  name: string;
  /** Coarse area from the campus zone list. Free text still allowed. */
  zone: string;
  /** Feeding hours as 24h "HH:MM", e.g. ["07:00", "19:00"]. */
  times?: string[];
  notes?: string;
  /** False once the institution withdraws the spot; kept for the record. */
  active: boolean;
  last_stocked_at?: string;
  /** Pseudonym or the anonymous label. Never a real identity. */
  last_stocked_by?: string;
  last_cleared_at?: string;
  /** Someone passed by and the bowl was empty. Cleared by the next stocking. */
  needs_food: boolean;
  /** When it was last flagged; lets two phones agree on which event is newer. */
  needs_food_at?: string;
  /** Last change to the spot itself (active, hours). Not touched by stocking. */
  updated_at?: string;
  created_at: string;
}

export type StationStatus = 'stocked' | 'needs_food' | 'stale' | 'inactive';

/**
 * A twice-a-day spot that nobody has recorded stocking in a day and a half
 * has either been missed or nobody is logging. Either way it deserves a look,
 * which is different from someone having seen the bowl empty.
 */
export const STALE_AFTER_MS = 36 * 60 * 60 * 1000;

export const STATUS_LABEL: Record<StationStatus, string> = {
  stocked: 'Stocked',
  needs_food: 'Needs food',
  stale: 'No update in 36h',
  inactive: 'Not in use',
};

export function stationStatus(station: FeedingStation, now: number = Date.now()): StationStatus {
  if (!station.active) return 'inactive';
  if (station.needs_food) return 'needs_food';
  const stocked = Date.parse(station.last_stocked_at ?? '');
  if (Number.isNaN(stocked) || now - stocked > STALE_AFTER_MS) return 'stale';
  return 'stocked';
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** True for "07:00" and "19:30"; false for "7am" or "25:00". */
export function isFeedingTime(value: string): boolean {
  return TIME_RE.test(value);
}

/**
 * "7:00, 19:00" or "07:00 19:00" from a form field into a sorted, deduplicated
 * list of "HH:MM". Anything that is not a time is dropped rather than rejected,
 * because the field is optional and a typo should not block adding the spot.
 */
export function parseTimes(input: string): string[] {
  const seen = new Set<string>();
  for (const raw of input.split(/[,\s;]+/)) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(raw.trim());
    if (!m) continue;
    const padded = `${m[1].padStart(2, '0')}:${m[2]}`;
    if (isFeedingTime(padded)) seen.add(padded);
  }
  return Array.from(seen).sort();
}

/** "07:00" → "7:00 am"; "19:30" → "7:30 pm". Unparseable values pass through. */
export function formatFeedingTime(time: string): string {
  const m = TIME_RE.exec(time);
  if (!m) return time;
  const hours = Number(m[1]);
  const suffix = hours < 12 ? 'am' : 'pm';
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelve}:${m[2]} ${suffix}`;
}

export interface FeedingWindow {
  /** The "HH:MM" entry this window belongs to. */
  time: string;
  /** Epoch milliseconds of the next occurrence, in the caller's local time. */
  at: number;
}

/**
 * The next scheduled feed at or after `now`, or null for a spot without hours.
 *
 * Local time on purpose: the hours were typed by someone standing on the
 * campus, and the reader is on the same campus. A spot fed at 19:00 that is
 * read at 19:00 exactly is due now, not tomorrow.
 */
export function nextFeedingWindow(station: FeedingStation, now: number = Date.now()): FeedingWindow | null {
  const times = (station.times ?? []).filter(isFeedingTime);
  if (times.length === 0) return null;

  const today = new Date(now);
  let best: FeedingWindow | null = null;
  for (const time of times) {
    const [h, m] = time.split(':').map(Number);
    const candidate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, 0, 0);
    if (candidate.getTime() < now) candidate.setDate(candidate.getDate() + 1);
    const at = candidate.getTime();
    if (best === null || at < best.at) best = { time, at };
  }
  return best;
}

/** "just now", "3h ago", "2d ago" — enough for a glance at a bowl. */
export function sinceLabel(iso: string | undefined, now: number = Date.now()): string | null {
  const t = Date.parse(iso ?? '');
  if (Number.isNaN(t)) return null;
  const minutes = Math.max(0, Math.round((now - t) / 60_000));
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** Active spots first, then by zone and name, so the list reads like a route. */
export function sortStations(stations: FeedingStation[]): FeedingStation[] {
  return [...stations].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    const zone = a.zone.localeCompare(b.zone);
    return zone !== 0 ? zone : a.name.localeCompare(b.name);
  });
}
