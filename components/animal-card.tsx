'use client';

import { useState, useRef, useCallback } from 'react';
import { Heart, MapPin, MessageCircle, Share2, Clock, Camera, Image as ImageIcon, ChevronDown, ChevronUp, Pill, Send, BookHeart, Eye } from 'lucide-react';
import { formatTimeSince } from '@/lib/care-tracking';
import { getDisplayActorName, getUserName } from '@/lib/utils';
import type { Animal, Comment } from '@/lib/demo-data';
import { useAnimalStore } from '@/lib/animal-store';
import { uploadImageToCloudinary } from '@/lib/upload-image';

// Default avatar based on animal type
function getDefaultAvatar(animal: Animal) {
  const seed = encodeURIComponent(animal.name);
  const bg = animal.animal_type === 'cat' ? 'c0aede' : animal.animal_type === 'dog' ? 'ffdfbf' : 'b6e3f4';
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=${bg}`;
}

const bgGradients = [
  'from-pink-100 to-purple-100',
  'from-yellow-100 to-orange-100',
  'from-green-100 to-teal-100',
  'from-purple-100 to-pink-100',
  'from-blue-100 to-indigo-100',
];

interface AnimalCardProps {
  animal: Animal;
  onOpenProfile: (animal: Animal) => void;
}

export default function AnimalCard({ animal, onOpenProfile }: AnimalCardProps) {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [sharing, setSharing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(animal.profile_image);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDeceased = animal.status === 'deceased';
  const bgGradient = isDeceased
    ? 'from-gray-100 to-purple-50'
    : bgGradients[animal.id % bgGradients.length];

  const now = Date.now();
  const isSeenUrgent = !isDeceased && now - new Date(animal.last_seen).getTime() > 12 * 60 * 60 * 1000;
  const isFedUrgent = !isDeceased && now - new Date(animal.last_fed).getTime() > 12 * 60 * 60 * 1000;

  const handleLike = () => {
    if (!liked) {
      useAnimalStore.getState().likeAnimal(animal.id);
      setLiked(true);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${animal.name} - PawBook IITB`,
          text: `Meet ${animal.name} at ${animal.location}! 🐾 ${animal.description}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(`Meet ${animal.name} at ${animal.location}! 🐾`);
        alert('Link copied! Share it with your friends 🐾');
      }
    } catch { }
    setSharing(false);
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    const newComment: Comment = {
      id: `c_${Date.now()}`,
      author: getUserName(),
      text: comment,
      timestamp: new Date().toISOString(),
      likes: 0,
    };
    useAnimalStore.getState().addComment(animal.id, newComment);
    setComment('');
  };

  const handleProfileImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const uploadedUrl = await uploadImageToCloudinary(file, 'pawbook/profiles');
      useAnimalStore.getState().updateAnimal(animal.id, { profile_image: uploadedUrl });
      setProfileImage(uploadedUrl);
    } catch (err) {
      console.error('Failed to upload image:', err);
    }
  }, [animal.id]);

  const avatarSrc = profileImage || getDefaultAvatar(animal);
  const lastSeenBy = getDisplayActorName(animal.last_seen_by, animal.contributor);
  const lastFedBy = getDisplayActorName(animal.last_fed_by, animal.contributor);
  const lastCaredBy = getDisplayActorName(animal.last_cared_by, animal.contributor);

  return (
    <div className={`scrapbook-card bg-gradient-to-br ${bgGradient} p-5 relative overflow-hidden border-2 ${isDeceased ? 'border-purple-200/60' : 'border-white/50'} shadow-lg hover:shadow-xl transition-all duration-300`}>
      {/* Deceased ribbon */}
      {isDeceased && (
        <div className="absolute top-4 right-0 bg-purple-600/80 text-white text-xs px-4 py-1 font-bold rounded-l-full shadow-md z-20">
          🌈 Rainbow Bridge
        </div>
      )}

      {/* Profile image area */}
      <div className="mb-4 relative">
        <div className="relative w-32 h-32 mx-auto group">
          <div className={`absolute inset-0 rounded-full blur-md opacity-30 ${isDeceased ? 'bg-purple-300' : 'bg-white'}`}></div>
          <img
            src={avatarSrc}
            alt={animal.name}
            className={`w-32 h-32 rounded-full border-4 ${isDeceased ? 'border-purple-300 grayscale-[30%]' : 'border-white'} shadow-lg object-cover relative z-10`}
          />
          {/* Upload button overlay */}
          {!isDeceased && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 z-20 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
              title="Upload profile picture"
            >
              <Camera size={24} className="text-white drop-shadow-lg" />
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleProfileImageUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Name + Status */}
      <h3 className="text-3xl font-bold text-foreground text-center mb-1">{animal.name}</h3>
      {isDeceased && animal.death_date && (
        <p className="text-center text-sm text-purple-600 font-medium mb-2">
          ✨ Forever in our hearts • {new Date(animal.death_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
        </p>
      )}

      {/* Personality Tags */}
      <div className="flex flex-wrap justify-center gap-2 mb-3">
        {animal.personality_tags.map((tag, i) => (
          <span key={i} className="inline-block bg-white/80 px-3 py-1 rounded-full text-xs font-bold text-foreground shadow-sm">
            {tag}
          </span>
        ))}
      </div>

      {/* Location */}
      <div className="flex items-center justify-center gap-2 text-foreground mb-3">
        <MapPin size={16} className="text-primary" />
        <span className="font-semibold text-sm">{animal.location}</span>
        {animal.location_coords && (
          <a
            href={`https://www.google.com/maps?q=${animal.location_coords.lat},${animal.location_coords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold hover:bg-blue-200 transition"
          >
            📍 Map
          </a>
        )}
      </div>

      {/* Last Seen & Last Fed — for active animals */}
      {!isDeceased && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className={`bg-white/70 p-2.5 rounded-xl text-center border-2 ${isSeenUrgent ? 'border-red-400 bg-red-50' : 'border-transparent'}`}>
            <p className="text-lg">👀</p>
            <p className="text-xs font-bold text-foreground">Last seen</p>
            <p className={`text-xs font-semibold ${isSeenUrgent ? 'text-red-600' : 'text-muted-foreground'}`} suppressHydrationWarning>
              {formatTimeSince(new Date(animal.last_seen))} by {lastSeenBy}
            </p>
          </div>
          <div className={`bg-white/70 p-2.5 rounded-xl text-center border-2 ${isFedUrgent ? 'border-red-400 bg-red-50' : 'border-transparent'}`}>
            <p className="text-lg">🍲</p>
            <p className="text-xs font-bold text-foreground">Last fed</p>
            <p className={`text-xs font-semibold ${isFedUrgent ? 'text-red-600' : 'text-muted-foreground'}`} suppressHydrationWarning>
              {formatTimeSince(new Date(animal.last_fed))} by {lastFedBy}
            </p>
          </div>
        </div>
      )}

      {/* Recent Care Info */}
      {!isDeceased && animal.last_cared_at && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-2 mb-4 text-center">
          <p className="text-xs font-bold text-green-700">
            {animal.last_cared_type === 'sheltered' ? '🏠 Gave Shelter' : '💊 Gave Care'}
          </p>
          <p className="text-[10px] text-green-600" suppressHydrationWarning>
            {formatTimeSince(new Date(animal.last_cared_at))} by {lastCaredBy}
          </p>
        </div>
      )}

      {/* Description */}
      <p className="text-foreground text-sm mb-4 text-center font-medium leading-relaxed line-clamp-3">
        "{animal.description}"
      </p>

      {/* Death note for deceased */}
      {isDeceased && animal.death_note && (
        <div className="bg-purple-50/80 border border-purple-200 rounded-xl p-3 mb-4">
          <p className="text-sm text-purple-800 italic text-center leading-relaxed">🕊️ {animal.death_note}</p>
        </div>
      )}

      {/* Social Actions */}
      <div className="flex justify-center gap-6 mb-3 py-3 border-t-2 border-b-2 border-white/30">
        <button onClick={handleLike} className="flex flex-col items-center gap-1 transition-all active:scale-90">
          <Heart
            size={22}
            className={`transition-colors ${liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-400'}`}
          />
          <span className="text-xs font-bold text-foreground">{animal.likes}</span>
        </button>

        <button onClick={() => setShowComments(!showComments)} className="flex flex-col items-center gap-1 transition-all active:scale-90 text-muted-foreground hover:text-blue-500">
          <MessageCircle size={22} />
          <span className="text-xs font-bold text-foreground">{animal.comments.length}</span>
        </button>

        <button onClick={handleShare} disabled={sharing} className="flex flex-col items-center gap-1 transition-all active:scale-90 text-muted-foreground hover:text-green-500 disabled:opacity-50">
          <Share2 size={22} />
          <span className="text-xs font-bold text-foreground">Share</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mb-3 space-y-2">
          {animal.comments.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {animal.comments.slice(0, 3).map(c => (
                <div key={c.id} className="bg-white/60 rounded-lg p-2.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-foreground">{c.author}</span>
                    <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>{formatTimeSince(new Date(c.timestamp))}</span>
                  </div>
                  <p className="text-sm text-foreground mt-0.5">{c.text}</p>
                  <button className="text-[10px] text-muted-foreground hover:text-red-400 mt-1 flex items-center gap-1">
                    <Heart size={10} /> {c.likes}
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Write a comment... 💬"
              className="flex-1 px-3 py-2 rounded-full bg-white text-foreground text-sm border border-white/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              onKeyDown={e => e.key === 'Enter' && handleComment()}
            />
            <button
              onClick={handleComment}
              disabled={!comment.trim()}
              className="bg-primary text-primary-foreground p-2 rounded-full disabled:opacity-50 active:scale-90 transition"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* View Full Profile Button */}
      <button
        onClick={() => onOpenProfile(animal)}
        className="w-full flex items-center justify-center gap-2 bg-white/60 hover:bg-white/80 active:scale-[0.98] py-2.5 rounded-xl font-bold text-sm text-foreground transition-all"
      >
        <Eye size={16} />
        View Full Profile
      </button>
    </div>
  );
}
