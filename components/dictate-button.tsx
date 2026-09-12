'use client';

import { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import {
  useSpeechRecognition,
  SPEECH_LANGUAGES,
  type SpeechLang,
} from '@/hooks/use-speech-recognition';

interface DictateButtonProps {
  /** Receives the current text and returns nothing; we append, never replace. */
  onAppend: (text: string) => void;
  className?: string;
}

/**
 * A free, browser-native dictation control for long-form text fields.
 *
 * Renders nothing at all where the Web Speech API is unavailable (notably
 * Firefox), so it is purely additive — typing always remains the primary path.
 */
export default function DictateButton({ onAppend, className = '' }: DictateButtonProps) {
  const [lang, setLang] = useState<SpeechLang>('en-IN');

  const { isSupported, isListening, interim, error, toggle } = useSpeechRecognition({
    lang,
    onResult: (text) => onAppend(text),
  });

  if (!isSupported) return null;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={isListening}
          aria-label={isListening ? 'Stop dictation' : 'Dictate your memory'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
            isListening
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-white text-purple-700 border-2 border-purple-200 hover:bg-purple-50'
          }`}
        >
          {isListening ? <Square size={13} /> : <Mic size={13} />}
          {isListening ? 'Stop' : 'Speak'}
        </button>

        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as SpeechLang)}
          disabled={isListening}
          aria-label="Dictation language"
          className="px-2 py-1.5 border-2 border-purple-200 rounded-full text-xs bg-white focus:border-purple-400 focus:outline-none disabled:opacity-60"
        >
          {SPEECH_LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>

        {isListening && (
          <span className="text-xs text-purple-600 animate-pulse">Listening…</span>
        )}
      </div>

      {interim && (
        <p className="text-xs text-purple-500 italic truncate" aria-live="polite">
          {interim}
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {isListening && (
        <p className="text-[11px] text-purple-400">
          Speech-to-text often mishears names and mixed Hindi/English — please check the text before saving.
        </p>
      )}
    </div>
  );
}
