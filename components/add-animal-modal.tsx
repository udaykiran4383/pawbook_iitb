'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { X, Check, Camera, Image as ImageIcon, MapPin, AlertTriangle } from 'lucide-react';
import { detectDuplicates } from '@/lib/duplicate-detection';
import { getUserName } from '@/lib/utils';
import { uploadImageToCloudinary } from '@/lib/upload-image';
import type { Animal } from '@/lib/demo-data';

interface AddAnimalModalProps {
  animals: Animal[];
  onClose: () => void;
  onAnimalAdded: (animal: Animal) => void;
}

export default function AddAnimalModal({ animals, onClose, onAnimalAdded }: AddAnimalModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    animalType: '',
    description: '',
    status: 'active' as 'active' | 'deceased',
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const duplicates = useMemo(() => {
    if (!formData.name || !formData.location) return [];
    return detectDuplicates(animals as any, formData.name, formData.location, 0.65);
  }, [formData.name, formData.location, animals]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploadedUrl = await uploadImageToCloudinary(file, 'pawbook/profiles');
      setProfileImage(uploadedUrl);
    } catch (err) {
      console.error('Failed to upload image:', err);
      setError('Photo upload failed. Please try again.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location || !formData.animalType) return;

    setLoading(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      const newAnimal: Animal = {
        id: Math.floor(Math.random() * 10000),
        name: formData.name,
        location: formData.location,
        animal_type: formData.animalType,
        description: formData.description,
        profile_image: profileImage,
        status: formData.status,
        created_at: new Date().toISOString(),
        trust_score: 50,
        contributor: getUserName(),
        last_seen: new Date().toISOString(),
        last_fed: new Date().toISOString(),
        personality_tags: ['🐾 New friend'],
        likes: 0,
        comments: [],
        memories: [],
        medical_records: [],
        gallery: [],
      };

      onAnimalAdded(newAnimal);
    } catch (err: any) {
      setError(err.message || 'Failed to add animal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="scrapbook-card bg-gradient-to-br from-white via-orange-50/30 to-pink-50/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-accent/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-accent/30 sticky top-0 bg-gradient-to-r from-white to-orange-50/50 z-10">
          <h2 className="text-3xl font-bold text-foreground">Add a Memory 🐾</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary hover:bg-accent/10 p-2 rounded-full transition active:scale-95">
            <X size={24} />
          </button>
        </div>

        <div className="bg-blue-50 border-b-2 border-blue-100 p-4">
          <p className="text-sm font-bold text-blue-800 mb-1">Check if your friend is already here! 🐾</p>
          <p className="text-xs text-blue-700 mb-2">Please avoid duplicate profiles by matching name and location with existing animals below.</p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {animals.map(a => (
              <div key={a.id} className="flex flex-col items-center flex-shrink-0 w-16">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-blue-200 overflow-hidden flex items-center justify-center text-xl shadow-sm">
                  {a.profile_image ? (
                    <img src={a.profile_image} alt={a.name} className="w-full h-full object-cover" />
                  ) : (
                    a.animal_type === 'cat' ? '🐱' : a.animal_type === 'dog' ? '🐕' : a.animal_type === 'leopard' ? '🐆' : a.animal_type === 'crocodile' ? '🐊' : '🐾'
                  )}
                </div>
                <span className="text-[10px] font-bold text-blue-900 mt-1 truncate w-full text-center">{a.name}</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-28 h-28 group">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-28 h-28 rounded-full border-4 border-primary/30 shadow-lg object-cover" />
              ) : (
                <div className="w-28 h-28 rounded-full border-4 border-dashed border-primary/30 bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center">
                  <Camera size={32} className="text-primary/50" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              >
                <Camera size={24} className="text-white drop-shadow-lg" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-full transition active:scale-95 border border-blue-200"
              >
                <Camera size={14} /> Take Photo
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-full transition active:scale-95 border border-purple-200"
              >
                <ImageIcon size={14} /> Choose Photo
              </button>
            </div>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <p className="text-xs text-muted-foreground">📸 Only self-clicked photos allowed</p>
          </div>

          {/* Duplicate warning */}
          {duplicates.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
              <div className="flex gap-3">
                <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-amber-900">👀 Similar friend found!</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    {duplicates.map(d => `${d.name} at ${d.location}`).join(', ')} — {Math.round(duplicates[0].similarity * 100)}% match
                  </p>
                  <p className="text-xs text-amber-700 mt-1">If this is the same animal, please update that profile instead of creating a new one.</p>
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-base font-bold text-foreground mb-2">Is this friend still with us? 🌈</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'active' })}
                className={`flex-1 py-2.5 rounded-full font-bold text-sm transition border-2 active:scale-95 ${
                  formData.status === 'active'
                    ? 'bg-green-100 border-green-400 text-green-800'
                    : 'bg-white border-gray-200 text-muted-foreground hover:border-green-300'
                }`}
              >
                🐾 Active & Around
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: 'deceased' })}
                className={`flex-1 py-2.5 rounded-full font-bold text-sm transition border-2 active:scale-95 ${
                  formData.status === 'deceased'
                    ? 'bg-purple-100 border-purple-400 text-purple-800'
                    : 'bg-white border-gray-200 text-muted-foreground hover:border-purple-300'
                }`}
              >
                🌈 Rainbow Bridge
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-base font-bold text-foreground mb-2">What&apos;s their name? 🏷️</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Brownie, Whiskers..."
              className="w-full px-4 py-3 border-2 border-accent rounded-full focus:border-primary focus:outline-none bg-white text-foreground placeholder-muted-foreground transition"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-base font-bold text-foreground mb-2">Where do you usually find them? 📍</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., H21, Library, Main Gate..."
              className="w-full px-4 py-3 border-2 border-accent rounded-full focus:border-primary focus:outline-none bg-white text-foreground placeholder-muted-foreground transition"
              required
            />
          </div>

          {/* Animal Type */}
          <div>
            <label className="block text-base font-bold text-foreground mb-2">What kind of friend? 🐾</label>
            <select
              value={formData.animalType}
              onChange={e => setFormData({ ...formData, animalType: e.target.value })}
              className="w-full px-4 py-3 border-2 border-accent rounded-full focus:border-primary focus:outline-none bg-white text-foreground transition"
              required
            >
              <option value="">Choose...</option>
              <option value="dog">🐕 Dog</option>
              <option value="cat">🐱 Cat</option>
              <option value="bird">🐦 Bird</option>
              <option value="monkey">🐒 Monkey</option>
              <option value="cow">🐄 Cow</option>
              <option value="leopard">🐆 Leopard</option>
              <option value="crocodile">🐊 Crocodile</option>
              <option value="other">🦊 Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-base font-bold text-foreground mb-2">Tell us about them... 💭</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Their personality, quirks, favourite spots, what makes them special..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-accent rounded-2xl focus:border-primary focus:outline-none bg-white text-foreground placeholder-muted-foreground transition resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 border-2 border-destructive rounded-2xl p-4 text-destructive-foreground">
              ⚠️ {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-accent text-foreground rounded-full hover:bg-accent/10 active:scale-95 transition font-bold text-lg"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.location || !formData.animalType}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-secondary hover:shadow-lg disabled:opacity-50 active:scale-95 text-primary-foreground rounded-full transition font-bold text-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="dog-walking">🐕</span> Saving...</>
              ) : (
                <><Check size={20} /> Create Profile</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
