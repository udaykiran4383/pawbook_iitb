/**
 * Stable, shareable URLs for individual animals.
 *
 * Until now the whole app was a single page of modals, so there was no way to
 * link to a particular animal — the share button sent `window.location.href`,
 * which meant sharing a dog shared the homepage, and a QR code had nothing to
 * point at.
 *
 * The slug carries the name for readability and the id for resolution, e.g.
 * `basanti-8089`. The name may change or repeat; the trailing id is what we
 * actually look up, so a renamed animal keeps working from old links.
 */

import type { Animal } from './demo-data';

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function animalSlug(animal: Pick<Animal, 'id' | 'name'>): string {
  const name = slugifyName(animal?.name ?? '');
  return name ? `${name}-${animal.id}` : String(animal.id);
}

/** The id encoded in a slug, or null when it carries none we can read. */
export function animalIdFromSlug(slug: string): number | null {
  if (!slug) return null;
  const trailing = slug.match(/(\d+)$/);
  if (!trailing) return null;
  const id = Number(trailing[1]);
  return Number.isFinite(id) ? id : null;
}

/** '' or '/c/<slug>' — see campusBasePath in lib/campuses.ts. */
export function animalPath(animal: Pick<Animal, 'id' | 'name'>, basePath = ''): string {
  return `${basePath}/animals/${animalSlug(animal)}`;
}
