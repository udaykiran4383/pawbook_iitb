'use client';

import { useEffect, useState } from 'react';
import { UserRound, X } from 'lucide-react';
import { ANONYMOUS, MAX_HANDLE_LENGTH, getUserName, setUserName } from '@/lib/identity';

/**
 * Lets someone choose how their contributions are credited.
 *
 * Anonymous is the default and needs no interaction at all — this exists so
 * that being named is an opt-in with the consequences written next to it,
 * rather than the answer to a browser prompt that appeared before anyone had
 * decided anything.
 */
export default function IdentityControl() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(ANONYMOUS);
  const [draft, setDraft] = useState('');

  // localStorage is not available during render on the server, so the label
  // stays neutral until we are on the client.
  useEffect(() => {
    setMounted(true);
    setName(getUserName());
  }, []);

  const isAnonymous = name === ANONYMOUS;

  const save = () => {
    setUserName(draft);
    setName(getUserName());
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setDraft(isAnonymous ? '' : name);
          setOpen(true);
        }}
        aria-label={mounted ? `Contributing as ${name}. Change how you are credited.` : 'Choose how you are credited'}
        className="fixed top-3 right-16 z-50 h-11 px-3 rounded-full bg-card border border-border shadow-sm hover:shadow-md active:scale-95 transition flex items-center gap-1.5 text-foreground max-w-[9rem]"
      >
        <UserRound size={16} aria-hidden="true" className="flex-shrink-0" />
        <span className="text-xs font-bold truncate">{mounted ? name : '…'}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-foreground">How should we credit you?</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-muted-foreground hover:text-foreground transition"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Leave this empty to stay anonymous — that is the default, and everything
              works exactly the same.
            </p>

            <label htmlFor="pawbook-handle" className="block text-xs font-bold text-foreground mt-4">
              Display name (optional)
            </label>
            <input
              id="pawbook-handle"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={MAX_HANDLE_LENGTH}
              placeholder="A nickname, not your full name"
              className="w-full mt-1 px-3 py-2 rounded-xl border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none"
            />

            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Anything you enter is stored with every animal you feed or report and is
              visible to everyone. A first name or nickname is plenty — please don&apos;t
              use your full name, roll number or phone number.
            </p>

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setDraft('');
                  setUserName('');
                  setName(ANONYMOUS);
                  setOpen(false);
                }}
                className="flex-1 border border-border text-foreground font-bold py-2 rounded-xl hover:bg-muted active:scale-95 transition text-sm"
              >
                Stay anonymous
              </button>
              <button
                type="button"
                onClick={save}
                className="flex-1 bg-primary text-primary-foreground font-bold py-2 rounded-xl active:scale-95 transition text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
