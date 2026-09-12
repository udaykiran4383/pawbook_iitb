/**
 * Questions to ask instead of showing a blank box.
 *
 * PawBook has collected one memory in five months against a textarea labelled
 * "Share your experience, your memory of this animal..." — which asks someone
 * to be a writer with no idea where to start. A specific question asks them to
 * be a witness instead, which is a far smaller thing to be.
 *
 * The approach is StoryCorps': a small set of concrete questions, chosen for
 * the moment rather than generic. Their grief material deliberately includes
 * "tell me a funny story about them", because the instinct to ask only solemn
 * questions of a bereaved person produces silence. The tribute and goodbye sets
 * below follow that, mixing the light in with the heavy rather than keeping
 * them apart.
 */

export type MemoryKind = 'happy' | 'funny' | 'touching' | 'tribute' | 'goodbye';

const PROMPTS: Record<MemoryKind, string[]> = {
  happy: [
    'When did you first notice them?',
    'Where do they go when it rains?',
    'What do they do when they see you coming?',
    'Who else on campus knows them?',
    'What is their favourite spot, and why that one?',
  ],
  funny: [
    'What is the silliest thing you have seen them do?',
    'Have they ever stolen anything?',
    'Where have you found them sleeping that made no sense?',
    'Do they have a rivalry with anyone — a cat, a cyclist, a door?',
    'What noise do they make that you can recognise from far away?',
  ],
  touching: [
    'When were they there for you?',
    'What did they do on a day you needed it?',
    'Have you seen them look after another animal?',
    'What do they do that made you start caring about them?',
    'Who did they choose, and how could you tell?',
  ],
  tribute: [
    'What would you want a first-year who never met them to know?',
    'What is a small thing they always did?',
    'Tell a funny story about them.',
    'Where should someone go to remember them?',
    'What did they teach the people around them?',
  ],
  goodbye: [
    'What do you want to say to them?',
    'When did you last see them, and what were they doing?',
    'What will you miss that nobody else would think to mention?',
    'Tell a funny story about them.',
    'What would you thank them for?',
  ],
};

/**
 * A handful of prompts for this kind of memory.
 *
 * Deterministic given the same seed, so a form does not reshuffle underneath
 * someone while they are reading it.
 */
export function getMemoryPrompts(kind: MemoryKind, seed = 0, count = 3): string[] {
  const pool = PROMPTS[kind] ?? PROMPTS.happy;
  const start = Math.abs(seed) % pool.length;
  return Array.from({ length: Math.min(count, pool.length) }, (_, i) => pool[(start + i) % pool.length]);
}

/**
 * Which set to offer first. A memory about an animal who has died should not
 * open by asking what they do when they see you coming.
 */
export function defaultMemoryKind(isDeceased: boolean): MemoryKind {
  return isDeceased ? 'tribute' : 'happy';
}
