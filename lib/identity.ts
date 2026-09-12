/**
 * The name attached to a contribution.
 *
 * This used to be a `window.prompt("What is your name?")` fired the first time
 * anyone tapped anything, and whatever was typed — often a real full name — was
 * written into the shared row, which is served by a public endpoint and kept
 * indefinitely.
 *
 * Two things changed. Nobody is asked for a name any more: contributions are
 * anonymous unless a person deliberately sets a handle. And the copy around
 * that choice says plainly that it is public, so it is a decision rather than a
 * reflex answer to a browser dialog.
 *
 * The reason is not squeamishness about credit. Para 74 of 2026 INSC 506 makes
 * campus animal groups file a liability affidavit, and the Kerala High Court has
 * held bodies liable in damages for stray-dog bites, so "who feeds this animal"
 * is a question with legal and personal-safety weight. WAG, the welfare group
 * actually operating at IITB, publishes no member directory and renders even its
 * email as an image. Since the store cannot be secured without real accounts,
 * the protection has to be collecting less.
 */

const STORAGE_KEY = 'pawbook_user_name';

/** What a contribution is credited to when no handle is set. */
export const ANONYMOUS = 'A student';

/** Handles are short so the UI cannot be used as a message board. */
export const MAX_HANDLE_LENGTH = 24;

/**
 * The current handle, or the anonymous label.
 *
 * Synchronous and never prompts, so it is safe to call inside an event handler
 * or a store action — which is where every caller uses it.
 */
export function getUserName(): string {
  if (typeof window === 'undefined') return ANONYMOUS;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const trimmed = stored?.trim();
    return trimmed ? trimmed : ANONYMOUS;
  } catch {
    // Private browsing and blocked storage both throw rather than return null.
    return ANONYMOUS;
  }
}

/** True when the person has deliberately chosen to be credited. */
export function hasUserName(): boolean {
  return getUserName() !== ANONYMOUS;
}

export function setUserName(name: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = name.trim().slice(0, MAX_HANDLE_LENGTH);
  try {
    if (trimmed) {
      window.localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Nothing to do — the contribution is simply anonymous.
  }
}

export function clearUserName(): void {
  setUserName('');
}
