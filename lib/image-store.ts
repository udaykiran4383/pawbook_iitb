import { create } from 'zustand';

export interface AnimalImage {
  id: string;
  animalId: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  likes: number;
  caption?: string;
}

export interface ImageStore {
  images: { [animalId: number]: AnimalImage[] };
  addImage: (animalId: number, image: AnimalImage) => void;
  removeImage: (animalId: number, imageId: string) => void;
  getAnimalImages: (animalId: number) => AnimalImage[];
  likeImage: (animalId: number, imageId: string) => void;
}

export const useImageStore = create<ImageStore>((set, get) => ({
  images: {},

  addImage: (animalId: number, image: AnimalImage) => {
    set((state) => ({
      images: {
        ...state.images,
        [animalId]: [...(state.images[animalId] || []), image],
      },
    }));
  },

  removeImage: (animalId: number, imageId: string) => {
    set((state) => ({
      images: {
        ...state.images,
        [animalId]: state.images[animalId]?.filter((img) => img.id !== imageId) || [],
      },
    }));
  },

  getAnimalImages: (animalId: number) => {
    return get().images[animalId] || [];
  },

  likeImage: (animalId: number, imageId: string) => {
    set((state) => ({
      images: {
        ...state.images,
        [animalId]: state.images[animalId]?.map((img) =>
          img.id === imageId ? { ...img, likes: img.likes + 1 } : img
        ) || [],
      },
    }));
  },
}));
