'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Heart, MapPin, Camera, Image as ImageIcon, MessageCircle, Clock, Pill, BookHeart, ChevronDown, ChevronUp, Plus, Send, Calendar, Trash2, ExternalLink } from 'lucide-react';
import { formatTimeSince } from '@/lib/care-tracking';
import { getDisplayActorName, getUserName } from '@/lib/utils';
import { useImageStore } from '@/lib/image-store';
import type { Animal, Comment, StudentMemory, MedicalRecord } from '@/lib/demo-data';
import { useAnimalStore } from '@/lib/animal-store';
import { uploadImageToCloudinary } from '@/lib/upload-image';
import { getFallbackAvatar } from '@/lib/animal-avatar';
import { optimizeImageUrl } from '@/lib/image-url';
import CareTracker from '@/components/care-tracker';
import TrustBadge from '@/components/trust-badge';
import DictateButton from '@/components/dictate-button';
import { getMemoryPrompts, defaultMemoryKind, type MemoryKind } from '@/lib/memory-prompts';
import ObservationForm from '@/components/observation-form';
import { LIFECYCLE, suggestedLifecycle } from '@/lib/lifecycle';
import WhereTheyveBeen from '@/components/where-theyve-been';
import { tenureLine } from '@/lib/life-story';
import LifeStory from '@/components/life-story';
import { assessFile } from '@/lib/photo-quality';

const EMPTY_IMAGES: any[] = [];



interface AnimalProfileModalProps {
  animal: Animal;
  onClose: () => void;
}

type TabKey = 'gallery' | 'memories' | 'medical' | 'care';

export default function AnimalProfileModal({ animal: initialAnimal, onClose }: AnimalProfileModalProps) {
  const animal = useAnimalStore(state => state.animals.find(a => a.id === initialAnimal.id)) || initialAnimal;
  const [activeTab, setActiveTab] = useState<TabKey>('gallery');
  const [profileImage, setProfileImage] = useState<string | null>(animal.profile_image);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [showMemoryForm, setShowMemoryForm] = useState(false);
  const [memoryForm, setMemoryForm] = useState({ text: '', memory_type: 'happy' as StudentMemory['memory_type'] });
  // The question someone picked to answer, used as the placeholder so the box
  // stops being blank. Not saved — the memory should stand on its own.
  const [memoryPrompt, setMemoryPrompt] = useState<string | null>(null);
  const [memoryPhoto, setMemoryPhoto] = useState<string | null>(null);
  const [memoryPhotoBusy, setMemoryPhotoBusy] = useState(false);
  const memoryPhotoRef = useRef<HTMLInputElement>(null);
  const [memoryFilter, setMemoryFilter] = useState<'all' | StudentMemory['memory_type']>('all');
  const [memoryView, setMemoryView] = useState<'list' | 'story'>('list');
  const [showMedicalForm, setShowMedicalForm] = useState(false);
  const [newMedicalRecord, setNewMedicalRecord] = useState<Partial<MedicalRecord>>({});

  const [photoAdvice, setPhotoAdvice] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const addImage = useImageStore(state => state.addImage);
  const storedImages = useImageStore(state => state.images[animal.id] || EMPTY_IMAGES);

  const isDeceased = animal.status === 'deceased';

  const handleProfileImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Advice, never a block: a blurry photo of an injured animal at night is
    // still the most important photo anyone takes that day.
    const quality = await assessFile(file);
    setPhotoAdvice(quality.advice);
    try {
      const uploadedUrl = await uploadImageToCloudinary(file, 'pawbook/profiles');
      useAnimalStore.getState().updateAnimal(animal.id, { profile_image: uploadedUrl });
      setProfileImage(uploadedUrl);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }, [animal.id]);

  const handleGalleryUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploadedUrl = await uploadImageToCloudinary(file, 'pawbook/gallery');
      addImage(animal.id, {
        id: `img_${Date.now()}`,
        animalId: animal.id,
        url: uploadedUrl,
        uploadedAt: new Date().toISOString(),
        uploadedBy: getUserName(),
        likes: 0,
        caption: `Photo of ${animal.name}`,
      });
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }, [animal.id, animal.name, addImage]);

  const handleComment = () => {
    if (!newComment.trim()) return;
    useAnimalStore.getState().addComment(animal.id, {
      id: `c_${Date.now()}`,
      author: getUserName(),
      text: newComment,
      timestamp: new Date().toISOString(),
      likes: 0,
    });
    setNewComment('');
  };

  const handleMemoryPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMemoryPhotoBusy(true);
    try {
      setMemoryPhoto(await uploadImageToCloudinary(file, 'pawbook/memories'));
    } catch {
      // Upload failures should not lose the text someone has typed.
      setMemoryPhoto(null);
    } finally {
      setMemoryPhotoBusy(false);
      if (memoryPhotoRef.current) memoryPhotoRef.current.value = '';
    }
  };

  const handleShareMemory = () => {
    if (!memoryForm.text.trim()) return;
    useAnimalStore.getState().addMemory(animal.id, {
      id: `m_${Date.now()}`,
      author: getUserName(),
      text: memoryForm.text,
      // photo_url has been on the type since the start; the form never offered it.
      photo_url: memoryPhoto ?? undefined,
      timestamp: new Date().toISOString(),
      likes: 0,
      memory_type: memoryForm.memory_type,
    });
    setMemoryForm({ text: '', memory_type: 'happy' });
    setMemoryPhoto(null);
    setShowMemoryForm(false);
  };

  const handleLike = () => {
    if (!liked) {
      useAnimalStore.getState().likeAnimal(animal.id);
      setLiked(true);
    }
  };

  const handleLikeMemory = (memoryId: string) => {
    useAnimalStore.getState().likeMemory(animal.id, memoryId);
  };

  const handleSaveMedicalRecord = () => {
    if (!newMedicalRecord.title || !newMedicalRecord.description) return;
    useAnimalStore.getState().addMedicalRecord(animal.id, {
      id: `med_${Date.now()}`,
      title: newMedicalRecord.title,
      description: newMedicalRecord.description,
      record_type: (newMedicalRecord.record_type as any) || 'checkup',
      record_date: new Date().toISOString(),
      veterinarian: newMedicalRecord.veterinarian,
      vet_reg_no: newMedicalRecord.vet_reg_no,
      // Defaults to a feeder's report; verified sources have to be chosen.
      source: newMedicalRecord.source ?? 'feeder_report',
      next_due: newMedicalRecord.next_due,
    });
    setNewMedicalRecord({});
    setShowMedicalForm(false);
  };

  const avatarSrc = profileImage ? optimizeImageUrl(profileImage, { width: 600 }) : getFallbackAvatar(animal);
  const lastSeenBy = getDisplayActorName(animal.last_seen_by, animal.contributor);
  const lastFedBy = getDisplayActorName(animal.last_fed_by, animal.contributor);
  const lastCaredBy = getDisplayActorName(animal.last_cared_by, animal.contributor);
  const lifecycleSuggestion = suggestedLifecycle(animal);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'gallery', label: 'Photos', icon: '📸' },
    { key: 'memories', label: 'Memories', icon: '💭' },
    // Without `as const` the spread widens key to string and stops matching TabKey.
    ...(isDeceased ? [] : ([
      { key: 'medical', label: 'Medical', icon: '🏥' },
      { key: 'care', label: 'Timeline', icon: '📖' },
    ] as const))
  ];

  const memoryEmojis: Record<string, string> = {
    happy: '😊', funny: '😂', touching: '💕', tribute: '🌹', goodbye: '👋'
  };

  const recordEmojis: Record<string, string> = {
    vaccination: '💉', checkup: '🔍', treatment: '⚕️', injury: '🤕', surgery: '🏥', deworming: '💊', prescription: '💊'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto" onClick={onClose}>
      <div
        className="relative bg-white dark:bg-card rounded-3xl max-w-lg w-full mx-4 my-8 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-30 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition active:scale-90">
          <X size={20} />
        </button>

        {/* Suggested, never automatic: six quiet weeks is usually the app not
            being opened, so a person confirms. Reversible the moment someone
            spots them. */}
        {lifecycleSuggestion && (
          <div className="mx-6 mt-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-2xl p-3 flex items-start gap-3">
            <span className="text-xl" aria-hidden="true">🧳</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug">{lifecycleSuggestion.reason}</p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => useAnimalStore.getState().updateAnimal(animal.id, { status: lifecycleSuggestion.to })}
                  className="text-xs font-bold bg-foreground text-background rounded-full px-3 py-1.5 active:scale-95 transition"
                >
                  Mark on leave
                </button>
                <button
                  type="button"
                  onClick={() => useAnimalStore.getState().logCareAction(animal.id, 'seen')}
                  className="text-xs font-bold border border-border text-foreground rounded-full px-3 py-1.5 active:scale-95 transition"
                >
                  I saw them recently
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hero header */}
        <div className={`on-tint relative pt-8 pb-6 px-6 bg-gradient-to-br ${isDeceased ? 'from-purple-100 via-gray-100 to-purple-50' : 'from-pink-100 via-orange-50 to-yellow-50'}`}>
          {animal.external_ids?.pawfriend_uid && (
            <a
              href={`https://pawfriend.in/${encodeURIComponent(animal.external_ids.pawfriend_uid)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-14 text-[10px] font-bold bg-white/90 dark:bg-card text-foreground rounded-full px-3 py-1 shadow-md hover:underline"
              title="This animal's QR-collar record in the campus/BMC programme"
            >
              🏷️ Collar record ↗
            </a>
          )}

          {/* Lifecycle chip — on campus / on leave / graduated / passed away. */}
          <div className={`absolute top-4 left-4 text-xs px-4 py-1 font-bold rounded-full shadow-md ${
            isDeceased ? 'bg-purple-600/80 text-white' : 'bg-white/90 dark:bg-card text-foreground'
          }`}>
            <span aria-hidden="true">{LIFECYCLE[animal.status]?.emoji}</span> {LIFECYCLE[animal.status]?.label ?? animal.status}
          </div>

          {/* Profile image */}
          <div className="relative w-28 h-28 mx-auto mb-4 group">
            <img
              src={avatarSrc}
              alt={animal.name}
              className={`w-28 h-28 rounded-full border-4 ${isDeceased ? 'border-purple-300' : 'border-white'} shadow-xl object-cover`}
            />
            {!isDeceased && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              >
                <Camera size={24} className="text-white drop-shadow-lg" />
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleProfileImageUpload} className="hidden" />
          </div>
          {photoAdvice.length > 0 && (
            <ul className="mt-2 text-xs text-amber-800 dark:text-amber-300 space-y-0.5 text-center" role="status">
              {photoAdvice.map((a) => <li key={a}>📷 {a}</li>)}
            </ul>
          )}

          <h2 className="text-3xl font-bold text-foreground text-center">{animal.name}</h2>
          {isDeceased && animal.death_date && (
            <p className="text-center text-sm text-purple-600 font-medium mt-1">
              ✨ {new Date(animal.death_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {animal.personality_tags.map((tag, i) => (
              <span key={i} className="bg-white/80 dark:bg-card px-3 py-1 rounded-full text-xs font-bold text-foreground shadow-sm">{tag}</span>
            ))}
          </div>

          {/* Location with map */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <MapPin size={14} className="text-primary" />
            <span className="font-semibold text-sm text-foreground">{animal.location}</span>
            {animal.location_coords && (
              <a
                href={`https://www.google.com/maps?q=${animal.location_coords.lat},${animal.location_coords.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold hover:bg-blue-200 transition flex items-center gap-1"
              >
                <ExternalLink size={10} /> View on Map
              </a>
            )}
          </div>

          {/* Last seen / fed */}
          {!isDeceased && (
            <div className="flex justify-center gap-4 mt-4">
              <div className="bg-white/70 dark:bg-card px-4 py-2 rounded-xl text-center">
                <p className="text-sm">👀</p>
                <p className="text-[10px] font-bold text-foreground">Last seen</p>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {formatTimeSince(new Date(animal.last_seen))}
                  <span className="block text-[9px]">by {lastSeenBy}</span>
                </p>
              </div>
              <div className="bg-white/70 dark:bg-card px-4 py-2 rounded-xl text-center">
                <p className="text-sm">🍲</p>
                <p className="text-[10px] font-bold text-foreground">Last fed</p>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {formatTimeSince(new Date(animal.last_fed))}
                  <span className="block text-[9px]">by {lastFedBy}</span>
                </p>
              </div>
              {/* A bare "50%" says nothing to a reader. TrustBadge turns the
                  same number into a named level with an explanation. */}
              <div className="bg-white/70 dark:bg-card px-4 py-2 rounded-xl text-center flex items-center justify-center">
                <TrustBadge score={animal.trust_score} />
              </div>
            </div>
          )}

          {/* Recent Care Info */}
          {!isDeceased && animal.last_cared_at && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-2 mt-4 text-center max-w-xs mx-auto">
              <p className="text-xs font-bold text-green-700">
                {animal.last_cared_type === 'sheltered' ? '🏠 Gave Shelter' : '💊 Gave Care'}
              </p>
              <p className="text-[10px] text-green-600" suppressHydrationWarning>
                {formatTimeSince(new Date(animal.last_cared_at))} by {lastCaredBy}
              </p>
            </div>
          )}

          {/* Like / Comment Stats */}
          <div className="flex justify-center gap-6 mt-4">
            <button onClick={handleLike} className="flex items-center gap-1.5 active:scale-90 transition">
              <Heart size={18} className={liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'} />
              <span className="text-sm font-bold text-foreground">{animal.likes}</span>
            </button>
            <div className="flex items-center gap-1.5">
              <MessageCircle size={18} className="text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">{animal.comments.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookHeart size={18} className="text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">{animal.memories.length}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-border">
          <p className="text-sm text-foreground leading-relaxed">{animal.description}</p>
          {isDeceased && animal.death_note && (
            <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl p-3">
              <p className="text-sm text-purple-800 italic leading-relaxed">🕊️ {animal.death_note}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">Added by {animal.contributor} • {new Date(animal.created_at).toLocaleDateString('en-IN')}</p>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-gray-100 dark:border-border">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-center text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-gray-50 dark:bg-muted/40'
              }`}
            >
              <span className="text-sm block mb-0.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-4 max-h-[50vh] overflow-y-auto">
          {/* GALLERY TAB */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="on-tint w-full bg-gradient-to-r from-pink-50 to-orange-50 hover:from-pink-100 hover:to-orange-100 active:scale-[0.98] border-2 border-dashed border-pink-300 rounded-2xl py-6 text-foreground font-bold flex flex-col items-center gap-2 transition"
              >
                <Camera size={28} className="text-pink-400" />
                <span>Upload Photo (Camera / Gallery)</span>
                <span className="text-xs text-muted-foreground">Only self-clicked photos allowed 📸</span>
              </button>
              <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />

              {storedImages.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {storedImages.map(img => (
                    <div key={img.id} className="rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-border">
                      <img src={optimizeImageUrl(img.url, { width: 400 })} alt={img.caption} className="w-full h-32 object-cover" />
                      <div className="p-2 bg-white dark:bg-card">
                        <p className="text-xs font-bold text-foreground truncate">{img.caption}</p>
                        <p className="text-[10px] text-muted-foreground" suppressHydrationWarning>{formatTimeSince(new Date(img.uploadedAt))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {storedImages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">📷</p>
                  <p className="text-sm text-muted-foreground">No photos yet. Be the first to add one!</p>
                </div>
              )}
            </div>
          )}

          {/* MEMORIES TAB */}
          {activeTab === 'memories' && (
            <div className="space-y-3">
              <button
                onClick={() => {
                  // Open on the right set of questions: a memorial should not
                  // lead with "what do they do when they see you coming?".
                  if (!showMemoryForm) {
                    setMemoryForm(f => ({ ...f, memory_type: defaultMemoryKind(isDeceased) }));
                    setMemoryPrompt(null);
                  }
                  setShowMemoryForm(!showMemoryForm);
                }}
                className="w-full flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-3 rounded-xl active:scale-[0.98] transition border border-purple-200"
              >
                <Plus size={18} />
                Share Your Memory
              </button>

              {showMemoryForm && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                  <select
                    value={memoryForm.memory_type}
                    onChange={e => {
                      setMemoryForm(f => ({ ...f, memory_type: e.target.value as any }));
                      setMemoryPrompt(null);
                    }}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                  >
                    <option value="happy">😊 Happy Moment</option>
                    <option value="funny">😂 Funny Moment</option>
                    <option value="touching">💕 Touching Story</option>
                    <option value="tribute">🌹 Tribute</option>
                    <option value="goodbye">👋 Last Goodbye</option>
                  </select>
                  {/* A blank box asks someone to be a writer. A question asks
                      them to be a witness, which is a much smaller thing. */}
                  <div>
                    <p className="text-xs font-bold text-purple-900 dark:text-foreground mb-1.5">
                      Not sure where to start?
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {getMemoryPrompts(memoryForm.memory_type as MemoryKind, animal.id).map(prompt => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => setMemoryPrompt(prompt)}
                          aria-pressed={memoryPrompt === prompt}
                          className={`text-xs rounded-full px-3 py-1.5 border transition text-left ${
                            memoryPrompt === prompt
                              ? 'bg-purple-500 text-white border-purple-500'
                              : 'bg-white dark:bg-card text-foreground border-purple-200 dark:border-border hover:border-purple-400'
                          }`}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={memoryForm.text}
                    onChange={e => setMemoryForm(f => ({ ...f, text: e.target.value }))}
                    placeholder={memoryPrompt ?? 'Share your experience, your memory of this animal...'}
                    aria-label={memoryPrompt ?? 'Your memory'}
                    rows={4}
                    className="w-full px-3 py-2 border border-purple-200 dark:border-border rounded-lg text-sm focus:outline-none focus:border-purple-400 resize-none bg-white dark:bg-card text-foreground"
                  />
                  {/* Typing a memory one-handed outdoors is the main thing between
                      a student and a contribution. Dictation appends to whatever
                      is already typed. */}
                  <DictateButton
                    onAppend={(text) =>
                      setMemoryForm((f) => ({
                        ...f,
                        text: f.text ? `${f.text.trimEnd()} ${text}` : text,
                      }))
                    }
                  />
                  <div className="flex items-center gap-2">
                    <input ref={memoryPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleMemoryPhoto} />
                    <button
                      type="button"
                      onClick={() => memoryPhotoRef.current?.click()}
                      disabled={memoryPhotoBusy}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 rounded-full px-3 py-1.5 hover:bg-purple-50 dark:hover:bg-purple-950/40 active:scale-95 transition disabled:opacity-60"
                    >
                      <Camera size={14} />
                      {memoryPhotoBusy ? 'Uploading…' : memoryPhoto ? 'Change photo' : 'Add a photo'}
                    </button>
                    {memoryPhoto && (
                      <>
                        <img src={memoryPhoto} alt="" className="w-10 h-10 rounded-lg object-cover border border-purple-200" />
                        <button type="button" onClick={() => setMemoryPhoto(null)} className="text-xs text-muted-foreground hover:text-foreground">
                          remove
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowMemoryForm(false)} className="flex-1 border border-purple-300 text-purple-700 font-bold py-2 rounded-lg hover:bg-purple-50 active:scale-95 transition text-sm">Cancel</button>
                    <button onClick={handleShareMemory} disabled={!memoryForm.text.trim()} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 rounded-lg active:scale-95 transition text-sm disabled:opacity-50">Share</button>
                  </div>
                </div>
              )}

              {tenureLine(animal) && (
                <p className="text-xs text-muted-foreground text-center italic">{tenureLine(animal)}</p>
              )}

              {animal.memories.length > 0 && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter memories">
                    {(['all', 'happy', 'funny', 'touching', 'tribute', 'goodbye'] as const).map((k) => {
                      const n = k === 'all' ? animal.memories.length : animal.memories.filter((m) => m.memory_type === k).length;
                      if (k !== 'all' && n === 0) return null;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setMemoryFilter(k)}
                          aria-pressed={memoryFilter === k}
                          className={`text-xs rounded-full px-2.5 py-1 border transition ${
                            memoryFilter === k
                              ? 'bg-purple-500 text-white border-purple-500'
                              : 'bg-white dark:bg-card text-foreground border-purple-200 dark:border-border'
                          }`}
                        >
                          {k === 'all' ? 'All' : memoryEmojis[k]} {n}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setMemoryView((v) => (v === 'list' ? 'story' : 'list'))}
                    className="text-xs font-bold text-purple-700 dark:text-purple-300 hover:underline"
                  >
                    {memoryView === 'list' ? '📖 Life story' : '☰ List'}
                  </button>
                </div>
              )}

              {memoryView === 'story' && animal.memories.length > 0 ? (
                <LifeStory animal={animal} />
              ) : animal.memories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">💭</p>
                  <p className="text-sm text-muted-foreground">No memories shared yet. Be the first!</p>
                </div>
              ) : (
                animal.memories
                  .filter((m) => memoryFilter === 'all' || m.memory_type === memoryFilter)
                  .map(memory => (
                  <div key={memory.id} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-xl p-4 shadow-sm hover:shadow-md transition">
                    {memory.photo_url && (
                      <img src={optimizeImageUrl(memory.photo_url, { width: 600 })} alt="" className="w-full h-40 object-cover rounded-lg mb-3" />
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{memoryEmojis[memory.memory_type] || '💭'}</span>
                      <span className="font-bold text-sm text-foreground">{memory.author}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto" suppressHydrationWarning>{formatTimeSince(new Date(memory.timestamp))}</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{memory.text}</p>
                    <button onClick={() => handleLikeMemory(memory.id)} className="flex items-center gap-1 mt-2 text-muted-foreground hover:text-red-400 active:scale-95 transition">
                      <Heart size={12} />
                      <span className="text-xs">{memory.likes}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* MEDICAL TAB */}
          {activeTab === 'medical' && (
            <div className="space-y-3">
              <button
                onClick={() => setShowMedicalForm(!showMedicalForm)}
                className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3 rounded-xl active:scale-[0.98] transition border border-blue-200"
              >
                <Plus size={18} />
                Add Medical Record
              </button>

              {showMedicalForm && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                  <input
                    type="text"
                    value={newMedicalRecord.title || ''}
                    onChange={e => setNewMedicalRecord(f => ({ ...f, title: e.target.value }))}
                    placeholder="Title (e.g. Annual Vaccination)"
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  />
                  <select
                    value={newMedicalRecord.record_type || 'checkup'}
                    onChange={e => setNewMedicalRecord(f => ({ ...f, record_type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  >
                    <option value="checkup">🔍 Checkup</option>
                    <option value="vaccination">💉 Vaccination</option>
                    <option value="deworming">💊 Deworming</option>
                    <option value="treatment">⚕️ Treatment</option>
                    <option value="surgery">🏥 Surgery</option>
                  </select>
                  <textarea
                    value={newMedicalRecord.description || ''}
                    onChange={e => setNewMedicalRecord(f => ({ ...f, description: e.target.value }))}
                    placeholder="Description of the record..."
                    rows={3}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 resize-none"
                  />
                  <input
                    type="text"
                    value={newMedicalRecord.veterinarian || ''}
                    onChange={e => setNewMedicalRecord(f => ({ ...f, veterinarian: e.target.value }))}
                    placeholder="Veterinarian Name (Optional)"
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  />
                  <input
                    value={newMedicalRecord.vet_reg_no ?? ''}
                    onChange={e => setNewMedicalRecord(f => ({ ...f, vet_reg_no: e.target.value }))}
                    placeholder="Vet registration no. (optional, for the register)"
                    className="w-full px-3 py-2 border border-blue-200 dark:border-border rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white dark:bg-card text-foreground"
                  />
                  {/* Where a record comes from decides whether it counts toward the
                      coverage figures. A feeder's word is kept and shown; only a
                      PHO record or an AWO certificate is a number an officer can
                      put in an affidavit. */}
                  <select
                    value={newMedicalRecord.source ?? 'feeder_report'}
                    onChange={e => setNewMedicalRecord(f => ({ ...f, source: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-blue-200 dark:border-border rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white dark:bg-card text-foreground"
                  >
                    <option value="feeder_report">I saw it / was told (unverified)</option>
                    <option value="awo_certificate">From an NGO or vet certificate</option>
                    <option value="pho_record">From the campus health office record</option>
                    <option value="unknown">Not sure</option>
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => setShowMedicalForm(false)} className="flex-1 border border-blue-300 text-blue-700 font-bold py-2 rounded-lg hover:bg-blue-50 active:scale-95 transition text-sm">Cancel</button>
                    <button onClick={handleSaveMedicalRecord} disabled={!newMedicalRecord.title || !newMedicalRecord.description} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg active:scale-95 transition text-sm disabled:opacity-50">Save Record</button>
                  </div>
                </div>
              )}

              {animal.medical_records.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">🏥</p>
                  <p className="text-sm text-muted-foreground">No medical records yet.</p>
                </div>
              ) : (
                animal.medical_records.map(record => (
                  <div key={record.id} className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-xl p-4 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{recordEmojis[record.record_type] || '📋'}</span>
                      <span className="font-bold text-sm text-foreground">{record.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{new Date(record.record_date).toLocaleDateString('en-IN')} {record.veterinarian && `• ${record.veterinarian}`}</p>
                    {record.source && record.source !== 'unknown' && (
                      <span className={`inline-block text-[10px] font-bold rounded-full px-2 py-0.5 mb-1 ${
                        record.source === 'feeder_report'
                          ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200'
                          : 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200'
                      }`}>
                        {record.source === 'feeder_report' ? 'reported, unverified' : 'verified record'}
                      </span>
                    )}
                    <p className="text-sm text-foreground">{record.description}</p>
                    {record.next_due && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-orange-600 font-bold">
                        <Calendar size={12} />
                        Next due: {new Date(record.next_due).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* CARE TIMELINE TAB */}
          {activeTab === 'care' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Care events are logged when students record feeding, sightings, and medical care.
              </p>
              <WhereTheyveBeen animal={animal} showLog />
              <ObservationForm animalId={animal.id} current={animal.observation} />
              <CareTracker animalId={animal.id} />
            </div>
          )}
        </div>

        {/* Comment Box — always visible at bottom */}
        <div className="border-t border-gray-100 p-4 bg-gray-50/50 dark:bg-muted/40">
          <h4 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Comments ({animal.comments.length})</h4>
          {animal.comments.length > 0 && (
            <div className="max-h-32 overflow-y-auto space-y-2 mb-3 pr-1">
              {animal.comments.map(c => (
                <div key={c.id} className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-foreground">{c.author}</span>
                  <span className="text-xs text-foreground flex-1">{c.text}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap" suppressHydrationWarning>{formatTimeSince(new Date(c.timestamp))}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 rounded-full bg-white dark:bg-card text-foreground text-sm border border-gray-200 dark:border-border focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              onKeyDown={e => e.key === 'Enter' && handleComment()}
            />
            <button
              onClick={handleComment}
              disabled={!newComment.trim()}
              className="bg-primary text-primary-foreground p-2.5 rounded-full disabled:opacity-50 active:scale-90 transition"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
