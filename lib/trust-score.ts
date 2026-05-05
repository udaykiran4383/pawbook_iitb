export interface TrustProfile {
  userId: string;
  trustScore: number;
  contributionsCount: number;
  verifiedContributions: number;
  violationsCount: number;
  badge: 'bronze' | 'silver' | 'gold' | 'novice';
}

// Calculate trust score badge based on score
export function getTrustBadge(score: number): 'bronze' | 'silver' | 'gold' | 'novice' {
  if (score >= 90) return 'gold';
  if (score >= 75) return 'silver';
  if (score >= 50) return 'bronze';
  return 'novice';
}

// Detailed scoring system
export function calculateTrustScore(
  baseScore: number,
  verifiedCount: number,
  violationsCount: number,
  contributionsCount: number
): number {
  let score = baseScore;

  // Bonus for verified contributions
  score += Math.min(verifiedCount * 2, 20);

  // Penalty for violations
  score -= violationsCount * 5;

  // Bonus for consistency (contributions without violations)
  if (contributionsCount > 10 && violationsCount === 0) {
    score += 10;
  }

  // Ensure score stays within bounds
  return Math.max(0, Math.min(100, score));
}

// Contribution impact on trust
export function updateTrustOnContribution(
  currentScore: number,
  verified: boolean
): number {
  if (verified) {
    return Math.min(currentScore + 3, 100);
  }
  return currentScore;
}

// Violation impact on trust
export function updateTrustOnViolation(
  currentScore: number,
  violationType: 'spam' | 'inaccurate' | 'malicious'
): number {
  const penalties = {
    spam: 5,
    inaccurate: 3,
    malicious: 15,
  };
  return Math.max(currentScore - penalties[violationType], 0);
}

// Trust badge details for display
export const badgeDetails = {
  gold: {
    label: 'Gold Contributor',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    description: 'Highly trusted contributor with excellent record',
    minScore: 90,
  },
  silver: {
    label: 'Silver Contributor',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    description: 'Trusted contributor with good record',
    minScore: 75,
  },
  bronze: {
    label: 'Bronze Contributor',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    description: 'Active contributor building reputation',
    minScore: 50,
  },
  novice: {
    label: 'New Member',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'New to the PawBook community',
    minScore: 0,
  },
};
