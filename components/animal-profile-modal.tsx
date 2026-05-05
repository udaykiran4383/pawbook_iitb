'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Heart, MapPin, Camera, Image as ImageIcon, MessageCircle, Clock, Pill, BookHeart, ChevronDown, ChevronUp, Plus, Send, Calendar, Trash2, ExternalLink } from 'lucide-react';
import { formatTimeSince } from '@/lib/care-tracking';
import { getDisplayActorName, getUserName } from '@/lib/utils';
import { useImageStore } from '@/lib/image-store';
import type { Animal, Comment, StudentMemory, MedicalRecord } from '@/lib/demo-data';
import { useAnimalStore } from '@/lib/animal-store';
import { uploadImageToCloudinary } from '@/lib/upload-image';

const EMPTY_IMAGES: any[] = [];

function getDefaultAvatar(animal: Animal) {
  const seed = encodeURIComponent(animal.name);
  const bg = animal.animal_type === 'cat' ? 'c0aede' : animal.animal_type === 'dog' ? 'ffdfbf' : 'b6e3f4';
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=${bg}`;
}

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
  const [showMedicalForm, setShowMedicalForm] = useState(false);
  const [newMedicalRecord, setNewMedicalRecord] = useState<Partial<MedicalRecord>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const addImage = useImageStore(state => state.addImage);
  const storedImages = useImageStore(state => state.images[animal.id] || EMPTY_IMAGES);

  const isDeceased = animal.status === 'deceased';

  const handleProfileImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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

  const handleShareMemory = () => {
    if (!memoryForm.text.trim()) return;
    useAnimalStore.getState().addMemory(animal.id, {
      id: `m_${Date.now()}`,
      author: getUserName(),
      text: memoryForm.text,
      timestamp: new Date().toISOString(),
      likes: 0,
      memory_type: memoryForm.memory_type,
    });
    setMemoryForm({ text: '', memory_type: 'happy' });
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

  const handleCareAction = (type: 'seen' | 'fed' | 'treated' | 'sheltered') => {
    useAnimalStore.getState().logCareAction(animal.id, type);
    alert(`Thank you for caring for ${animal.name}! 🐾`);
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
      next_due: newMedicalRecord.next_due,
    });
    setNewMedicalRecord({});
    setShowMedicalForm(false);
  };

  const avatarSrc = profileImage || getDefaultAvatar(animal);
  const lastSeenBy = getDisplayActorName(animal.last_seen_by, animal.contributor);
  const lastFedBy = getDisplayActorName(animal.last_fed_by, animal.contributor);
  const lastCaredBy = getDisplayActorName(animal.last_cared_by, animal.contributor);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'gallery', label: 'Photos', icon: '📸' },
    { key: 'memories', label: 'Memories', icon: '💭' },
    ...(isDeceased ? [] : [
      { key: 'medical', label: 'Medical', icon: '🏥' },
      { key: 'care', label: 'Timeline', icon: '📖' },
    ])
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
        className="relative bg-white rounded-3xl max-w-lg w-full mx-4 my-8 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-30 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition active:scale-90">
          <X size={20} />
        </button>

        {/* Hero header */}
        <div className={`relative pt-8 pb-6 px-6 bg-gradient-to-br ${isDeceased ? 'from-purple-100 via-gray-100 to-purple-50' : 'from-pink-100 via-orange-50 to-yellow-50'}`}>
          {isDeceased && (
            <div className="absolute top-4 left-4 bg-purple-600/80 text-white text-xs px-4 py-1 font-bold rounded-full shadow-md">
              🌈 Rainbow Bridge
            </div>
          )}

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

          <h2 className="text-3xl font-bold text-foreground text-center">{animal.name}</h2>
          {isDeceased && animal.death_date && (
            <p className="text-center text-sm text-purple-600 font-medium mt-1">
              ✨ {new Date(animal.death_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {animal.personality_tags.map((tag, i) => (
              <span key={i} className="bg-white/80 px-3 py-1 rounded-full text-xs font-bold text-foreground shadow-sm">{tag}</span>
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
              <div className="bg-white/70 px-4 py-2 rounded-xl text-center">
                <p className="text-sm">👀</p>
                <p className="text-[10px] font-bold text-foreground">Last seen</p>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {formatTimeSince(new Date(animal.last_seen))}
                  <span className="block text-[9px]">by {lastSeenBy}</span>
                </p>
              </div>
              <div className="bg-white/70 px-4 py-2 rounded-xl text-center">
                <p className="text-sm">🍲</p>
                <p className="text-[10px] font-bold text-foreground">Last fed</p>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {formatTimeSince(new Date(animal.last_fed))}
                  <span className="block text-[9px]">by {lastFedBy}</span>
                </p>
              </div>
              <div className="bg-white/70 px-4 py-2 rounded-xl text-center">
                <p className="text-sm">💛</p>
                <p className="text-[10px] font-bold text-foreground">Trust</p>
                <p className="text-xs text-muted-foreground">{animal.trust_score}%</p>
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
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm text-foreground leading-relaxed">{animal.description}</p>
          {isDeceased && animal.death_note && (
            <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl p-3">
              <p className="text-sm text-purple-800 italic leading-relaxed">🕊️ {animal.death_note}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">Added by {animal.contributor} • {new Date(animal.created_at).toLocaleDateString('en-IN')}</p>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-gray-100">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-center text-xs font-bold transition-all ${
                activeTab === tab.key
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-gray-50'
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
                className="w-full bg-gradient-to-r from-pink-50 to-orange-50 hover:from-pink-100 hover:to-orange-100 active:scale-[0.98] border-2 border-dashed border-pink-300 rounded-2xl py-6 text-foreground font-bold flex flex-col items-center gap-2 transition"
              >
                <Camera size={28} className="text-pink-400" />
                <span>Upload Photo (Camera / Gallery)</span>
                <span className="text-xs text-muted-foreground">Only self-clicked photos allowed 📸</span>
              </button>
              <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleGalleryUpload} className="hidden" />

              {storedImages.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {storedImages.map(img => (
                    <div key={img.id} className="rounded-xl overflow-hidden shadow-md border border-gray-100">
                      <img src={img.url} alt={img.caption} className="w-full h-32 object-cover" />
                      <div className="p-2 bg-white">
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
                onClick={() => setShowMemoryForm(!showMemoryForm)}
                className="w-full flex items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-3 rounded-xl active:scale-[0.98] transition border border-purple-200"
              >
                <Plus size={18} />
                Share Your Memory
              </button>

              {showMemoryForm && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                  <select
                    value={memoryForm.memory_type}
                    onChange={e => setMemoryForm(f => ({ ...f, memory_type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                  >
                    <option value="happy">😊 Happy Moment</option>
                    <option value="funny">😂 Funny Moment</option>
                    <option value="touching">💕 Touching Story</option>
                    <option value="tribute">🌹 Tribute</option>
                    <option value="goodbye">👋 Last Goodbye</option>
                  </select>
                  <textarea
                    value={memoryForm.text}
                    onChange={e => setMemoryForm(f => ({ ...f, text: e.target.value }))}
                    placeholder="Share your experience, your memory of this animal..."
                    rows={4}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:border-purple-400 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowMemoryForm(false)} className="flex-1 border border-purple-300 text-purple-700 font-bold py-2 rounded-lg hover:bg-purple-50 active:scale-95 transition text-sm">Cancel</button>
                    <button onClick={handleShareMemory} disabled={!memoryForm.text.trim()} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 rounded-lg active:scale-95 transition text-sm disabled:opacity-50">Share</button>
                  </div>
                </div>
              )}

              {animal.memories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">💭</p>
                  <p className="text-sm text-muted-foreground">No memories shared yet. Be the first!</p>
                </div>
              ) : (
                animal.memories.map(memory => (
                  <div key={memory.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition">
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
                  <div key={record.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{recordEmojis[record.record_type] || '📋'}</span>
                      <span className="font-bold text-sm text-foreground">{record.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{new Date(record.record_date).toLocaleDateString('en-IN')} {record.veterinarian && `• ${record.veterinarian}`}</p>
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
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Care events are logged when students record feeding, sightings, and medical care.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['seen', 'fed', 'treated', 'sheltered'] as const).map(type => {
                  const emojis: Record<string, string> = { seen: '👀', fed: '🍲', treated: '💊', sheltered: '🏠' };
                  const labels: Record<string, string> = { seen: 'I Saw Them', fed: 'I Fed Them', treated: 'Gave Care', sheltered: 'Gave Shelter' };
                  return (
                    <button
                      key={type}
                      onClick={() => handleCareAction(type)}
                      className="py-3 px-3 text-sm font-bold bg-white hover:bg-gray-50 active:scale-95 border border-gray-200 text-foreground rounded-xl transition flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                    >
                      <span className="text-xl">{emojis[type]}</span>
                      <span className="text-xs">{labels[type]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Comment Box — always visible at bottom */}
        <div className="border-t border-gray-100 p-4 bg-gray-50/50">
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
              className="flex-1 px-3 py-2 rounded-full bg-white text-foreground text-sm border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
