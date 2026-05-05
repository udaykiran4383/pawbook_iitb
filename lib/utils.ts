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

export function getUserName(): string {
  if (typeof window === 'undefined') return 'Someone';
  let name = localStorage.getItem('pawbook_user_name');
  if (!name) {
    name = window.prompt("What is your name? (This will be shown when you care for animals)") || 'Anonymous Student';
    localStorage.setItem('pawbook_user_name', name);
  }
  return name;
}

export function getDisplayActorName(name: string | undefined, fallbackName = 'Someone'): string {
  if (!name) return fallbackName;
  const trimmed = name.trim();
  if (!trimmed) return fallbackName;
  if (trimmed.toLowerCase() === 'you') return fallbackName;
  return trimmed;
}
