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

// Calculate similarity percentage (0-1)
export function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(
    str1.toLowerCase(),
    str2.toLowerCase()
  );
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
}

export interface DuplicateMatch {
  animalId: number;
  name: string;
  location: string;
  similarity: number;
  animalType: string;
}

// Find similar animals
export function detectDuplicates(
  candidates: Array<{ id: number; name: string; location: string; animal_type: string }>,
  newName: string,
  newLocation: string,
  threshold = 0.7
): DuplicateMatch[] {
  return candidates
    .map(animal => {
      // Combined similarity: name + location
      const nameSimilarity = calculateSimilarity(newName, animal.name);
      const locationSimilarity = calculateSimilarity(newLocation, animal.location);
      const combinedScore = (nameSimilarity * 0.7 + locationSimilarity * 0.3);

      return {
        animalId: animal.id,
        name: animal.name,
        location: animal.location,
        animalType: animal.animal_type,
        similarity: combinedScore,
      };
    })
    .filter(match => match.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
}
