/**
 * An animal's life as one chronological story.
 *
 * Memories, the day they were added, medical events and the day they died all
 * live in different fields and different tabs. Read together, in order, they
 * are a life — which is what a memory book is for, and what someone returning
 * after graduating actually wants: "what happened to the dog outside my hostel".
 *
 * With one memory and a handful of events the timeline is sparse. That reads
 * as poignant rather than empty as long as the spacing is deliberate, so
 * entries are grouped by year with the year as a heading, and no year is
 * padded with filler.
 */

import type { Animal, StudentMemory } from './demo-data';

export type StoryKind = 'joined' | 'memory' | 'medical' | 'passed' | 'graduated';

export interface StoryEntry {
  id: string;
  at: string;
  kind: StoryKind;
  title: string;
  body?: string;
  photo_url?: string;
  memory?: StudentMemory;
}

export interface StoryYear {
  year: number;
  entries: StoryEntry[];
}

function parse(value: unknown): number | null {
  const t = typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isNaN(t) ? null : t;
}

export function buildLifeStory(animal: Animal): StoryYear[] {
  const entries: StoryEntry[] = [];

  if (parse(animal.created_at) !== null) {
    entries.push({
      id: 'joined',
      at: animal.created_at,
      kind: 'joined',
      title: `${animal.name} joins PawBook`,
      body: animal.location ? `First recorded near ${animal.location}.` : undefined,
    });
  }

  for (const m of Array.isArray(animal.memories) ? animal.memories : []) {
    if (parse(m?.timestamp) === null) continue;
    entries.push({
      id: `m-${m.id}`,
      at: m.timestamp,
      kind: 'memory',
      title: m.text,
      photo_url: m.photo_url,
      memory: m,
    });
  }

  for (const r of Array.isArray(animal.medical_records) ? animal.medical_records : []) {
    const at = (r as any)?.record_date ?? (r as any)?.date ?? (r as any)?.created_at;
    if (parse(at) === null) continue;
    entries.push({
      id: `r-${r.id}`,
      at,
      kind: 'medical',
      title: (r as any).title ?? (r as any).record_type ?? 'Medical record',
      body: (r as any).description,
    });
  }

  if (animal.status === 'deceased' && parse(animal.death_date) !== null) {
    entries.push({
      id: 'passed',
      at: animal.death_date as string,
      kind: 'passed',
      title: `${animal.name} passes away`,
      body: animal.death_note,
    });
  }

  if (animal.status === 'adopted') {
    // No adoption date is stored, so the entry sits at the end without a date.
    entries.push({ id: 'graduated', at: new Date().toISOString(), kind: 'graduated', title: `${animal.name} graduates to a home` });
  }

  entries.sort((a, b) => (parse(a.at) ?? 0) - (parse(b.at) ?? 0));

  const years = new Map<number, StoryEntry[]>();
  for (const e of entries) {
    const y = new Date(e.at).getFullYear();
    if (!years.has(y)) years.set(y, []);
    years.get(y)!.push(e);
  }

  return Array.from(years.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, list]) => ({ year, entries: list }));
}

/**
 * "On PawBook for 2 years" / "1 year today" / "3 months" — or null if too new
 * to be worth saying. Used as a quiet line at the top of the memories tab; an
 * anniversary is a natural moment to write something.
 */
export function tenureLine(animal: Pick<Animal, 'name' | 'created_at'>, now = Date.now()): string | null {
  const start = parse(animal.created_at);
  if (start === null) return null;
  const days = Math.floor((now - start) / 86_400_000);
  if (days < 30) return null;

  const startDate = new Date(start);
  const today = new Date(now);
  const isAnniversary =
    days >= 365 && startDate.getDate() === today.getDate() && startDate.getMonth() === today.getMonth();
  const years = Math.floor(days / 365);
  const months = Math.floor(days / 30);

  if (isAnniversary) return `${animal.name} has been on PawBook for ${years} year${years === 1 ? '' : 's'} today 🎉`;
  if (years >= 1) return `On PawBook for ${years} year${years === 1 ? '' : 's'}`;
  return `On PawBook for ${months} month${months === 1 ? '' : 's'}`;
}
