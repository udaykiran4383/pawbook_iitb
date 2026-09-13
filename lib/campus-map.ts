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
  /**
   * Approximate real-world centre and radius (metres) for the geographic view.
   * Approximate on purpose: animals are scattered inside this circle, never
   * placed at a measured point. Missing means the zone only appears on the
   * sketch.
   */
  geo?: { lat: number; lng: number; radius: number };
}

export interface MapLayout {
  zones: MapZone[];
  /** Where the geographic view opens. */
  center?: { lat: number; lng: number; zoom: number };
  /** Optional decorative features: the lake, roads. */
  lake?: { path: string };
  roads?: string[];
  caption: string;
}

/**
 * Project a real position onto the 1000×745 sketch so the sketch and the
 * street map agree about where things are. Linear is fine at campus scale.
 */
const SKETCH = { west: 72.9025, east: 72.9215, north: 19.1395, south: 19.1225 };
function project(lat: number, lng: number): { cx: number; cy: number } {
  return {
    cx: 60 + ((lng - SKETCH.west) / (SKETCH.east - SKETCH.west)) * 880,
    cy: 50 + ((SKETCH.north - lat) / (SKETCH.north - SKETCH.south)) * 640,
  };
}

/**
 * IIT Bombay, Powai. Zone centres come from OpenStreetMap features (hostels,
 * gates, the library, the gymkhana, the boathouse), averaged per cluster and
 * then rounded — the app never needs, and deliberately does not keep, anything
 * more precise than "around here". North is up. Powai Lake is to the west and
 * south-west of the campus; Hillside is the ridge on the east.
 */
function zone(
  id: string, label: string, lat: number, lng: number, radius: number,
  aliases: string[], tint: string, sketchRx: number, sketchRy: number,
): MapZone {
  return { id, label, ...project(lat, lng), rx: sketchRx, ry: sketchRy, aliases, tint, geo: { lat, lng, radius } };
}

const IITB: MapLayout = {
  caption: 'IIT Bombay, roughly. Not to scale, and not where anyone sleeps — just the areas they are known by.',
  center: { lat: 19.1325, lng: 72.9125, zoom: 15.1 },
  lake: {
    // Powai Lake, along the west and south-west edge. Drawn, not surveyed.
    path: 'M 40 300 C 120 260, 200 330, 230 420 C 260 520, 200 600, 260 700 L 40 720 Z',
  },
  roads: [
    // Main Gate Road, south gate curving north-west through the hostels.
    'M 700 700 C 660 560, 560 480, 470 420 C 380 360, 260 300, 200 250',
    // Hostel Road along the north.
    'M 300 190 C 420 175, 540 170, 640 165',
  ],
  zones: [
    zone('yp-gate', 'YP Gate', 19.1284, 72.9192, 90, ['yp gate', 'y point', 'y-point', 'market gate'], '#FFE3C2', 55, 26),
    zone('main-gate', 'Main Gate', 19.1256, 72.9163, 90, ['main gate', 'gate'], '#FFE3C2', 65, 28),
    zone('academic', 'Library & Academic Area', 19.1325, 72.9158, 220, ['library', 'ee', 'electrical', 'department', 'dept', 'admin', 'main building', 'academic', 'lecture', 'lhc', 'convocation', 'infinite corridor'], '#CFE6FF', 110, 62),
    zone('canteen', 'Gulmohar & Canteens', 19.1298, 72.9151, 80, ['canteen', 'mess', 'gulmohar', 'cafe'], '#FFD9E2', 60, 30),
    zone('sports', 'Gymkhana & Grounds', 19.1346, 72.9124, 120, ['sports', 'gymkhana', 'ground', 'swimming', 'basketball', 'football', 'stadium'], '#C9F0DC', 75, 40),
    zone('h1-4', 'H1 – H4 · Tansa', 19.1367, 72.9120, 160, ['h1', 'h2', 'h3', 'h4', 'hostel 1', 'hostel 2', 'hostel 3', 'hostel 4', 'tansa'], '#E7DBFF', 95, 40),
    zone('h5-9', 'H5 · H6 · H9', 19.1353, 72.9082, 160, ['h5', 'h6', 'h9', 'hostel 5', 'hostel 6', 'hostel 9'], '#E7DBFF', 90, 42),
    zone('h7-21', 'H7 · H8 · H11 · H21', 19.1333, 72.9114, 130, ['h7', 'h8', 'h11', 'h21', 'hostel 7', 'hostel 8', 'hostel 11', 'hostel 21'], '#E7DBFF', 95, 40),
    zone('h12-14', 'H12 – H14', 19.1350, 72.9052, 150, ['h12', 'h13', 'h14', 'hostel 12', 'hostel 13', 'hostel 14'], '#E7DBFF', 85, 42),
    zone('h15-16', 'H15 · H16', 19.1378, 72.9134, 110, ['h15', 'h16', 'hostel 15', 'hostel 16'], '#E7DBFF', 70, 32),
    zone('h10', 'H10', 19.1289, 72.9158, 90, ['h10', 'hostel 10'], '#E7DBFF', 50, 28),
    zone('hillside', 'Hillside', 19.1345, 72.9185, 140, ['hill', 'hillside', 'forest', 'quarry'], '#DDEFD3', 70, 60),
    zone('lakeside', 'Lakeside & Boathouse', 19.1290, 72.9105, 150, ['lake', 'powai', 'boat', 'boathouse', 'lakeside'], '#DDEFD3', 75, 55),
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
