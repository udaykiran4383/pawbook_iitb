'use client';

import { useState } from 'react';
import { Heart, BookHeart, ChevronDown, ChevronUp } from 'lucide-react';
import { formatTimeSince } from '@/lib/care-tracking';
import type { Animal } from '@/lib/demo-data';

interface RainbowBridgeProps {
  animals: Animal[];
  onOpenProfile: (animal: Animal) => void;
}

export default function RainbowBridge({ animals, onOpenProfile }: RainbowBridgeProps) {
  const [expanded, setExpanded] = useState(true);

  if (animals.length === 0) return null;

  return (
    <section className="mb-12">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-6 group"
      >
        <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <span className="text-4xl">🌈</span>
          Rainbow Bridge
        </h2>
        {expanded ? <ChevronUp size={24} className="text-muted-foreground" /> : <ChevronDown size={24} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <>
          <p className="text-muted-foreground mb-6 text-center max-w-2xl mx-auto italic">
            "Until one has loved an animal, a part of one's soul remains unawakened." — These beloved friends crossed the rainbow bridge, but they live forever in our memories.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {animals.map(animal => (
              <div
                key={animal.id}
                className="bg-gradient-to-br from-purple-50 via-pink-50 to-white rounded-3xl border-2 border-purple-200/40 p-6 shadow-md hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => onOpenProfile(animal)}
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <img
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(animal.name)}&backgroundColor=c0aede`}
                      alt={animal.name}
                      className="w-20 h-20 rounded-full border-3 border-purple-300 shadow-lg object-cover grayscale-[20%]"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">
                      🕊️
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-foreground">{animal.name}</h3>
                    {animal.death_date && (
                      <p className="text-sm text-purple-600 font-medium">
                        {new Date(animal.death_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Heart size={12} className="text-red-400" /> {animal.likes}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <BookHeart size={12} className="text-purple-400" /> {animal.memories.length} memories
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {animal.personality_tags.map((tag, i) => (
                    <span key={i} className="bg-white/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-foreground">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Death note */}
                {animal.death_note && (
                  <p className="text-sm text-purple-800/80 italic leading-relaxed mb-4 line-clamp-2">
                    🕊️ {animal.death_note}
                  </p>
                )}

                {/* Top memory preview */}
                {animal.memories.length > 0 && (
                  <div className="bg-white/60 rounded-xl p-3 border border-purple-100">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-foreground">{animal.memories[0].author}</span>
                      <span className="text-[10px] text-muted-foreground">{formatTimeSince(new Date(animal.memories[0].timestamp))}</span>
                    </div>
                    <p className="text-xs text-foreground line-clamp-2 leading-relaxed">{animal.memories[0].text}</p>
                    <div className="flex items-center gap-1 mt-1.5 text-muted-foreground">
                      <Heart size={10} className="text-red-400" />
                      <span className="text-[10px]">{animal.memories[0].likes}</span>
                    </div>
                  </div>
                )}

                {/* CTA */}
                <p className="text-xs text-purple-500 font-bold text-center mt-3 group-hover:text-purple-700 transition">
                  Tap to read memories & share yours →
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
