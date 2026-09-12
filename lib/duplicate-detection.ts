/**
 * Spotting when a campus animal is about to be added twice.
 *
 * The naive assumption is that duplicates share a name. For campus strays the
 * opposite is usually true: the same dog is entered twice precisely *because*
 * two students know her by different names. So a name match is strong evidence
 * when it happens, but its absence proves nothing — which is why name alone
 * cannot carry the score, and why species and place do most of the work.
 *
 * Proximity is the strongest available signal. Urban Indian free-ranging dogs
 * hold a median home range of roughly 3.7 hectares, about a 110 m radius, so
 * two sightings of the same species inside that radius are a genuine candidate
 * even under different names.
 */

// Levenshtein distance algorithm for string similarity
export function levenshteinDistance(str1: string, str2: string): number {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  return track[str2.length][str1.length];
}

/** Similarity in 0..1. Two empty strings are treated as no evidence, not a match. */
export function calculateSimilarity(str1: string, str2: string): number {
  const a = (str1 ?? '').trim().toLowerCase();
  const b = (str2 ?? '').trim().toLowerCase();
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 0; // guards the divide-by-zero that returned NaN
  return 1 - levenshteinDistance(a, b) / maxLength;
}

export interface Coords {
  lat: number;
  lng: number;
}

/** Great-circle distance in metres. */
export function distanceMetres(a: Coords, b: Coords): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Median home range of an urban free-ranging dog, as a radius. */
export const HOME_RANGE_METRES = 110;

export interface DuplicateMatch {
  animalId: number;
  name: string;
  location: string;
  similarity: number;
  animalType: string;
  /** Short, human phrases explaining the match, for showing to the reporter. */
  reasons: string[];
  distanceMetres?: number;
}

export interface DuplicateCandidate {
  id: number;
  name: string;
  location: string;
  animal_type: string;
  location_coords?: Coords | null;
  status?: string;
}

export interface DuplicateQuery {
  name: string;
  location: string;
  animal_type?: string;
  location_coords?: Coords | null;
}

function isSameSpecies(a?: string, b?: string): boolean {
  if (!a || !b) return true; // unknown species is not evidence of difference
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Rank existing animals by how likely they are to be the one being added.
 *
 * Species acts as a gate rather than a weight: a cat and a dog are not the same
 * animal however alike their names, and scoring them as a partial match is how
 * "Shadow the cat" used to flag "Shadow the dog".
 */
export function detectDuplicates(
  candidates: DuplicateCandidate[],
  query: DuplicateQuery,
  threshold = 0.55
): DuplicateMatch[] {
  const queryName = (query.name ?? '').trim();
  const queryLocation = (query.location ?? '').trim();
  if (!queryName && !queryLocation && !query.location_coords) return [];

  return candidates
    .filter((animal) => isSameSpecies(animal.animal_type, query.animal_type))
    // An animal recorded as gone is not something you are re-adding by mistake.
    .filter((animal) => animal.status !== 'deceased')
    .map((animal) => {
      const reasons: string[] = [];

      const nameScore = calculateSimilarity(queryName, animal.name);
      if (nameScore >= 0.8) reasons.push(`name is almost the same as "${animal.name}"`);

      const placeScore = calculateSimilarity(queryLocation, animal.location);
      if (placeScore >= 0.8 && queryLocation) reasons.push(`same place (${animal.location})`);

      let proximityScore = 0;
      let metres: number | undefined;
      if (query.location_coords && animal.location_coords) {
        metres = distanceMetres(query.location_coords, animal.location_coords);
        if (metres <= HOME_RANGE_METRES) {
          // Full weight when on top of each other, tapering to zero at the edge
          // of a typical home range.
          proximityScore = 1 - metres / HOME_RANGE_METRES;
          reasons.push(`about ${Math.round(metres)} m away`);
        }
      }

      // Name is deliberately not dominant: the same animal is often entered
      // twice under two different names, so place and proximity carry more.
      const hasProximity = proximityScore > 0;
      const similarity = hasProximity
        ? nameScore * 0.35 + placeScore * 0.2 + proximityScore * 0.45
        : nameScore * 0.55 + placeScore * 0.45;

      return {
        animalId: animal.id,
        name: animal.name,
        location: animal.location,
        animalType: animal.animal_type,
        similarity,
        reasons,
        distanceMetres: metres,
      };
    })
    .filter((match) => match.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
}
