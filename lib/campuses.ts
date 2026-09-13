/**
 * The campus registry: every campus this one deployment serves.
 *
 * lib/campus.ts made PawBook deployable per campus — set some environment
 * variables, deploy your own copy. This goes further: one deployment, many
 * campuses, each at /c/<slug> with its own animals, map, rules and register.
 * A student at IIT Madras should not need a Vercel account to log a sighting.
 *
 * Adding a campus is one object here, and it is deliberately a code change
 * rather than a form. With no accounts, a self-serve "create your campus"
 * button would be an invitation to create a hundred junk campuses; a pull
 * request is a small bar that a real campus group clears in ten minutes and a
 * bot does not. The template at the bottom shows exactly what to fill in.
 *
 * Coordinates for campuses other than IIT Bombay are centre points with
 * generous bounds, and their zones are a sensible default list. Each campus
 * refines its own once it is using the site; nothing depends on them being
 * exact except the "is this reading on campus" check, which errs permissive.
 */

import type { CampusConfig } from './campus';

export interface RegisteredCampus extends CampusConfig {
  /** URL segment: /c/<slug>. Lowercase letters, digits, hyphens. */
  slug: string;
  /** Shown on the campus picker. */
  city: string;
  state: string;
}

const DEFAULT_ZONES = ['Main Gate', 'Library', 'Academic Area', 'Hostels', 'Sports Ground', 'Canteen', 'Staff Quarters'];

/** Bounds as a box around a centre point, in degrees. */
function around(lat: number, lng: number, halfSpan = 0.012) {
  return { minLat: lat - halfSpan, maxLat: lat + halfSpan, minLng: lng - halfSpan, maxLng: lng + halfSpan };
}

export const CAMPUSES: RegisteredCampus[] = [
  {
    slug: 'iitb',
    name: 'IIT Bombay',
    shortName: 'IITB',
    city: 'Mumbai',
    state: 'Maharashtra',
    place: 'Powai, Mumbai',
    siteUrl: 'https://pawbookiitb.vercel.app',
    bounds: { minLat: 19.115, maxLat: 19.145, minLng: 72.9, maxLng: 72.93 },
    zones: [
      'Main Gate', 'YP Gate', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10', 'H11',
      'H12', 'H13', 'H14', 'H15', 'H16', 'H21', 'Library', 'Admin Block', 'Sports Complex',
      'EE Department', 'Canteen Area', 'Powai Lake edge', 'Hillside',
    ],
    welfareGroup: 'IITB Animal Welfare Group',
    authorityOffice: "the Dean of Students' office",
    estimatedPopulation: 250,
    locale: 'en-IN',
  },
  {
    slug: 'iitm',
    name: 'IIT Madras',
    shortName: 'IITM',
    city: 'Chennai',
    state: 'Tamil Nadu',
    place: 'Adyar, Chennai',
    siteUrl: 'https://pawbookiitb.vercel.app',
    bounds: around(12.9915, 80.2337, 0.015),
    zones: ['Main Gate', 'Velachery Gate', 'Taramani Gate', 'Central Library', 'Gajendra Circle', 'Himalaya', 'Hostel Zone', 'Sports Complex', 'Stadium', 'Research Park'],
    authorityOffice: "the Dean of Students' office",
    locale: 'en-IN',
  },
  {
    slug: 'iitd',
    name: 'IIT Delhi',
    shortName: 'IITD',
    city: 'New Delhi',
    state: 'Delhi',
    place: 'Hauz Khas, New Delhi',
    siteUrl: 'https://pawbookiitb.vercel.app',
    bounds: around(28.5449, 77.1926, 0.012),
    zones: ['Main Gate', 'Hostel Gate', 'Central Library', 'Main Building', 'Hostel Zone', 'Sports Complex', 'Nalanda', 'Wind-T'],
    authorityOffice: "the Dean of Students' office",
    locale: 'en-IN',
  },
  {
    slug: 'iitk',
    name: 'IIT Kanpur',
    shortName: 'IITK',
    city: 'Kanpur',
    state: 'Uttar Pradesh',
    siteUrl: 'https://pawbookiitb.vercel.app',
    bounds: around(26.5123, 80.2329, 0.015),
    zones: ['Main Gate', 'Hall 1–5', 'Hall 6–13', 'Library', 'Academic Area', 'Sports Complex', 'Airstrip', 'Type II Colony'],
    authorityOffice: "the Dean of Students' office",
    locale: 'en-IN',
  },
  {
    slug: 'iisc',
    name: 'IISc Bengaluru',
    shortName: 'IISc',
    city: 'Bengaluru',
    state: 'Karnataka',
    siteUrl: 'https://pawbookiitb.vercel.app',
    bounds: around(13.0219, 77.5671, 0.012),
    zones: ['Main Gate', 'Gymkhana', 'Main Building', 'Library', 'Hostel Zone', 'Prakruthi', 'Nesara', 'Tata Book House'],
    authorityOffice: 'the Registrar\'s office',
    locale: 'en-IN',
  },
  // ── Template ─────────────────────────────────────────────────────────────
  // {
  //   slug: 'your-campus',              // /c/your-campus
  //   name: 'Your University',
  //   shortName: 'YU',
  //   city: 'City', state: 'State',
  //   siteUrl: 'https://pawbookiitb.vercel.app',
  //   bounds: around(LAT, LNG, 0.012),  // right-click two corners in a map to check
  //   zones: ['Main Gate', 'Library', 'Hostels', ...],
  //   welfareGroup: 'Your campus animal group, if any',
  //   authorityOffice: "the Dean of Students' office",
  //   estimatedPopulation: 100,          // honest guess; denominators need it
  //   locale: 'en-IN',
  // },
];

export const DEFAULT_CAMPUS_SLUG = 'iitb';

const BY_SLUG = new Map(CAMPUSES.map((c) => [c.slug, c]));

export function findCampus(slug: string | undefined | null): RegisteredCampus | null {
  if (!slug) return null;
  return BY_SLUG.get(slug.toLowerCase()) ?? null;
}

export function isCampusSlug(slug: string): boolean {
  return BY_SLUG.has(slug.toLowerCase());
}

/**
 * The persisted state row for a campus. The default campus keeps the original
 * key so existing data and printed QR codes keep working; every other campus
 * gets its own row.
 */
export function stateIdFor(slug: string): string {
  return slug === DEFAULT_CAMPUS_SLUG ? 'pawbook-animal-storage' : `pawbook-animal-storage:${slug}`;
}

/** Inverse of stateIdFor, for the API guard. */
export function slugFromStateId(id: string): string | null {
  if (id === 'pawbook-animal-storage') return DEFAULT_CAMPUS_SLUG;
  const m = /^pawbook-animal-storage:([a-z0-9-]{2,32})$/.exec(id);
  return m && isCampusSlug(m[1]) ? m[1] : null;
}

/** URL prefix for a campus's pages: '' for the default, '/c/<slug>' otherwise. */
export function campusBasePath(slug: string): string {
  return slug === DEFAULT_CAMPUS_SLUG ? '' : `/c/${slug}`;
}
