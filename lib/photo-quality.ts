/**
 * Is this photo going to be useful?
 *
 * Every serious animal-identification system — Wildbook, the Tanzania rabies
 * field trial, SYSU's campus-cat classifier — depends on photo quality before
 * any model runs, and in that trial 23% of photos were unusable for sun, angle
 * or blur. None of them ships a check at upload time; they discover it later.
 *
 * This runs in the browser, on a canvas, before anything is sent. No model, no
 * network. It measures three things any photo of an animal needs:
 *
 *   sharpness  — variance of a Laplacian filter over the luminance. Blur
 *                collapses local contrast, so this number falls.
 *   exposure   — mean luminance, so a silhouette against the sun or a black
 *                frame at night gets a gentle nudge.
 *   size       — enough pixels to matter.
 *
 * The result is advice, never a block. A blurry photo of an injured animal at
 * night is still the most important photo anyone will take that day; the gate
 * says "this is dark, want to try again?" and gets out of the way.
 */

export interface PhotoQuality {
  ok: boolean;
  /** 0–1, rough overall usefulness. */
  score: number;
  sharpness: number;
  brightness: number; // 0–255
  width: number;
  height: number;
  /** Human advice, empty when the photo is fine. */
  advice: string[];
}

export const MIN_DIMENSION = 480;
/** Laplacian variance below this reads as blurred on typical phone photos. */
export const BLUR_THRESHOLD = 60;
export const DARK_THRESHOLD = 55;
export const BRIGHT_THRESHOLD = 215;

/** Work on a downscaled copy so this stays fast on a phone. */
const SAMPLE_WIDTH = 320;

function luminance(data: Uint8ClampedArray, i: number): number {
  return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
}

/** Assess an image element that has already loaded. */
export function assessImage(img: HTMLImageElement): PhotoQuality {
  const scale = Math.min(1, SAMPLE_WIDTH / Math.max(1, img.naturalWidth));
  const w = Math.max(8, Math.round(img.naturalWidth * scale));
  const h = Math.max(8, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { ok: true, score: 0.5, sharpness: 0, brightness: 128, width: img.naturalWidth, height: img.naturalHeight, advice: [] };
  }
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  // Luminance plane.
  const lum = new Float32Array(w * h);
  let sum = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = luminance(data, (y * w + x) * 4);
      lum[y * w + x] = v;
      sum += v;
    }
  }
  const brightness = sum / (w * h);

  // Variance of the 4-neighbour Laplacian, ignoring the border.
  let lapSum = 0;
  let lapSq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = 4 * lum[i] - lum[i - 1] - lum[i + 1] - lum[i - w] - lum[i + w];
      lapSum += lap;
      lapSq += lap * lap;
      n++;
    }
  }
  const mean = lapSum / n;
  const sharpness = lapSq / n - mean * mean;

  return judge({ sharpness, brightness, width: img.naturalWidth, height: img.naturalHeight });
}

/** Pure scoring, separated so it can be tested without a canvas. */
export function judge(m: { sharpness: number; brightness: number; width: number; height: number }): PhotoQuality {
  const advice: string[] = [];
  let score = 1;

  if (Math.min(m.width, m.height) < MIN_DIMENSION) {
    advice.push('Quite small — a larger photo helps others recognise them.');
    score -= 0.25;
  }
  if (m.sharpness < BLUR_THRESHOLD) {
    advice.push('Looks blurry — worth a second try if they will hold still.');
    score -= 0.4;
  }
  if (m.brightness < DARK_THRESHOLD) {
    advice.push('Very dark — if you can, try again with more light.');
    score -= 0.3;
  } else if (m.brightness > BRIGHT_THRESHOLD) {
    advice.push('Very bright — they may be washed out against the sun.');
    score -= 0.2;
  }

  score = Math.max(0, Math.min(1, score));
  return {
    ok: advice.length === 0,
    score,
    sharpness: m.sharpness,
    brightness: m.brightness,
    width: m.width,
    height: m.height,
    advice,
  };
}

/** Load a File into an image and assess it. Resolves with a permissive result on any failure. */
export function assessFile(file: File): Promise<PhotoQuality> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        resolve(assessImage(img));
      } catch {
        resolve({ ok: true, score: 0.5, sharpness: 0, brightness: 128, width: img.naturalWidth, height: img.naturalHeight, advice: [] });
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: true, score: 0.5, sharpness: 0, brightness: 128, width: 0, height: 0, advice: [] });
    };
    img.src = url;
  });
}
