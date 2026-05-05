import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { supabase } from './supabase-client';
import { demoAnimals, Animal, Comment, StudentMemory, MedicalRecord } from './demo-data';
import { getUserName } from './utils';

interface AnimalStore {
  animals: Animal[];
  setAnimals: (animals: Animal[]) => void;
  addAnimal: (animal: Animal) => void;
  updateAnimal: (id: number, data: Partial<Animal>) => void;
  likeAnimal: (id: number) => void;
  addComment: (animalId: number, comment: Comment) => void;
  addMemory: (animalId: number, memory: StudentMemory) => void;
  likeMemory: (animalId: number, memoryId: string) => void;
  addMedicalRecord: (animalId: number, record: MedicalRecord) => void;
  logCareAction: (animalId: number, actionType: 'seen' | 'fed' | 'treated' | 'sheltered') => void;
}

function sanitizeAnimals(input: unknown): Animal[] {
  if (!Array.isArray(input)) return [...demoAnimals];

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
      animals: demoAnimals, // Initialize with demo data
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
      logCareAction: (animalId, actionType) => set((state) => {
        const now = new Date().toISOString();
        const userName = getUserName();
        return {
          animals: sanitizeAnimals(state.animals.map((a) => {
            if (a.id !== animalId) return a;
            let updates: Partial<Animal> = {};
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
            return { ...a, ...updates };
          }))
        };
      })
    }),
    {
      name: 'pawbook-animal-storage',
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
                console.error('Failed to load state from DB:', await response.text());
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
        };
      },
    }
  )
);

// Realtime sync wrapper
if (typeof window !== 'undefined' && supabase) {
  let isSyncing = false;
  supabase
    .channel('pawbook_state_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pawbook_state',
        filter: "id=eq.'pawbook-animal-storage'",
      },
      (payload) => {
        if (!isSyncing && payload.new && 'data' in payload.new) {
          isSyncing = true;
          try {
            const incoming = payload.new?.data?.state;
            const incomingAnimals = sanitizeAnimals(incoming?.animals);
            // Update the local state
            useAnimalStore.setState((prev) => ({
              ...prev,
              ...(incoming || {}),
              animals: incomingAnimals,
            }));
            // Sync to localStorage
            localStorage.setItem('pawbook-animal-storage', JSON.stringify({
              ...(payload.new.data || {}),
              state: {
                ...(incoming || {}),
                animals: incomingAnimals,
              },
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
