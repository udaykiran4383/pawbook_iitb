/**
 * A schematic campus map — zones as blobs, not coordinates as points.
 *
 * Every piece of research on this project converged on one rule: a public map
 * of where each animal sleeps is a targeting list. So this is not that. It is
 * an illustrated, not-to-scale picture of the campus with each animal drawn in
 * the *area* people already know them by — "H11", "near the library" — which
 * is exactly what the animal's public page says in words anyway. The position
 * inside a zone is a deterministic scatter seeded by the animal's id, so it is
 * stable between renders and means nothing.
 *
 * Layout is per-campus. IIT Bombay is drawn by hand below; any other campus
 * falls back to a tidy grid of its configured zones until someone draws it.
 */

import { campus } from './campus';
import { calculateSimilarity } from './duplicate-detection';

export interface MapZone {
  id: string;
  label: string;
  /** Centre and radii of the blob, in a 1000×700 viewBox. */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Words that map an animal's free-text location onto this zone. */
  aliases: string[];
  tint: string;
}

export interface MapLayout {
  zones: MapZone[];
  /** Optional decorative features: the lake, roads. */
  lake?: { path: string };
  roads?: string[];
  caption: string;
}

/** IIT Bombay, Powai. Schematic — north is roughly up, nothing is to scale. */
const IITB: MapLayout = {
  caption: 'IIT Bombay, roughly. Not to scale, and not where anyone sleeps — just the areas they are known by.',
  lake: {
    // Powai Lake wraps the campus's east and south-east.
    path: 'M 760 120 C 900 100, 990 220, 985 380 C 980 540, 900 690, 760 695 C 700 698, 690 600, 720 520 C 745 450, 700 380, 730 300 C 750 240, 720 160, 760 120 Z',
  },
  roads: [
    'M 500 690 C 500 600, 480 520, 500 440 C 520 360, 500 260, 520 160',
    'M 120 420 C 260 400, 380 430, 500 440 C 620 450, 660 400, 710 330',
    'M 180 250 C 300 230, 420 250, 520 160',
  ],
  zones: [
    { id: 'main-gate', label: 'Main Gate', cx: 500, cy: 640, rx: 70, ry: 30, aliases: ['main gate', 'gate'], tint: '#FFE3C2' },
    { id: 'yp-gate', label: 'YP Gate', cx: 560, cy: 80, rx: 60, ry: 28, aliases: ['yp gate', 'y point', 'y-point'], tint: '#FFE3C2' },
    { id: 'academic', label: 'Library & Academic Area', cx: 500, cy: 350, rx: 120, ry: 70, aliases: ['library', 'ee', 'electrical', 'department', 'dept', 'admin', 'main building', 'academic', 'lecture', 'lhc', 'convocation'], tint: '#CFE6FF' },
    { id: 'canteen', label: 'Canteen Area', cx: 620, cy: 440, rx: 60, ry: 34, aliases: ['canteen', 'mess', 'gulmohar', 'cafe'], tint: '#FFD9E2' },
    { id: 'sports', label: 'Sports Complex', cx: 300, cy: 500, rx: 90, ry: 50, aliases: ['sports', 'gymkhana', 'ground', 'swimming', 'basketball', 'football', 'stadium'], tint: '#C9F0DC' },
    { id: 'h1-4', label: 'H1 – H4', cx: 250, cy: 610, rx: 90, ry: 42, aliases: ['h1', 'h2', 'h3', 'h4', 'hostel 1', 'hostel 2', 'hostel 3', 'hostel 4'], tint: '#E7DBFF' },
    { id: 'h5-8', label: 'H5 – H8', cx: 130, cy: 460, rx: 80, ry: 48, aliases: ['h5', 'h6', 'h7', 'h8', 'hostel 5', 'hostel 6', 'hostel 7', 'hostel 8'], tint: '#E7DBFF' },
    { id: 'h9-11', label: 'H9 – H11', cx: 150, cy: 300, rx: 80, ry: 48, aliases: ['h9', 'h10', 'h11', 'hostel 9', 'hostel 10', 'hostel 11'], tint: '#E7DBFF' },
    { id: 'h12-16', label: 'H12 – H16', cx: 320, cy: 150, rx: 110, ry: 50, aliases: ['h12', 'h13', 'h14', 'h15', 'h16', 'hostel 12', 'hostel 13', 'hostel 14', 'hostel 15', 'hostel 16'], tint: '#E7DBFF' },
    { id: 'h21', label: 'H21 (Tansa)', cx: 640, cy: 200, rx: 60, ry: 36, aliases: ['h21', 'hostel 21', 'tansa'], tint: '#E7DBFF' },
    { id: 'hillside', label: 'Hillside', cx: 90, cy: 150, rx: 70, ry: 60, aliases: ['hill', 'hillside', 'forest', 'quarry'], tint: '#DDEFD3' },
    { id: 'lakeside', label: 'Lakeside', cx: 700, cy: 560, rx: 55, ry: 60, aliases: ['lake', 'powai', 'boat club', 'lakeside'], tint: '#DDEFD3' },
  ],
};

/** Any other campus: its configured zones laid out on a grid. Better than nothing. */
function gridLayout(zones: string[]): MapLayout {
  const cols = Math.max(2, Math.ceil(Math.sqrt(zones.length)));
  const rows = Math.ceil(zones.length / cols);
  const cellW = 1000 / cols;
  const cellH = 620 / rows;
  const tints = ['#FFE3C2', '#CFE6FF', '#FFD9E2', '#C9F0DC', '#E7DBFF', '#DDEFD3'];
  return {
    caption: `${campus.name}, as a grid of its areas. Not to scale, and not where anyone sleeps.`,
    zones: zones.map((label, i) => ({
      id: `z${i}`,
      label,
      cx: cellW * (i % cols) + cellW / 2,
      cy: 40 + cellH * Math.floor(i / cols) + cellH / 2,
      rx: Math.min(cellW * 0.42, 120),
      ry: Math.min(cellH * 0.38, 60),
      aliases: [label.toLowerCase()],
      tint: tints[i % tints.length],
    })),
  };
}

export function getMapLayout(): MapLayout {
  return campus.shortName === 'IITB' ? IITB : gridLayout(campus.zones);
}

/** Which zone an animal's free-text location belongs to, or null. */
export function zoneFor(location: string | undefined, layout: MapLayout): MapZone | null {
  const text = (location ?? '').trim().toLowerCase();
  if (!text) return null;

  // Exact alias containment first ("near H11 mess" → H9–H11 via "h11").
  for (const zone of layout.zones) {
    for (const alias of zone.aliases) {
      const re = new RegExp(`(^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`);
      if (re.test(text)) return zone;
    }
  }
  // Then fuzzy against labels, for typos.
  let best: MapZone | null = null;
  let bestScore = 0.6;
  for (const zone of layout.zones) {
    const score = calculateSimilarity(text, zone.label.toLowerCase());
    if (score > bestScore) { best = zone; bestScore = score; }
  }
  return best;
}

/** Deterministic scatter inside a zone. Same animal, same spot, meaning nothing. */
export function scatter(id: number, zone: MapZone, index: number, total: number): { x: number; y: number } {
  // Golden-angle spiral gives an even spread without clumping.
  const angle = index * 2.399963 + (id % 7) * 0.31;
  const r = Math.sqrt((index + 0.5) / Math.max(1, total)) * 0.72;
  return {
    x: zone.cx + Math.cos(angle) * r * zone.rx,
    y: zone.cy + Math.sin(angle) * r * zone.ry,
  };
}
