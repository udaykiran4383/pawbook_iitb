/**
 * Avatars for animals with no photo yet.
 *
 * These used to come from DiceBear's `bottts` style — cartoon robots — which
 * was jarring everywhere and genuinely wrong on the Rainbow Bridge, where it
 * meant a dog who had died was memorialised as a robot. These are local,
 * hand-drawn silhouettes instead: no third-party request per card, and a
 * quiet, dignified fallback that suits a memorial as well as a profile.
 *
 * Drawn in the same house style as the doodle background in globals.css —
 * 2.5px stroke, round caps and joins.
 */

import type { Animal } from './demo-data';
import { optimizeImageUrl } from './image-url';

const TINTS: Record<string, { bg: string; ink: string }> = {
  cat: { bg: '#F3E8FF', ink: '#7C5BB8' },
  dog: { bg: '#FFEFD9', ink: '#B5702A' },
  default: { bg: '#E0F2FE', ink: '#2E6E9E' },
};

/** A dog's head: soft dome, floppy ears, muzzle. */
const DOG_PATH = `
  <path d="M34 44c0-12 7-20 16-20s16 8 16 20c0 13-7 21-16 21s-16-8-16-21z"/>
  <path d="M34 34c-6-3-11-1-12 5-1 7 3 13 9 15"/>
  <path d="M66 34c6-3 11-1 12 5 1 7-3 13-9 15"/>
  <path d="M44 46h.01M56 46h.01" stroke-width="5"/>
  <path d="M50 54c-2 0-4 1-4 3s2 3 4 3 4-1 4-3-2-3-4-3z"/>
`;

/** A cat's head: triangular ears, wider cheeks. */
const CAT_PATH = `
  <path d="M32 46c0-11 8-19 18-19s18 8 18 19c0 12-8 20-18 20s-18-8-18-20z"/>
  <path d="M34 34l-4-13 14 7M66 34l4-13-14 7"/>
  <path d="M44 46h.01M56 46h.01" stroke-width="5"/>
  <path d="M50 54l-3 2M50 54l3 2"/>
  <path d="M30 50h-10M30 55h-9M70 50h10M70 55h9" stroke-width="2"/>
`;

/**
 * A silhouette for this animal as an inline `data:` URI — no network request,
 * and it renders identically for everyone.
 */
export function getFallbackAvatar(animal: Pick<Animal, 'animal_type'>): string {
  const type = animal?.animal_type === 'cat' ? 'cat' : animal?.animal_type === 'dog' ? 'dog' : 'default';
  const { bg, ink } = TINTS[type] ?? TINTS.default;
  const art = type === 'cat' ? CAT_PATH : DOG_PATH;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect width="100" height="100" rx="50" fill="${bg}"/>
    <g fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${art}</g>
  </svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
}

/**
 * The image to show for an animal: their own photo when we have one (served
 * through Cloudinary's auto format/quality), otherwise the silhouette.
 */
export function getAnimalAvatar(animal: Pick<Animal, 'animal_type' | 'profile_image'>, width = 200): string {
  if (animal?.profile_image) return optimizeImageUrl(animal.profile_image, { width });
  return getFallbackAvatar(animal);
}
