/**
 * Image moderation for anonymous uploads.
 *
 * Context: PawBook has no authentication, so `/api/upload-image` is a public,
 * unauthenticated write endpoint. That is the real abuse vector, and the team
 * has no standing moderator. OpenAI's `omni-moderation-latest` accepts images
 * and is free to call, so it is used here as an automated tripwire.
 *
 * IMPORTANT DOMAIN NUANCE — why we do not block graphic violence:
 * This app exists partly to document injured animals and their medical care.
 * A photo of an open wound, a road-accident injury, or a post-surgery dressing
 * is the *core legitimate use case*, and a general-purpose classifier will
 * readily flag such an image under `violence/graphic`. Blocking on that
 * category would reject exactly the uploads the app is for. So the block list
 * below covers only categories that indicate genuine misuse of a public
 * endpoint, and deliberately omits every violence/gore category.
 *
 * Failure policy: this gate FAILS OPEN. If no API key is configured, or the
 * moderation call errors or times out, the upload proceeds. A moderation
 * outage must not stop someone reporting an injured animal at 2 a.m. The
 * tradeoff is deliberate; the gate reduces exposure, it does not guarantee it.
 */

const MODERATION_ENDPOINT = 'https://api.openai.com/v1/moderations';
const MODERATION_MODEL = 'omni-moderation-latest';
const REQUEST_TIMEOUT_MS = 8000;

/** omni-moderation accepts images up to 20 MB; stay well under it. */
const MAX_MODERATION_BYTES = 15 * 1024 * 1024;

/**
 * Categories that cause a hard reject. Intentionally excludes
 * `violence`, `violence/graphic` and `self-harm/instructions` — see the note
 * above about injured-animal photos.
 */
const BLOCKING_CATEGORIES = [
  'sexual',
  'sexual/minors',
  'hate',
  'hate/threatening',
  'harassment',
  'harassment/threatening',
] as const;

export type ModerationVerdict =
  | { action: 'allow'; reason: 'clean' | 'not-configured' | 'unavailable' }
  | { action: 'reject'; reason: 'flagged'; categories: string[] };

/**
 * Screens an image before it is persisted.
 * Never throws — callers can treat the verdict as authoritative.
 */
export async function moderateImage(file: File): Promise<ModerationVerdict> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Not configured: allow, but make the gap visible in logs rather than silent.
    console.warn(
      '[moderation] OPENAI_API_KEY is not set — anonymous image uploads are NOT being screened.'
    );
    return { action: 'allow', reason: 'not-configured' };
  }

  if (file.size > MAX_MODERATION_BYTES) {
    console.warn(`[moderation] Skipping screen: file too large (${file.size} bytes).`);
    return { action: 'allow', reason: 'unavailable' };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

    const response = await fetch(MODERATION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODERATION_MODEL,
        input: [{ type: 'image_url', image_url: { url: dataUrl } }],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.warn(`[moderation] Screen unavailable (HTTP ${response.status}); allowing upload.`);
      return { action: 'allow', reason: 'unavailable' };
    }

    const payload = await response.json();
    const categories: Record<string, boolean> | undefined = payload?.results?.[0]?.categories;

    if (!categories) {
      console.warn('[moderation] Unexpected response shape; allowing upload.');
      return { action: 'allow', reason: 'unavailable' };
    }

    const hits = BLOCKING_CATEGORIES.filter((category) => categories[category] === true);

    if (hits.length > 0) {
      // Log the category, never the image itself.
      console.warn(`[moderation] Upload rejected. Categories: ${hits.join(', ')}`);
      return { action: 'reject', reason: 'flagged', categories: [...hits] };
    }

    return { action: 'allow', reason: 'clean' };
  } catch (error) {
    console.warn('[moderation] Screen failed; allowing upload.', error);
    return { action: 'allow', reason: 'unavailable' };
  }
}
