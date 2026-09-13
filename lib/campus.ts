/**
 * Everything that makes this deployment *this campus*.
 *
 * PawBook began as an IIT Bombay app with the campus name, bounds and contacts
 * scattered through a dozen files. Every campus in India now has the same
 * problem this app addresses and, since May 2026, the same legal obligation to
 * keep records of its animals — so the useful thing is not one campus's app but
 * a template any campus can stand up in an afternoon. This file is the whole
 * of what they change.
 *
 * Values come from environment variables so a fork is not required: set them
 * in Vercel (or .env.local) and deploy. Every field has a default that keeps
 * the original IIT Bombay deployment working unchanged.
 */

export interface CampusConfig {
  /** "IIT Bombay" — used in titles, the poster, the hero. */
  name: string;
  /** "IITB" — short form for tight spaces. */
  shortName: string;
  /** "Powai, Mumbai" — optional, for descriptions. */
  place?: string;
  /** Public URL of this deployment, for QR codes and link previews. */
  siteUrl: string;
  /**
   * Bounding box. A location reading outside it is discarded as a bad fix
   * rather than stored, so keep it generous but not city-sized.
   */
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  /** Suggested zones for the sighting form — "H11", "Main Gate". Free text still allowed. */
  zones: string[];
  /** Name of the campus animal-welfare group, if one exists. */
  welfareGroup?: string;
  /**
   * A phone number for injured-animal emergencies. Only set this once it has
   * been dialled and confirmed; the poster prints a blank line otherwise.
   */
  emergencyContact?: string;
  /** Who to ask about current institutional requirements. */
  authorityOffice: string;
  /** Approximate number of animals on campus, for honest denominators. */
  estimatedPopulation?: number;
  /** ISO 3166 / locale hints for date formatting. */
  locale: string;
}

function env(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim() ? value.trim() : undefined;
}

function envNumber(key: string): number | undefined {
  const raw = env(key);
  const n = raw === undefined ? NaN : Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function envList(key: string): string[] | undefined {
  const raw = env(key);
  if (!raw) return undefined;
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return list.length ? list : undefined;
}

/**
 * The default campus for the bare `/` routes. Other campuses live at /c/<slug>
 * and come from lib/campuses.ts; this object is what `useCampus()` returns
 * when no provider has set one.
 */
const IITB: CampusConfig = {
  name: 'IIT Bombay',
  shortName: 'IITB',
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
};

export const campus: CampusConfig = {
  name: env('NEXT_PUBLIC_CAMPUS_NAME') ?? IITB.name,
  shortName: env('NEXT_PUBLIC_CAMPUS_SHORT') ?? IITB.shortName,
  place: env('NEXT_PUBLIC_CAMPUS_PLACE') ?? IITB.place,
  siteUrl:
    env('NEXT_PUBLIC_SITE_URL') ??
    (env('VERCEL_URL') ? `https://${env('VERCEL_URL')}` : IITB.siteUrl),
  bounds: {
    minLat: envNumber('NEXT_PUBLIC_CAMPUS_MIN_LAT') ?? IITB.bounds.minLat,
    maxLat: envNumber('NEXT_PUBLIC_CAMPUS_MAX_LAT') ?? IITB.bounds.maxLat,
    minLng: envNumber('NEXT_PUBLIC_CAMPUS_MIN_LNG') ?? IITB.bounds.minLng,
    maxLng: envNumber('NEXT_PUBLIC_CAMPUS_MAX_LNG') ?? IITB.bounds.maxLng,
  },
  zones: envList('NEXT_PUBLIC_CAMPUS_ZONES') ?? IITB.zones,
  welfareGroup: env('NEXT_PUBLIC_CAMPUS_WELFARE_GROUP') ?? IITB.welfareGroup,
  emergencyContact: env('NEXT_PUBLIC_EMERGENCY_CONTACT'),
  authorityOffice: env('NEXT_PUBLIC_CAMPUS_AUTHORITY') ?? IITB.authorityOffice,
  estimatedPopulation: envNumber('NEXT_PUBLIC_CAMPUS_POPULATION') ?? IITB.estimatedPopulation,
  locale: env('NEXT_PUBLIC_CAMPUS_LOCALE') ?? IITB.locale,
};

/** "PawBook IITB" */
export const appName = `PawBook ${campus.shortName}`;

export function onCampus(lat: number, lng: number): boolean {
  const b = campus.bounds;
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}
