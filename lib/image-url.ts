/**
 * Cloudinary delivery helpers.
 *
 * Every photo in PawBook is served from Cloudinary, and most of our traffic is
 * students on mobile data. Adding `f_auto` (pick AVIF/WebP per browser) and
 * `q_auto` (pick a quality that still looks right) to the delivery URL cuts the
 * payload dramatically for free — Cloudinary's own documented example is a
 * ~75% reduction — without re-uploading anything.
 */

const CLOUDINARY_UPLOAD_MARKER = '/image/upload/';

export interface ImageTransformOptions {
  /** Target display width in CSS pixels. Cloudinary also scales for DPR. */
  width?: number;
  /** `eco` trades a little fidelity for noticeably smaller files. */
  quality?: 'auto' | 'auto:good' | 'auto:eco' | 'auto:low';
}

/**
 * Insert delivery transformations into a Cloudinary URL.
 *
 * Returns non-Cloudinary URLs (and already-transformed ones) untouched, so it
 * is safe to call on any `profile_image` value, including null.
 */
export function optimizeImageUrl(url: string | null | undefined, options: ImageTransformOptions = {}): string {
  if (!url || typeof url !== 'string') return '';
  if (!url.includes('res.cloudinary.com') || !url.includes(CLOUDINARY_UPLOAD_MARKER)) return url;

  const [prefix, rest] = url.split(CLOUDINARY_UPLOAD_MARKER);
  // Already carries a format/quality transformation — leave it alone.
  if (/(^|\/)(f_|q_)/.test(rest.split('/')[0] ?? '')) return url;

  const parts = ['f_auto', `q_${options.quality ?? 'auto'}`];
  if (options.width) {
    parts.push(`w_${options.width}`, 'c_limit', 'dpr_auto');
  }

  return `${prefix}${CLOUDINARY_UPLOAD_MARKER}${parts.join(',')}/${rest}`;
}
