'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Thin wrapper over the Web Speech API (SpeechRecognition).
 *
 * Why this and not a server-side Whisper pipeline: at PawBook's scale the
 * entire corpus is a handful of memories a year, so a paid transcription
 * pipeline (upload -> storage -> queue -> transcribe) costs pennies but adds a
 * permanent failure surface. The browser API is free, needs no backend, and
 * degrades to "nothing renders" where unsupported.
 *
 * Support (as of 2026): Chrome 25+ (desktop and Android), Edge, Opera, and
 * Safari 14.1+ / iOS 14.5+ behind the `webkit` prefix. Firefox keeps it behind
 * a flag, so treat absence as normal, not as an error.
 *
 * Accuracy note: recognition of Indian-accented English and of Hindi/Marathi
 * code-switched speech is materially worse than native-English benchmarks, so
 * the transcript is always treated as an editable draft, never as a final
 * record. That is why `onResult` appends into a textarea the user can fix.
 */

export type SpeechLang = 'en-IN' | 'hi-IN' | 'mr-IN';

export const SPEECH_LANGUAGES: { value: SpeechLang; label: string }[] = [
  { value: 'en-IN', label: 'English (India)' },
  { value: 'hi-IN', label: 'हिन्दी' },
  { value: 'mr-IN', label: 'मराठी' },
];

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useSpeechRecognition(options?: {
  lang?: SpeechLang;
  /** Called with each finalised chunk of transcript. */
  onResult?: (text: string) => void;
}) {
  const { lang = 'en-IN', onResult } = options ?? {};

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // Keep the latest callback without re-creating the recognition instance.
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  // Detect support on the client only, so SSR and the client agree on the
  // first render and we don't trip a hydration mismatch.
  useEffect(() => {
    setIsSupported(getRecognitionCtor() !== null);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;

    // Restarting while an instance is live throws in Chrome; tear down first.
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    setError(null);
    setInterim('');

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript: string = result[0]?.transcript ?? '';
        if (result.isFinal) finalText += transcript;
        else interimText += transcript;
      }
      setInterim(interimText);
      if (finalText.trim()) onResultRef.current?.(finalText);
    };

    recognition.onerror = (event: any) => {
      const code = event?.error;
      // `aborted` and `no-speech` are routine, not failures worth surfacing.
      if (code === 'aborted' || code === 'no-speech') return;
      setError(
        code === 'not-allowed' || code === 'service-not-allowed'
          ? 'Microphone permission denied.'
          : 'Speech recognition unavailable. Please type instead.'
      );
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterim('');
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setError('Could not start the microphone.');
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [lang]);

  const toggle = useCallback(() => {
    if (isListening) stop();
    else start();
  }, [isListening, start, stop]);

  // Make sure we never leave the mic open when the form unmounts.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  return { isSupported, isListening, interim, error, start, stop, toggle };
}
