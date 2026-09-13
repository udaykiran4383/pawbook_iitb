/**
 * What an animal looks like to the public internet.
 *
 * The per-animal pages are linkable, indexable and reachable from a printed QR
 * code on a wall, so what they expose is a safety decision rather than a
 * product one. Two things are withheld:
 *
 * - **Precise coordinates.** A public, per-animal location log is a targeting
 *   list for anyone wanting to harm these animals. Coordinates are collected to
 *   catch duplicate entries and stay server-side; the page shows only the area
 *   name a person typed ("H11", "EE Department"). Indian courts are pushing
 *   identity-grade stray records toward state-held systems and away from public
 *   maps, which points the same way.
 * - **Contributor and feeder names.** Para 74 of 2026 INSC 506 makes campus
 *   animal groups file a liability affidavit, so "who feeds this dog" is a legal
 *   and personal-safety question. WAG, the group actually operating at IITB,
 *   publishes no member directory at all.
 *
 * This is an allowlist, not a blocklist, so a field added to Animal later is
 * private by default and has to be named here to become public. That is the
 * whole point: the failure mode of forgetting is safety, not exposure.
 */

import type { Animal } from './demo-data';

export interface PublicAnimal {
  id: number;
  name: string;
  animal_type: string;
  /** Free-text area only — never a coordinate. */
  location: string;
  description: string;
  profile_image: string | null;
  personality_tags: string[];
  status: string;
  likes: number;
  created_at: string;
  last_seen: string;
  last_fed: string;
  death_date?: string;
  memories: Array<{ id?: string; text?: string; content?: string; timestamp?: string }>;
  comments: Array<{ id?: string; text?: string; timestamp?: string }>;
  /** Zone-level only, and without the pseudonym of who logged it. */
  sightings: Array<{ id: string; at: string; zone: string; kind: string }>;
}

function publicMemory(memory: any) {
  return {
    id: memory?.id,
    text: memory?.text ?? memory?.content,
    timestamp: memory?.timestamp,
  };
}

function publicComment(comment: any) {
  return {
    id: comment?.id,
    text: comment?.text,
    timestamp: comment?.timestamp,
  };
}

export function toPublicAnimal(animal: Animal): PublicAnimal {
  return {
    id: animal.id,
    name: animal.name,
    animal_type: animal.animal_type,
    location: animal.location,
    description: animal.description,
    profile_image: animal.profile_image ?? null,
    personality_tags: Array.isArray(animal.personality_tags) ? animal.personality_tags : [],
    status: animal.status,
    likes: animal.likes ?? 0,
    created_at: animal.created_at,
    last_seen: animal.last_seen,
    last_fed: animal.last_fed,
    death_date: (animal as any).death_date,
    memories: Array.isArray(animal.memories) ? animal.memories.map(publicMemory) : [],
    comments: Array.isArray(animal.comments) ? animal.comments.map(publicComment) : [],
    sightings: Array.isArray(animal.sightings)
      ? animal.sightings.map((s) => ({ id: s.id, at: s.at, zone: s.zone, kind: s.kind }))
      : [],
  };
}

/** Field names that must never appear in anything served publicly. */
export const PRIVATE_ANIMAL_FIELDS = [
  'location_coords',
  'contributor',
  'last_seen_by',
  'last_fed_by',
  'last_cared_by',
  'trust_score',
  'medical_records',
] as const;
