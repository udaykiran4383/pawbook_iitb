'use client';

import { useEffect, useState } from 'react';
import { Droplets, Hospital, Clock, AlertTriangle } from 'lucide-react';
import { FIRST_AID, LANG_LABEL, OBSERVATION_DAYS, type Lang } from '@/lib/first-aid';
import { campus } from '@/lib/campus';

const TIMER_KEY = 'pawbook_bite_observation_start';
const LANG_KEY = 'pawbook_first_aid_lang';

/**
 * The bite page. Static, three languages, works with no network.
 *
 * The two steps that decide whether someone lives — wash for fifteen minutes,
 * hospital today — are visually separate from everything else. The rest is
 * secondary and reads that way.
 */
export default function BiteFirstAid() {
  const [lang, setLang] = useState<Lang>('en');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = window.localStorage.getItem(LANG_KEY) as Lang | null;
      if (saved && saved in FIRST_AID) setLang(saved);
      const t = Number(window.localStorage.getItem(TIMER_KEY));
      if (Number.isFinite(t) && t > 0) setStartedAt(t);
    } catch {
      // Blocked storage: the page still works, the timer just won't persist.
    }
  }, []);

  const choose = (l: Lang) => {
    setLang(l);
    try { window.localStorage.setItem(LANG_KEY, l); } catch {}
  };

  const startTimer = () => {
    const now = Date.now();
    setStartedAt(now);
    try { window.localStorage.setItem(TIMER_KEY, String(now)); } catch {}
  };

  const clearTimer = () => {
    setStartedAt(null);
    try { window.localStorage.removeItem(TIMER_KEY); } catch {}
  };

  const c = FIRST_AID[lang];
  const daysElapsed = startedAt ? Math.floor((Date.now() - startedAt) / 86_400_000) : 0;
  const daysLeft = Math.max(0, OBSERVATION_DAYS - daysElapsed);

  return (
    <div className="space-y-5" lang={lang}>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Language">
        {(Object.keys(LANG_LABEL) as Lang[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => choose(l)}
            aria-pressed={lang === l}
            lang={l}
            className={`text-xs font-bold rounded-full px-3 py-1.5 border transition ${
              lang === l ? 'bg-foreground text-background border-foreground' : 'bg-card text-foreground border-border'
            }`}
          >
            {LANG_LABEL[l]}
          </button>
        ))}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{c.heading}</h1>
        <p className="text-sm text-foreground/90 mt-1 leading-relaxed">{c.intro}</p>
      </div>

      <ol className="space-y-3">
        {c.steps.map((step, i) => (
          <li
            key={i}
            className={`rounded-2xl p-4 border-2 ${
              step.critical
                ? 'bg-red-50 dark:bg-red-950/30 border-red-400 dark:border-red-700'
                : 'bg-card border-border'
            }`}
          >
            <p className={`font-bold flex items-center gap-2 ${step.critical ? 'text-red-800 dark:text-red-200 text-lg' : 'text-foreground'}`}>
              {i === 0 ? <Droplets size={20} /> : i === 1 ? <Hospital size={20} /> : <span className="tabular-nums">{i + 1}.</span>}
              {step.title}
            </p>
            <p className={`text-sm mt-1 leading-relaxed ${step.critical ? 'text-red-900 dark:text-red-100' : 'text-foreground/90'}`}>
              {step.body}
            </p>
          </li>
        ))}
      </ol>

      <section className="bg-card border border-border rounded-2xl p-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <AlertTriangle size={15} />
          {c.categories.heading}
        </h2>
        <ol className="mt-2 space-y-1.5">
          {c.categories.items.map((item, i) => (
            <li key={i} className="text-xs text-foreground/90 flex gap-2">
              <span className="font-bold tabular-nums flex-shrink-0">{['I', 'II', 'III'][i]}</span>
              {item}
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-2xl p-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <Clock size={15} />
          {c.timerHeading}
        </h2>
        <p className="text-xs text-foreground/90 mt-1 leading-relaxed">{c.timerBody}</p>
        {mounted && (
          <div className="mt-3">
            {startedAt === null ? (
              <button
                type="button"
                onClick={startTimer}
                className="text-sm font-bold bg-foreground text-background rounded-full px-4 py-2 active:scale-95 transition"
              >
                {c.timerStart}
              </button>
            ) : (
              <div>
                <p className="text-sm font-bold text-foreground tabular-nums">
                  {daysLeft > 0 ? c.timerRunning(daysLeft) : c.timerDone}
                </p>
                <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden" aria-hidden="true">
                  <div className="h-full bg-foreground/70" style={{ width: `${Math.min(100, (daysElapsed / OBSERVATION_DAYS) * 100)}%` }} />
                </div>
                <button type="button" onClick={clearTimer} className="text-xs text-muted-foreground underline mt-2">
                  reset
                </button>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-2">{c.timerNote}</p>
          </div>
        )}
      </section>

      {campus.emergencyContact && (
        <p className="text-sm text-foreground">
          Campus emergency contact: <span className="font-bold">{campus.emergencyContact}</span>
        </p>
      )}

      <p className="text-[11px] text-muted-foreground leading-relaxed">{c.disclaimer}</p>
    </div>
  );
}
