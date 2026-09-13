/**
 * Survey-standard observation fields.
 *
 * These are the fields a Mission Rabies / WVS street-dog surveyor records on a
 * sighting: sex, age class, lactating, collar seen, a three-point body
 * condition score, and visible hair loss, wounds or ectoparasites. Recording the
 * same things in the same vocabulary is what lets PawBook's observations sit
 * beside the Public Health Office's data instead of forming a parallel silo
 * nobody can reconcile.
 *
 * Everything is optional and everything is a checkbox or a three-way choice.
 * The person filling this in is standing next to a dog with one hand free.
 *
 * Deliberately absent: any automated judgement from a photo. The only validated
 * photo body-condition work needed overhead shots and tested obese pets; there
 * is no external validation of mange or wound classifiers on free-ranging dogs.
 * A tick box a human ticks is more trustworthy than a model at this scale, and
 * a false "looks fine" on an injured animal is the worst thing the app could do.
 */

export type Sex = 'male' | 'female' | 'unknown';
export type AgeClass = 'puppy' | 'juvenile' | 'adult' | 'senior' | 'unknown';
/** Three-point scale used in field surveys: thin / ideal / heavy. */
export type BodyCondition = 'thin' | 'ideal' | 'heavy' | 'unknown';
/**
 * How the animal is with people. Chulalongkorn's JohnJud colours every pin by
 * this so a newcomer knows at a glance which dog to greet and which to give
 * room. 'unknown' is not a null: it is an open request for someone to find out.
 */
export type Temperament = 'friendly' | 'cautious' | 'keep_distance' | 'unknown';

export interface Observation {
  sex?: Sex;
  age_class?: AgeClass;
  /** Only meaningful for females; the form hides it otherwise. */
  lactating?: boolean;
  /** A collar means the animal is in the campus QR programme — a strong link. */
  collar_seen?: boolean;
  /** Observed only — a notch is NOT proof of sterilisation. See notes below. */
  ear_notch_seen?: boolean;
  body_condition?: BodyCondition;
  hair_loss?: boolean;
  visible_wound?: boolean;
  ectoparasites?: boolean;
  temperament?: Temperament;
  /** When these fields were last updated, so stale observations read as stale. */
  observed_at?: string;
}

/*
 * ear_notch_seen vs sterilisation
 * -------------------------------
 * A notched ear is the field convention for "has been through ABC", but notched
 * dogs in Bengaluru were later confirmed pregnant. So the app records what was
 * *seen* and never infers a medical status from it. If a sterilisation record
 * exists it belongs in medical_records with its own provenance, not here.
 */

export const SEX_OPTIONS: Array<{ value: Sex; label: string }> = [
  { value: 'unknown', label: 'Not sure' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export const AGE_OPTIONS: Array<{ value: AgeClass; label: string }> = [
  { value: 'unknown', label: 'Not sure' },
  { value: 'puppy', label: 'Puppy' },
  { value: 'juvenile', label: 'Young' },
  { value: 'adult', label: 'Adult' },
  { value: 'senior', label: 'Old' },
];

export const BODY_OPTIONS: Array<{ value: BodyCondition; label: string; hint: string }> = [
  { value: 'unknown', label: 'Not sure', hint: '' },
  { value: 'thin', label: 'Thin', hint: 'ribs and hips clearly visible' },
  { value: 'ideal', label: 'Healthy', hint: 'ribs felt, not seen' },
  { value: 'heavy', label: 'Heavy', hint: 'no waist, ribs hard to feel' },
];

export const TEMPERAMENT_OPTIONS: Array<{ value: Temperament; label: string; hint: string }> = [
  { value: 'unknown', label: 'Not sure', hint: 'nobody has checked yet — help identify' },
  { value: 'friendly', label: 'Friendly', hint: 'approaches people, happy to be petted' },
  { value: 'cautious', label: 'Cautious', hint: 'keeps its distance, may come for food' },
  { value: 'keep_distance', label: 'Keep distance', hint: 'growls or snaps when approached' },
];

/**
 * The pin colour for a temperament, as JohnJud does it: green go, yellow
 * careful, red keep away, and grey for "nobody knows yet, please look". The
 * fills are pale so a photo still shows through; the strokes carry the signal.
 */
export function temperamentColour(t: Temperament | undefined): { fill: string; stroke: string; label: string } {
  switch (t) {
    case 'friendly':
      return { fill: '#C9F0DC', stroke: '#0F7A50', label: 'Friendly' };
    case 'cautious':
      return { fill: '#FFE3C2', stroke: '#B45309', label: 'Cautious' };
    case 'keep_distance':
      return { fill: '#FFD9E2', stroke: '#B42318', label: 'Keep distance' };
    default:
      return { fill: '#E8D4C4', stroke: '#6B5A4E', label: 'Unknown — help identify' };
  }
}

/** The yes/no health flags, in the order a surveyor would run through them. */
export const HEALTH_FLAGS: Array<{ key: keyof Observation; label: string; urgent?: boolean }> = [
  { key: 'visible_wound', label: 'Visible wound or injury', urgent: true },
  { key: 'hair_loss', label: 'Patchy hair loss (possible mange)' },
  { key: 'ectoparasites', label: 'Ticks or fleas seen' },
  { key: 'collar_seen', label: 'Wearing a collar' },
  { key: 'ear_notch_seen', label: 'Ear notch seen' },
];

/** True when any health flag that should prompt a closer look is set. */
export function needsAttention(observation: Observation | undefined): boolean {
  if (!observation) return false;
  return Boolean(observation.visible_wound) || observation.body_condition === 'thin';
}

/** A one-line summary for cards and lists; empty when nothing has been recorded. */
export function summariseObservation(observation: Observation | undefined): string {
  if (!observation) return '';
  const parts: string[] = [];
  if (observation.sex && observation.sex !== 'unknown') parts.push(observation.sex);
  if (observation.age_class && observation.age_class !== 'unknown') parts.push(observation.age_class);
  if (observation.body_condition && observation.body_condition !== 'unknown') {
    parts.push(BODY_OPTIONS.find((o) => o.value === observation.body_condition)?.label.toLowerCase() ?? '');
  }
  if (observation.temperament && observation.temperament !== 'unknown') {
    parts.push(temperamentColour(observation.temperament).label.toLowerCase());
  }
  if (observation.lactating) parts.push('lactating');
  if (observation.collar_seen) parts.push('collared');
  if (observation.visible_wound) parts.push('wound seen');
  if (observation.hair_loss) parts.push('hair loss');
  if (observation.ectoparasites) parts.push('ticks/fleas');
  return parts.filter(Boolean).join(' · ');
}
