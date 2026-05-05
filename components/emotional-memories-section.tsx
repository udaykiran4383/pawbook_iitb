'use client';

import { useState } from 'react';
import { Heart, Plus, Calendar, X } from 'lucide-react';

interface EmotionalMemory {
  id: string;
  title: string;
  memory_text: string;
  memory_type: 'happy_moment' | 'funny_moment' | 'touching_story' | 'last_goodbye' | 'tribute' | 'other';
  memory_date?: string;
  photo_url?: string;
  shared_by_name?: string;
  shared_at: string;
}

interface EmotionalMemoriesSectionProps {
  animalId: string;
  animalName: string;
  animalStatus: 'deceased' | 'missing' | 'adopted';
  memories?: EmotionalMemory[];
  isLoggedIn?: boolean;
}

const memoryIcons: Record<string, string> = {
  happy_moment: '😊',
  funny_moment: '😄',
  touching_story: '💕',
  last_goodbye: '👋',
  tribute: '🌹',
  other: '💭',
};

const memoryLabels: Record<string, string> = {
  happy_moment: 'Happy Moment',
  funny_moment: 'Funny Moment',
  touching_story: 'Touching Story',
  last_goodbye: 'Last Goodbye',
  tribute: 'Tribute',
  other: 'Memory',
};

const statusMessages: Record<string, string> = {
  deceased: 'Rest in peace, dear friend',
  missing: 'We hope to see you again',
  adopted: 'Happy in their forever home',
};

export default function EmotionalMemoriesSection({
  animalId,
  animalName,
  animalStatus,
  memories = [],
  isLoggedIn = false,
}: EmotionalMemoriesSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    memory_text: '',
    memory_type: 'happy_moment' as const,
    memory_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // API call here
    console.log('[v0] Memory shared:', formData);
    setShowForm(false);
    setFormData({
      title: '',
      memory_text: '',
      memory_type: 'happy_moment',
      memory_date: '',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with Status Message */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Heart size={20} className="text-purple-600" />
              {animalStatus === 'deceased'
                ? 'In Loving Memory'
                : animalStatus === 'missing'
                ? 'We Miss You'
                : 'Happy Memories'}
            </h3>
            <p className="text-sm text-purple-700 mt-1 italic">
              "{statusMessages[animalStatus]}, {animalName} 🐾"
            </p>
          </div>
          {isLoggedIn && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-purple-50 active:scale-95 text-purple-700 font-bold text-sm rounded-full transition"
            >
              <Plus size={16} />
              Share Memory
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 space-y-3"
        >
          <input
            type="text"
            placeholder="Memory title (e.g., 'Our First Meeting')"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-400 focus:outline-none text-sm"
            required
          />

          <select
            value={formData.memory_type}
            onChange={(e) =>
              setFormData({
                ...formData,
                memory_type: e.target.value as any,
              })
            }
            className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-400 focus:outline-none text-sm"
          >
            <option value="happy_moment">😊 Happy Moment</option>
            <option value="funny_moment">😄 Funny Moment</option>
            <option value="touching_story">💕 Touching Story</option>
            <option value="last_goodbye">👋 Last Goodbye</option>
            <option value="tribute">🌹 Tribute</option>
            <option value="other">💭 Other</option>
          </select>

          <textarea
            placeholder="Share your memory... (what happened, how it made you feel, what you'll remember most)"
            value={formData.memory_text}
            onChange={(e) => setFormData({ ...formData, memory_text: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-400 focus:outline-none text-sm resize-none"
            required
          />

          <input
            type="date"
            value={formData.memory_date}
            onChange={(e) => setFormData({ ...formData, memory_date: e.target.value })}
            className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-400 focus:outline-none text-sm"
            placeholder="When did this happen?"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 border-2 border-purple-300 text-purple-700 font-bold py-2 rounded-lg hover:bg-purple-50 active:scale-95 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-purple-500 hover:bg-purple-600 active:scale-95 text-white font-bold py-2 rounded-lg transition"
            >
              Share Memory
            </button>
          </div>
        </form>
      )}

      {/* Memories List */}
      <div className="space-y-2">
        {memories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">💭</p>
            <p className="text-muted-foreground">No memories shared yet</p>
            {isLoggedIn && (
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to share your memories of {animalName}
              </p>
            )}
          </div>
        ) : (
          memories.map((memory) => (
            <div
              key={memory.id}
              className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition"
            >
              {/* Memory Header */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === memory.id ? null : memory.id)
                }
                className="w-full flex items-start justify-between p-4 hover:bg-gray-50 active:scale-95 transition text-left"
              >
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-3xl">{memoryIcons[memory.memory_type]}</span>
                  <div>
                    <p className="font-bold text-foreground">{memory.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {memoryLabels[memory.memory_type]} •{' '}
                      {new Date(memory.shared_at).toLocaleDateString()}
                    </p>
                    {memory.shared_by_name && (
                      <p className="text-xs text-muted-foreground">by {memory.shared_by_name}</p>
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              {expandedId === memory.id && (
                <div className="border-t-2 border-gray-200 p-4 bg-gray-50 space-y-3">
                  {memory.photo_url && (
                    <img
                      src={memory.photo_url}
                      alt="Memory photo"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  )}

                  <div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {memory.memory_text}
                    </p>
                  </div>

                  {memory.memory_date && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar size={14} />
                      <span>Happened on {new Date(memory.memory_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
