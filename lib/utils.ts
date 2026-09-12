import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function compressImage(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Kept here so the existing call sites do not all have to change. The
// implementation moved to lib/identity.ts, which no longer prompts: nobody is
// asked for a name, and contributions are anonymous unless someone chooses a
// handle deliberately.
export { getUserName } from './identity';

export function getDisplayActorName(name: string | undefined, fallbackName = 'Someone'): string {
  if (!name) return fallbackName;
  const trimmed = name.trim();
  if (!trimmed) return fallbackName;
  if (trimmed.toLowerCase() === 'you') return fallbackName;
  return trimmed;
}
