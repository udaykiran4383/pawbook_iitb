import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { supabase } from './supabase-client';
import { demoAnimals, Animal, Comment, StudentMemory, MedicalRecord } from './demo-data';
import { applyUpdate, newEmergencyUpdate, statusOf, type EmergencyCase, type EmergencyUpdate } from './emergency';
import type { FeedingStation } from './feeding-stations';
import type { Observation } from './survey';
import { appendSighting, newSighting } from './sightings';
import { DEFAULT_CAMPUS_SLUG, isCampusSlug, stateIdFor } from './campuses';

/**
 * Which campus's row this store should hydrate from, decided from the URL
 * before the store exists. Deciding it afterwards — and re-pointing the store
 * once a provider mounts — races the first hydration and lets one campus's
 * animals appear on another's page for a moment, or for good.
 */
export function campusSlugFromLocation(): string {
  if (typeof window === 'undefined') return DEFAULT_CAMPUS_SLUG;
  const m = /^\/c\/([a-z0-9-]+)(?:\/|$)/.exec(window.location.pathname);
  return m && isCampusSlug(m[1]) ? m[1] : DEFAULT_CAMPUS_SLUG;
}

/** The persisted key currently in use; the realtime channel follows it. */
export let activeStateId = stateIdFor(campusSlugFromLocation());
import { getUserName } from './identity';

interface AnimalStore {
  animals: Animal[];
  /** Injury and rescue reports. Persisted alongside animals in the same row. */
  emergencies: EmergencyCase[];
  addEmergency: (report: EmergencyCase) => void;
  respondToEmergency: (id: string, responder: string) => void;
  resolveEmergency: (id: string, photo_url?: string) => void;
  /** Append to a report's thread; if the update carries a status, move the report there. */
  addEmergencyUpdate: (id: string, update: EmergencyUpdate) => void;
  /** Designated feeding spots. Same row, so one phone's "stocked" is everyone's. */
  stations: FeedingStation[];
  addStation: (station: FeedingStation) => void;
  /** "I put food out": clears any needs-food flag. */
  stockStation: (id: string) => void;
  /** "I cleaned the spot": the rule that keeps feeding permitted. */
  clearStation: (id: string) => void;
  /** "I walked past and the bowl was empty." */
  flagStationNeedsFood: (id: string) => void;
  setStationActive: (id: string, active: boolean) => void;
  setAnimals: (animals: Animal[]) => void;
  addAnimal: (animal: Animal) => void;
  updateAnimal: (id: number, data: Partial<Animal>) => void;
  likeAnimal: (id: number) => void;
  addComment: (animalId: number, comment: Comment) => void;
  addMemory: (animalId: number, memory: StudentMemory) => void;
  likeMemory: (animalId: number, memoryId: string) => void;
  addMedicalRecord: (animalId: number, record: MedicalRecord) => void;
  logCareAction: (animalId: number, actionType: 'seen' | 'fed' | 'treated' | 'sheltered') => void;
  /** Merge survey fields into the animal; also counts as a sighting. */
  recordObservation: (animalId: number, observation: Observation) => void;
  /** "I'm seeing them now, here" — a sighting at a named zone. */
  logSighting: (animalId: number, zone: string, note?: string) => void;
  /** "I looked and they were not there" — does NOT touch last_seen. */
  logAbsence: (animalId: number, zone: string) => void;
}

function sanitizeAnimals(input: unknown): Animal[] {
  // A row with no animals is an empty campus, not a reason to show IIT
  // Bombay's demo fixtures. With one deployment serving many campuses that
  // fallback would seed every new campus with the wrong dogs.
  if (!Array.isArray(input)) return [];

  return input
    .filter((item): item is Partial<Animal> => !!item && typeof item === 'object')
    .map((item, index) => {
      const fallback = demoAnimals[index % demoAnimals.length];
      return {
        ...fallback,
        ...item,
        id: typeof item.id === 'number' ? item.id : Date.now() + index,
        name: typeof item.name === 'string' && item.name.trim() ? item.name : fallback.name,
        location: typeof item.location === 'string' && item.location.trim() ? item.location : fallback.location,
        description: typeof item.description === 'string' ? item.description : fallback.description,
        animal_type: typeof item.animal_type === 'string' ? item.animal_type : fallback.animal_type,
        profile_image: item.profile_image ?? null,
        created_at: typeof item.created_at === 'string' ? item.created_at : new Date().toISOString(),
        contributor: typeof item.contributor === 'string' && item.contributor.trim() ? item.contributor : fallback.contributor,
        last_seen: typeof item.last_seen === 'string' ? item.last_seen : new Date().toISOString(),
        last_fed: typeof item.last_fed === 'string' ? item.last_fed : new Date().toISOString(),
        trust_score: typeof item.trust_score === 'number' ? item.trust_score : fallback.trust_score,
        likes: typeof item.likes === 'number' ? item.likes : 0,
        status: item.status === 'active' || item.status === 'deceased' || item.status === 'missing' || item.status === 'adopted'
          ? item.status
          : fallback.status,
        personality_tags: Array.isArray(item.personality_tags) ? item.personality_tags : fallback.personality_tags,
        comments: Array.isArray(item.comments) ? item.comments : [],
        memories: Array.isArray(item.memories) ? item.memories : [],
        medical_records: Array.isArray(item.medical_records) ? item.medical_records : [],
        gallery: Array.isArray(item.gallery) ? item.gallery : [],
      };
    });
}

export const useAnimalStore = create<AnimalStore>()(
  persist(
    (set) => ({
      animals: [], // Filled from the campus's persisted row on hydration.
      // Starts empty on purpose. This list used to be seeded with two invented
      // reports — "Dog with visible injury near sports complex" among them —
      // which rendered on the homepage as though somebody had filed them.
      emergencies: [],
      addEmergency: (report) => set((state) => ({
        emergencies: [report, ...(Array.isArray(state.emergencies) ? state.emergencies : [])],
      })),
      // Every change to a report goes through its thread, so the status is
      // always explained by an entry someone can read, and so the merge — which
      // takes the newest entry's word for it — sees the same thing every
      // client did.
      addEmergencyUpdate: (id, update) => set((state) => ({
        emergencies: (Array.isArray(state.emergencies) ? state.emergencies : []).map((c) =>
          c.id === id ? applyUpdate(c, update) : c,
        ),
      })),
      respondToEmergency: (id, responder) => set((state) => ({
        emergencies: (Array.isArray(state.emergencies) ? state.emergencies : []).map((c) => {
          if (c.id !== id) return c;
          const responders = Array.isArray(c.responders) ? c.responders : [];
          if (responders.includes(responder)) return c;
          // Volunteering only moves a report forward from waiting; it should
          // not pull one back from "at the vet".
          const status = statusOf(c);
          const waiting = status === 'open' || status === 'reopened';
          // The status label already says "on the way"; a note is only
          // needed when the report is past that and this is an extra pair of hands.
          const update = newEmergencyUpdate({
            by: responder,
            note: waiting ? undefined : 'is also helping',
            status: waiting ? 'responder_on_way' : undefined,
          });
          return applyUpdate({ ...c, responders: [...responders, responder] }, update);
        }),
      })),
      resolveEmergency: (id, photo_url) => set((state) => ({
        emergencies: (Array.isArray(state.emergencies) ? state.emergencies : []).map((c) =>
          c.id === id
            ? applyUpdate(c, newEmergencyUpdate({ by: getUserName(), status: 'resolved', photo_url }))
            : c,
        ),
      })),
      stations: [],
      addStation: (station) => set((state) => ({
        stations: [...(Array.isArray(state.stations) ? state.stations : []), station],
      })),
      stockStation: (id) => set((state) => ({
        stations: (Array.isArray(state.stations) ? state.stations : []).map((s) =>
          s.id === id
            ? { ...s, last_stocked_at: new Date().toISOString(), last_stocked_by: getUserName(), needs_food: false }
            : s,
        ),
      })),
      clearStation: (id) => set((state) => ({
        stations: (Array.isArray(state.stations) ? state.stations : []).map((s) =>
          s.id === id ? { ...s, last_cleared_at: new Date().toISOString() } : s,
        ),
      })),
      flagStationNeedsFood: (id) => set((state) => ({
        stations: (Array.isArray(state.stations) ? state.stations : []).map((s) =>
          s.id === id ? { ...s, needs_food: true, needs_food_at: new Date().toISOString() } : s,
        ),
      })),
      setStationActive: (id, active) => set((state) => ({
        stations: (Array.isArray(state.stations) ? state.stations : []).map((s) =>
          s.id === id ? { ...s, active, updated_at: new Date().toISOString() } : s,
        ),
      })),
      setAnimals: (animals) => set({ animals: sanitizeAnimals(animals) }),
      addAnimal: (animal) => set((state) => ({ animals: sanitizeAnimals([animal, ...state.animals]) })),
      updateAnimal: (id, data) => set((state) => ({
        animals: sanitizeAnimals(state.animals.map((a) => a.id === id ? { ...a, ...data } : a))
      })),
      likeAnimal: (id) => set((state) => ({
        animals: sanitizeAnimals(state.animals.map((a) => a.id === id ? { ...a, likes: a.likes + 1 } : a))
      })),
      addComment: (animalId, comment) => set((state) => ({
        animals: sanitizeAnimals(state.animals.map((a) => a.id === animalId ? { ...a, comments: [comment, ...(Array.isArray(a.comments) ? a.comments : [])] } : a))
      })),
      addMemory: (animalId, memory) => set((state) => ({
        animals: sanitizeAnimals(state.animals.map((a) => a.id === animalId ? { ...a, memories: [memory, ...(Array.isArray(a.memories) ? a.memories : [])] } : a))
      })),
      likeMemory: (animalId, memoryId) => set((state) => ({
        animals: sanitizeAnimals(state.animals.map((a) => a.id === animalId ? {
          ...a,
          memories: (Array.isArray(a.memories) ? a.memories : []).map(m => m.id === memoryId ? { ...m, likes: m.likes + 1 } : m)
        } : a))
      })),
      addMedicalRecord: (animalId, record) => set((state) => ({
        animals: sanitizeAnimals(state.animals.map((a) => a.id === animalId ? { ...a, medical_records: [record, ...(Array.isArray(a.medical_records) ? a.medical_records : [])] } : a))
      })),
      logAbsence: (animalId, zone) => set((state) => ({
        animals: sanitizeAnimals(state.animals.map((a) =>
          a.id === animalId
            ? { ...a, sightings: appendSighting(a.sightings, newSighting('not_found', zone || a.location, getUserName())) }
            : a,
        )),
      })),
      logSighting: (animalId, zone, note) => set((state) => {
        const now = new Date().toISOString();
        const by = getUserName();
        return {
          animals: sanitizeAnimals(state.animals.map((a) => {
            if (a.id !== animalId) return a;
            return {
              ...a,
              ...(a.status === 'missing' ? { status: 'active' as const } : {}),
              last_seen: now,
              last_seen_by: by,
              sightings: appendSighting(a.sightings, newSighting('seen', zone || a.location, by, note)),
            };
          })),
        };
      }),
      recordObservation: (animalId, observation) => set((state) => {
        const now = new Date().toISOString();
        return {
          animals: sanitizeAnimals(state.animals.map((a) => {
            if (a.id !== animalId) return a;
            return {
              ...a,
              observation: { ...(a.observation ?? {}), ...observation, observed_at: now },
              // Filling in the survey means you are looking at the animal.
              last_seen: now,
              last_seen_by: getUserName(),
              sightings: appendSighting(a.sightings, newSighting('observation', a.location, getUserName())),
            };
          })),
        };
      }),
      logCareAction: (animalId, actionType) => set((state) => {
        const now = new Date().toISOString();
        const userName = getUserName();
        return {
          animals: sanitizeAnimals(state.animals.map((a) => {
            if (a.id !== animalId) return a;
            let updates: Partial<Animal> = {};
            // Any sighting of an animal marked "on leave" brings them back.
            if (a.status === 'missing') updates.status = 'active';
            if (actionType === 'seen') {
              updates.last_seen = now;
              updates.last_seen_by = userName;
            }
            if (actionType === 'fed') {
              updates.last_fed = now;
              updates.last_fed_by = userName;
            }
            if (actionType === 'treated' || actionType === 'sheltered') {
              updates.last_cared_at = now;
              updates.last_cared_by = userName;
              updates.last_cared_type = actionType;
              updates.trust_score = Math.min(100, a.trust_score + 2);
            }
            // Every care action is also a sighting: you were there, at that zone.
            updates.sightings = appendSighting(a.sightings, newSighting(actionType, a.location, userName));
            return { ...a, ...updates };
          }))
        };
      })
    }),
    {
      name: activeStateId,
      storage: createJSONStorage(() => {
        const hybridStorage: StateStorage = {
          getItem: async (name: string): Promise<string | null> => {
            if (typeof window === 'undefined') return null;
            try {
              const response = await fetch(`/api/state?id=${encodeURIComponent(name)}`, { method: 'GET' });
              if (response.ok) {
                const payload = await response.json();
                if (payload?.data) {
                  const val = JSON.stringify(payload.data);
                  localStorage.setItem(name, val); // sync local
                  return val;
                }
              } else {
                // 503 is the API saying storage is not configured — expected when
                // running locally without credentials, so not worth an error.
                const text = await response.text();
                (response.status === 503 ? console.warn : console.error)('Could not load state from DB:', text);
              }
            } catch (err) {
              console.error('Failed to load state from DB:', err);
            }
            return localStorage.getItem(name);
          },
          setItem: async (name: string, value: string): Promise<void> => {
            if (typeof window === 'undefined') return;
            localStorage.setItem(name, value);
            try {
              const response = await fetch('/api/state', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: name, data: JSON.parse(value) }),
              });
              if (!response.ok) {
                console.error('Failed to persist state to DB:', await response.text());
              }
            } catch (err) {
              console.error('Failed to persist state to DB:', err);
            }
          },
          removeItem: async (name: string): Promise<void> => {
            if (typeof window === 'undefined') return;
            localStorage.removeItem(name);
            try {
              const response = await fetch(`/api/state?id=${encodeURIComponent(name)}`, { method: 'DELETE' });
              if (!response.ok) {
                console.error('Failed to remove state from DB:', await response.text());
              }
            } catch (err) {
              console.error('Failed to remove state from DB:', err);
            }
          },
        };
        return hybridStorage;
      }),
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<AnimalStore> | undefined;
        return {
          ...currentState,
          ...state,
          animals: sanitizeAnimals(state?.animals),
          emergencies: Array.isArray(state?.emergencies) ? state.emergencies : [],
          stations: Array.isArray(state?.stations) ? state.stations : [],
        };
      },
    }
  )
);

// Realtime sync: follow whichever campus row this store is bound to. The
// filter and the localStorage mirror both use activeStateId, so one campus's
// updates never arrive on another campus's page.
let realtimeChannel: ReturnType<NonNullable<typeof supabase>['channel']> | null = null;

export function subscribeRealtime(stateId: string) {
  if (typeof window === 'undefined' || !supabase) return;
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  let isSyncing = false;
  realtimeChannel = supabase
    .channel(`pawbook_state_changes:${stateId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pawbook_state',
        filter: `id=eq.${stateId}`,
      },
      (payload: { new?: { data?: { state?: Partial<AnimalStore> } } | null }) => {
        if (!isSyncing && payload.new && 'data' in payload.new) {
          isSyncing = true;
          try {
            const incoming = payload.new?.data?.state;
            const incomingAnimals = sanitizeAnimals(incoming?.animals);
            useAnimalStore.setState((prev) => ({
              ...prev,
              ...(incoming || {}),
              animals: incomingAnimals,
            }));
            localStorage.setItem(stateId, JSON.stringify({
              ...(payload.new.data || {}),
              state: { ...(incoming || {}), animals: incomingAnimals },
            }));
          } catch (e) {
            console.error('Failed to sync from realtime', e);
          }
          setTimeout(() => { isSyncing = false; }, 100);
        }
      }
    )
    .subscribe();
}

subscribeRealtime(activeStateId);

/**
 * Re-point the store at another campus's row (client-side navigation between
 * campuses). Order matters: switch the key first so the emptying write below
 * lands on the new row, not the old one; then clear; then hydrate.
 */
export function switchCampusStore(slug: string) {
  const name = stateIdFor(slug);
  if (name === activeStateId) return;
  activeStateId = name;
  const persist = (useAnimalStore as any).persist;
  persist?.setOptions?.({ name });
  useAnimalStore.setState({ animals: [], emergencies: [], stations: [] });
  void persist?.rehydrate?.();
  subscribeRealtime(name);
}
