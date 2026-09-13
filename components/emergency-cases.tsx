'use client';

import { useState, useMemo, useRef } from 'react';
import { useAnimalStore } from '@/lib/animal-store';
import { ANONYMOUS, getUserName } from '@/lib/identity';
import {
  STATUS_LABEL,
  isClosed,
  newEmergencyUpdate,
  sortEmergencies,
  sortUpdates,
  statusOf,
  updatesOf,
  type EmergencyCase,
  type EmergencyStatus,
  type EmergencyUpdate,
} from '@/lib/emergency';
import { uploadImageToCloudinary } from '@/lib/upload-image';
import { useCampus } from '@/components/campus-provider';
import { X, Camera } from 'lucide-react';
import Link from 'next/link';

const statusPill: Record<EmergencyStatus, string> = {
  open: 'bg-white/70 text-foreground',
  responder_on_way: 'bg-blue-200 text-blue-900',
  at_vet: 'bg-purple-200 text-purple-900',
  resolved: 'bg-green-200 text-green-800',
  reopened: 'bg-red-200 text-red-900',
  closed_not_found: 'bg-gray-200 text-gray-800',
  closed_duplicate: 'bg-gray-200 text-gray-800',
};

/** The statuses a person can pick from the update form. Resolving has its own button, with a photo. */
const PICKABLE: EmergencyStatus[] = ['responder_on_way', 'at_vet', 'closed_not_found', 'closed_duplicate'];

function when(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

type PanelMode = 'update' | 'resolve' | 'reopen';

/**
 * The one form behind "Add update", "Mark resolved" and "Not actually
 * resolved". They differ only in which status they set and what they ask for,
 * so one component keeps the photo-upload plumbing in one place.
 */
function UpdatePanel({
  mode,
  onSubmit,
  onCancel,
}: {
  mode: PanelMode;
  onSubmit: (fields: { note?: string; status?: EmergencyStatus; photo_url?: string }) => void;
  onCancel: () => void;
}) {
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<EmergencyStatus | ''>('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const copy = {
    update: {
      title: 'Add an update',
      hint: 'What has changed? A note, a photo, or both.',
      photo: 'Add a photo',
      submit: 'Post update',
    },
    resolve: {
      title: 'Mark resolved',
      hint: 'A photo of the animal now helps the next person believe it — optional.',
      photo: 'Photo of the animal now',
      submit: 'Resolve',
    },
    reopen: {
      title: 'Not actually resolved',
      hint: 'What is still wrong? A line is enough.',
      photo: 'Add a photo',
      submit: 'Reopen',
    },
  }[mode];

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setFailed(false);
    try {
      setPhoto(await uploadImageToCloudinary(file, 'pawbook/emergencies'));
    } catch {
      // A failed upload should not lose the note someone has typed.
      setPhoto(null);
      setFailed(true);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = () => {
    if (busy) return;
    const forced: EmergencyStatus | undefined = mode === 'resolve' ? 'resolved' : mode === 'reopen' ? 'reopened' : undefined;
    const picked = forced ?? (status || undefined);
    // An update with nothing in it says nothing; a status change on its own is fine.
    if (!picked && !note.trim() && !photo) return;
    onSubmit({ note, status: picked, photo_url: photo ?? undefined });
  };

  return (
    <div className="bg-white/70 rounded-xl p-3 space-y-2">
      <p className="text-sm font-bold text-foreground">{copy.title}</p>
      <p className="text-xs text-muted-foreground">{copy.hint}</p>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder={mode === 'reopen' ? 'Still limping, same spot…' : 'Vet says fracture; kept overnight…'}
        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
      />
      {mode === 'update' && (
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as EmergencyStatus | '')}
          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">Status unchanged</option>
          {PICKABLE.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1 text-xs font-bold text-foreground border border-border rounded-full px-3 py-1 hover:bg-white disabled:opacity-60"
        >
          <Camera size={14} /> {busy ? 'Uploading…' : photo ? 'Change photo' : copy.photo}
        </button>
        {photo && <img src={photo} alt="" className="h-12 w-12 rounded-lg object-cover border border-border" />}
        {failed && <span className="text-xs text-red-700">Upload failed — try again or post without it.</span>}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 text-sm font-bold border border-border text-foreground rounded-lg hover:bg-white"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="flex-1 py-2 text-sm font-bold bg-foreground text-background rounded-lg active:scale-95 disabled:opacity-60"
        >
          {copy.submit}
        </button>
      </div>
    </div>
  );
}

/** The report's history, oldest first, as a compact thread. */
function UpdateThread({ updates }: { updates: EmergencyUpdate[] }) {
  if (updates.length === 0) return null;
  return (
    <ol className="space-y-1.5 border-t border-white/60 pt-2">
      {sortUpdates(updates).map((u) => (
        <li key={u.id} className="text-xs text-foreground/90 flex gap-2">
          <span className="shrink-0 text-muted-foreground whitespace-nowrap">{when(u.at)}</span>
          <span className="min-w-0">
            <span className="font-bold">{u.by || ANONYMOUS}</span>
            {u.status && <span className="ml-1 font-bold">· {STATUS_LABEL[u.status] ?? u.status}</span>}
            {u.note && <span className="ml-1">— {u.note}</span>}
            {u.photo_url && (
              <a href={u.photo_url} target="_blank" rel="noreferrer" className="block mt-1">
                <img src={u.photo_url} alt="" className="h-16 w-16 rounded-lg object-cover border border-white/60" />
              </a>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}

function EmergencyCard({ report }: { report: EmergencyCase }) {
  const [panel, setPanel] = useState<PanelMode | null>(null);
  const status = statusOf(report);
  const closed = isClosed(status);
  const responders = Array.isArray(report.responders) ? report.responders : [];
  const updates = updatesOf(report);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'from-red-100 to-red-50 border-red-300';
      case 'urgent':
        return 'from-orange-100 to-orange-50 border-orange-300';
      case 'moderate':
        return 'from-yellow-100 to-yellow-50 border-yellow-300';
      default:
        return 'from-gray-100 to-gray-50 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'urgent':
        return '⚠️';
      case 'moderate':
        return '❗';
      default:
        return '📢';
    }
  };

  // Resolving and reopening are ordinary updates that happen to carry a
  // status, so the note and the photo land in the same thread entry as the
  // change they explain.
  const post = (fields: { note?: string; status?: EmergencyStatus; photo_url?: string }) => {
    useAnimalStore.getState().addEmergencyUpdate(report.id, newEmergencyUpdate({ by: getUserName(), ...fields }));
    setPanel(null);
  };

  return (
    <div
      className={`on-tint bg-gradient-to-br ${getSeverityColor(report.severity)} border-2 p-4 rounded-2xl soft-shadow hover:shadow-lg transition`}
    >
      <div className="flex items-start justify-between mb-3 gap-2">
        <span className="text-3xl">{getSeverityIcon(report.severity)}</span>
        <span className={`${statusPill[status]} px-3 py-1 rounded-full text-xs font-bold text-right`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      <p className="font-bold text-foreground mb-2">{report.description}</p>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
        <span>📍</span>
        <span>{report.location}</span>
      </div>

      <div className="space-y-2">
        {!closed && responders.length > 0 && (
          <p className="text-xs text-center text-foreground/80">
            {responders.length} {responders.length === 1 ? 'person is' : 'people are'} on the way
          </p>
        )}

        {panel ? (
          <UpdatePanel mode={panel} onSubmit={post} onCancel={() => setPanel(null)} />
        ) : closed ? (
          // One button after closure, on purpose. The person who finds the
          // dog still limping should not have to work out which of five
          // statuses to pick — they say it is not fixed, and it reopens.
          <button
            onClick={() => setPanel('reopen')}
            className="w-full border border-white/60 text-foreground py-2 rounded-lg font-bold text-sm transition active:scale-95 hover:bg-white/40"
          >
            Not actually resolved
          </button>
        ) : (
          <>
            <div className="flex gap-2">
              <button
                onClick={() => useAnimalStore.getState().respondToEmergency(report.id, getUserName())}
                className="flex-1 bg-white/70 hover:bg-white text-foreground py-2 rounded-lg font-bold text-sm transition active:scale-95"
              >
                I'm Helping
              </button>
              <button
                onClick={() => setPanel('resolve')}
                className="flex-1 border border-white/60 text-foreground py-2 rounded-lg font-bold text-sm transition active:scale-95 hover:bg-white/40"
              >
                Mark Resolved
              </button>
            </div>
            <button
              onClick={() => setPanel('update')}
              className="w-full text-xs font-bold text-foreground/80 hover:text-foreground py-1"
            >
              + Add an update or photo
            </button>
          </>
        )}

        <UpdateThread updates={updates} />
      </div>
    </div>
  );
}

export default function EmergencyCases() {
  const { basePath } = useCampus();
  const [showModal, setShowModal] = useState(false);
  // Reports come from the shared store, so they survive a reload and are
  // visible to everyone. This list used to be seeded in useState with two
  // invented reports — a "critical" injured dog at the sports complex among
  // them — which rendered on the homepage indistinguishably from real ones.
  const stored = useAnimalStore((state) => state.emergencies);
  const cases = useMemo(() => sortEmergencies(Array.isArray(stored) ? stored : []), [stored]);
  const [formData, setFormData] = useState({
    description: '',
    severity: 'urgent' as const,
    location: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.location.trim()) return;

    const newCase: EmergencyCase = {
      id: `er_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...formData,
      images: [],
      timestamp: new Date().toISOString(),
      status: 'open',
      updates: [],
      resolved: false,
      responders: [],
    };

    useAnimalStore.getState().addEmergency(newCase);
    setFormData({ description: '', severity: 'urgent', location: '' });
    setShowModal(false);
  };

  return (
    <div className="my-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          🚨 Emergency Cases
          <Link href={`${basePath}/bite`} className="ml-2 text-xs font-bold text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 rounded-full px-3 py-1 hover:bg-red-50 dark:hover:bg-red-950/40 whitespace-nowrap">
            Bitten? Read this
          </Link>
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-full text-sm md:text-base font-bold hover:shadow-lg transition soft-shadow"
        >
          Report Emergency
        </button>
      </div>

      {/* Emergency Cases Grid */}
      {cases.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-lg">No active emergencies reported. Great news! 🎉</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cases.map((report) => (
            <EmergencyCard key={report.id} report={report} />
          ))}
        </div>
      )}

      {/* Emergency Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 soft-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-foreground">Report Emergency</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the emergency..."
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Where is this happening?"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Severity
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="moderate">Moderate</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border-2 border-gray-200 text-foreground rounded-lg font-bold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition"
                >
                  Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
