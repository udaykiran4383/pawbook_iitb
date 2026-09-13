'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileDown, ClipboardCheck, ShieldCheck, AlertTriangle, ClipboardCopy, Check } from 'lucide-react';
import { useAnimalStore } from '@/lib/animal-store';
import { useCampus } from '@/components/campus-provider';
import { getCoverage, getWelfare } from '@/lib/coverage';
import { getPresence } from '@/lib/presence';
import { lifecycleCounts, LIFECYCLE } from '@/lib/lifecycle';
import { buildRegisterBundle, scheduleIIICsv, scheduleIVCsv } from '@/lib/export';
import { toAbcEvents } from '@/lib/abc-events';

/**
 * The institution's view of the same data the students keep.
 *
 * A Nodal Officer, a Dean's office or a Public Health Office does not want the
 * scrapbook. They want: how many animals, how many verified sterilised and
 * vaccinated, who is flagged, what has not been seen, and files they can attach
 * to a return or an affidavit — in the vocabulary the ABC Rules use. This page
 * is that, generated from the live ledger, with nothing typed in by hand.
 *
 * Honest limit: there are no accounts in PawBook, so this page is a view, not a
 * permission boundary. Anyone can open it. The optional access code in
 * NEXT_PUBLIC_OFFICIALS_CODE is friction, not security. Real roles, audit
 * trails and signed returns are what an institutional tier would add.
 */

const COMPLIANCE_ITEMS: Array<{ key: string; label: string; hint: string }> = [
  { key: 'nodal', label: 'Nodal Officer named and displayed at the gate', hint: 'Direction 25(C), 7 Nov 2025 order' },
  { key: 'affidavit', label: 'Liability affidavit filed by the student animal body', hint: 'Para 74, 2026 INSC 506' },
  { key: 'spots', label: 'Feeding spots and times designated', hint: 'Direction 25(D); BMC guidelines cl. 3' },
  { key: 'rules', label: 'Care rules published to the campus', hint: 'This site: /rules' },
  { key: 'awareness', label: 'Bite first-aid and reporting awareness run this year', hint: 'Direction 25(G); this site: /bite' },
  { key: 'register', label: 'Register filed with the institution this month', hint: 'Export below; keep the cover sheet' },
];

const CODE_KEY = 'pawbook_officials_ok';

export default function OfficialsDashboard() {
  const { campus, basePath } = useCampus();
  const animals = useAnimalStore((s) => s.animals);
  const emergencies = useAnimalStore((s) => s.emergencies);
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState('');
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  const required = process.env.NEXT_PUBLIC_OFFICIALS_CODE;
  const storageKey = `pawbook_compliance:${campus.slug}`;

  useEffect(() => {
    setMounted(true);
    try {
      if (!required || window.localStorage.getItem(CODE_KEY) === '1') setUnlocked(true);
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setChecks(JSON.parse(saved));
    } catch {}
  }, [required, storageKey]);

  const toggle = (key: string) => {
    const next = { ...checks, [key]: !checks[key] };
    setChecks(next);
    try { window.localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
  };

  const stats = useMemo(() => {
    const living = animals.filter((a) => a.status !== 'deceased');
    const now = Date.now();
    return {
      counts: lifecycleCounts(animals),
      coverage: getCoverage(animals, now),
      welfare: getWelfare(animals),
      unseen: living.filter((a) => getPresence(a, now).state === 'unseen'),
      flagged: living.filter((a) => a.observation?.visible_wound || a.observation?.body_condition === 'thin'),
      openEmergencies: (Array.isArray(emergencies) ? emergencies : []).filter((e) => !e.resolved),
      events: animals.flatMap((a) => toAbcEvents(a, campus.name)).length,
      chipped: animals.filter((a) => a.external_ids?.nddb_id).length,
    };
  }, [animals, emergencies, campus.name]);

  const month = new Date().toISOString().slice(0, 7);
  const stamp = new Date().toISOString().slice(0, 10);
  const slug = campus.shortName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const download = (name: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  };
  const bundle = () => buildRegisterBundle(animals, campus.name, campus.estimatedPopulation);

  if (!mounted) return null;

  if (!unlocked) {
    return (
      <div className="max-w-sm mx-auto bg-card border border-border rounded-2xl p-5 mt-8">
        <p className="text-sm font-bold text-foreground flex items-center gap-1.5"><ShieldCheck size={16} /> Institution view</p>
        <p className="text-xs text-muted-foreground mt-1">Enter the access code your campus set.</p>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full mt-3 px-3 py-2 rounded-xl border border-input bg-background text-foreground"
          aria-label="Access code"
        />
        <button
          type="button"
          onClick={() => { if (code === required) { setUnlocked(true); try { window.localStorage.setItem(CODE_KEY, '1'); } catch {} } }}
          className="w-full mt-3 bg-foreground text-background font-bold py-2 rounded-xl"
        >
          Open
        </button>
      </div>
    );
  }

  const Stat = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-xs font-bold text-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );

  const done = COMPLIANCE_ITEMS.filter((i) => checks[i.key]).length;

  return (
    <div className="space-y-6">
      <div>
        <Link href={basePath || '/'} className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition">
          <ArrowLeft size={16} /> PawBook {campus.shortName}
        </Link>
        <h1 className="text-2xl font-bold text-foreground mt-3 flex items-center gap-2">
          <ShieldCheck size={24} /> {campus.name} — institution view
        </h1>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          The same records the campus keeps, as an officer needs them: counts, verified coverage, who needs
          attention, and files in the ABC Rules&apos; own format. Nothing on this page is typed in — it is all
          derived from the live register.
        </p>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Animals on record" value={animals.length} sub={`${stats.counts.active} on campus · ${stats.counts.deceased} passed`} />
        <Stat label="Sterilised (verified)" value={`${stats.coverage.sterilisedVerified} / ${stats.coverage.denominator}`} sub={`${stats.coverage.sterilised} incl. unverified reports`} />
        <Stat label="Rabies current (verified)" value={`${stats.coverage.rabiesCurrentVerified} / ${stats.coverage.denominator}`} sub={`${stats.coverage.rabiesCurrent} incl. unverified`} />
        <Stat label="Chipped (NDDB id)" value={stats.chipped} sub="ISO 11784, 15-digit" />
        <Stat label="Not seen 45+ days" value={stats.unseen.length} sub={stats.unseen.slice(0, 3).map((a) => a.name).join(', ')} />
        <Stat label="Flagged on survey" value={stats.flagged.length} sub={stats.flagged.slice(0, 3).map((a) => a.name).join(', ') || 'wound or thin'} />
        <Stat label="Open emergency reports" value={stats.openEmergencies.length} />
        <Stat label="ABC events in ledger" value={stats.events} sub="Schema v0.1" />
      </section>

      {campus.estimatedPopulation && (
        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          PawBook has {animals.filter((a) => a.status !== 'deceased').length} living animals on record against an estimated
          ~{campus.estimatedPopulation} on campus. The figures above describe the animals on record, not the campus.
        </p>
      )}

      {stats.welfare.surveyed > 0 && (
        <section className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm font-bold text-foreground">Welfare indicators</p>
          <p className="text-xs text-muted-foreground mt-1">
            Of {stats.welfare.surveyed} surveyed: {stats.welfare.thin} thin · {stats.welfare.hairLoss} hair loss ·{' '}
            {stats.welfare.wound} visible wound · {stats.welfare.ectoparasites} ticks or fleas
          </p>
        </section>
      )}

      <section className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <ClipboardCheck size={16} /> Compliance checklist <span className="text-xs font-normal text-muted-foreground">({done}/{COMPLIANCE_ITEMS.length})</span>
        </p>
        <ul className="mt-2 space-y-2">
          {COMPLIANCE_ITEMS.map((item) => (
            <li key={item.key}>
              <label className="flex items-start gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={Boolean(checks[item.key])} onChange={() => toggle(item.key)} className="mt-0.5 accent-foreground" />
                <span>
                  {item.label}
                  <span className="block text-[11px] text-muted-foreground">{item.hint}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-muted-foreground mt-3">
          Self-attested, saved on this device. These are the obligations the courts and the institution have set out;
          confirm the current requirements with {campus.authorityOffice}.
        </p>
      </section>

      <section className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-bold text-foreground">Files for the return</p>
        <p className="text-xs text-muted-foreground mt-1">
          Zones only, no coordinates, no contributor identities. The cover sheet carries a SHA-256 of each file.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <button type="button" onClick={async () => download(`pawbook-${slug}-register-${stamp}.csv`, (await bundle()).register)} className="inline-flex items-center gap-1.5 text-xs font-bold bg-foreground text-background rounded-full px-3 py-2"><FileDown size={14} /> Register</button>
          <button type="button" onClick={async () => download(`pawbook-${slug}-abc-events-${stamp}.csv`, (await bundle()).abcEvents)} className="inline-flex items-center gap-1.5 text-xs font-bold border border-border text-foreground rounded-full px-3 py-2"><FileDown size={14} /> ABC events (Schema v0.1)</button>
          <button type="button" onClick={() => download(`pawbook-${slug}-schedule-III-${month}.csv`, scheduleIIICsv(animals, campus.name, month))} className="inline-flex items-center gap-1.5 text-xs font-bold border border-border text-foreground rounded-full px-3 py-2"><FileDown size={14} /> Schedule III ({month})</button>
          <button type="button" onClick={() => download(`pawbook-${slug}-schedule-IV-${month}.csv`, scheduleIVCsv(animals, campus.name, month))} className="inline-flex items-center gap-1.5 text-xs font-bold border border-border text-foreground rounded-full px-3 py-2"><FileDown size={14} /> Schedule IV ({month})</button>
          <button type="button" onClick={async () => download(`pawbook-${slug}-sightings-${stamp}.csv`, (await bundle()).sightings)} className="inline-flex items-center gap-1.5 text-xs font-bold border border-border text-foreground rounded-full px-3 py-2"><FileDown size={14} /> Sightings</button>
          <button type="button" onClick={async () => download(`pawbook-${slug}-medical-${stamp}.csv`, (await bundle()).medical)} className="inline-flex items-center gap-1.5 text-xs font-bold border border-border text-foreground rounded-full px-3 py-2"><FileDown size={14} /> Medical</button>
          <button
            type="button"
            onClick={async () => { try { await navigator.clipboard.writeText((await bundle()).summary); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} }}
            className="inline-flex items-center gap-1.5 text-xs font-bold border border-border text-foreground rounded-full px-3 py-2"
          >
            {copied ? <Check size={14} /> : <ClipboardCopy size={14} />} {copied ? 'Copied' : 'Cover sheet'}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
          Schedules III and IV follow the ABC Rules 2023 and are derived from the ledger. Their signature columns are left
          for the MVO/JVO and DVO. Schema: <a href="/schema/abc-event.v0.1.json" className="underline">/schema/abc-event.v0.1.json</a>.
        </p>
      </section>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        This view has no login. It is the institution&apos;s window on the same public register, not a permission
        boundary. Named roles, an audit trail and signed monthly returns are the institutional tier.
      </p>
    </div>
  );
}
