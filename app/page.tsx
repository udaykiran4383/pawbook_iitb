'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Sparkles, Heart, Camera, BellRing } from 'lucide-react';
import AddAnimalModal from '@/components/add-animal-modal';
import AnimalCard from '@/components/animal-card';
import AnimalProfileModal from '@/components/animal-profile-modal';
import RainbowBridge from '@/components/rainbow-bridge';
import CommunityInfo from '@/components/community-info';
import EmergencyCases from '@/components/emergency-cases';
import PlayfulFeatures from '@/components/playful-features';
import { demoAnimals, getActiveAnimals, getDeceasedAnimals } from '@/lib/demo-data';
import type { Animal } from '@/lib/demo-data';

import { useAnimalStore } from '@/lib/animal-store';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const animalsState = useAnimalStore((state) => state.animals);
  const animals = Array.isArray(animalsState) ? animalsState : [];
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const activeAnimals = useMemo(() => animals.filter(a => a.status === 'active'), [animals]);
  const deceasedAnimals = useMemo(() => animals.filter(a => a.status === 'deceased'), [animals]);

  const filteredAnimals = useMemo(() => {
    let filtered = activeAnimals;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(animal =>
        animal.name.toLowerCase().includes(term) ||
        animal.location.toLowerCase().includes(term) ||
        animal.animal_type.toLowerCase().includes(term)
      );
    }
    if (filterType !== 'all') {
      filtered = filtered.filter(a => a.animal_type === filterType);
    }
    return filtered;
  }, [activeAnimals, searchTerm, filterType]);

  const totalLikes = useMemo(() => animals.reduce((sum, a) => sum + a.likes, 0), [animals]);
  const totalMemories = useMemo(() => animals.reduce((sum, a) => sum + a.memories.length, 0), [animals]);

  const urgentAnimals = useMemo(() => {
    const now = Date.now();
    return activeAnimals.filter(a => {
      const msSinceSeen = now - new Date(a.last_seen).getTime();
      const msSinceFed = now - new Date(a.last_fed).getTime();
      return msSinceSeen > 12 * 60 * 60 * 1000 || msSinceFed > 12 * 60 * 60 * 1000;
    });
  }, [activeAnimals]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <main className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50">
        <div className="friendship-doodle-bg fixed inset-0 pointer-events-none z-0" />
        <div className="friendship-doodle-overlay fixed inset-0 pointer-events-none z-0" />
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50">
      <div className="friendship-doodle-bg fixed inset-0 pointer-events-none z-0" />
      <div className="friendship-doodle-overlay fixed inset-0 pointer-events-none z-0" />

      <div className="relative z-10 min-h-screen">
        {/* Hero Section */}
        <section className="pt-8 md:pt-10 pb-6 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            {/* Logo area */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-5xl">🐾</span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight">
                PawBook
              </h1>
            </div>
            <p className="text-sm font-bold text-primary tracking-widest uppercase mb-3">IIT Bombay</p>
            <p className="text-xl md:text-2xl text-muted-foreground mb-2 handwritten">
              Every campus animal has a story
            </p>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              A digital memory book-
              Share photos, memories, and care for them together. 📸🐕🐱
            </p>

            {/* Stats bar */}
            <div className="flex justify-center gap-4 sm:gap-6 mt-5 flex-wrap">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{activeAnimals.length}</p>
                <p className="text-xs text-muted-foreground">Active Friends</p>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{totalLikes}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center"><Heart size={10} className="text-red-400" /> Total Loves</p>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{totalMemories}</p>
                <p className="text-xs text-muted-foreground">Memories Shared</p>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        {urgentAnimals.length > 0 && (
          <section className="px-4 mb-6">
            <div className="max-w-2xl mx-auto bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
              <BellRing className="text-red-500 flex-shrink-0" size={24} />
              <div>
                <p className="font-bold text-sm">🚨 Urgent Care Needed!</p>
                <p className="text-xs mt-0.5 leading-relaxed">
                  {urgentAnimals.length} animal{urgentAnimals.length > 1 ? 's' : ''} haven't been seen or fed in over 12 hours: <strong>{urgentAnimals.map(a => a.name).join(', ')}</strong>. If you are on campus, please check on them!
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Search + Filter */}
        <section className="px-4 mb-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                placeholder="Search animals by name, location, type... 🐾"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                id="search-animals"
                className="w-full pl-12 pr-6 py-3.5 rounded-full bg-white text-foreground placeholder-muted-foreground border-2 border-accent focus:outline-none focus:border-primary transition shadow-sm"
              />
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              {[
                { key: 'all', label: '🐾 All' },
                { key: 'dog', label: '🐕 Dogs' },
                { key: 'cat', label: '🐱 Cats' },
                { key: 'bird', label: '🐦 Birds' },
                { key: 'leopard', label: '🐆 Leopards' },
                { key: 'crocodile', label: '🐊 Crocodiles' },
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterType(filter.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition active:scale-95 ${
                    filterType === filter.key
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-white text-foreground border border-accent hover:border-primary'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Add Animal Button */}
        <section className="flex justify-center mb-8 px-4 gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            id="add-animal-button"
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary hover:shadow-lg active:scale-95 text-primary-foreground px-6 py-3 rounded-full font-bold transition-all duration-300 shadow-md"
          >
            <Plus size={20} />
            Add a Friend
          </button>
        </section>

        {/* Main Animal Grid */}
        <section className="max-w-6xl mx-auto px-4 pb-8">
          {filteredAnimals.length === 0 ? (
            <div className="scrapbook-card bg-white p-12 text-center max-w-md mx-auto">
              <div className="text-6xl mb-4">🐕</div>
              <p className="text-2xl font-bold text-foreground mb-2">No animals found</p>
              <p className="text-muted-foreground mb-6">
                {searchTerm ? 'Try a different search term' : 'Be the first to add one! 🐾'}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 bg-primary hover:bg-secondary active:scale-95 text-primary-foreground px-6 py-3 rounded-full transition"
              >
                <Plus size={20} />
                Add First Friend
              </button>
            </div>
          ) : (
            <>
              <p className="text-center text-muted-foreground mb-6 text-sm">
                {filteredAnimals.length} beloved campus friend{filteredAnimals.length !== 1 ? 's' : ''} 🐾
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAnimals.map((animal, idx) => (
                  <div
                    key={animal.id}
                    style={{
                      transform: `rotate(${idx % 2 === 0 ? '-1deg' : '1deg'})`,
                    }}
                  >
                    <AnimalCard
                      animal={animal}
                      onOpenProfile={setSelectedAnimal}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Rainbow Bridge Section */}
        <section className="max-w-6xl mx-auto px-4 pb-8">
          <RainbowBridge animals={deceasedAnimals} onOpenProfile={setSelectedAnimal} />
        </section>

        {/* Emergency Cases */}
        <section className="max-w-6xl mx-auto px-4 pb-8">
          <EmergencyCases />
        </section>

        {/* Playful Features */}
        <PlayfulFeatures />

        {/* Community Info (Rules, Contacts, Quote) */}
        <section className="max-w-3xl mx-auto px-4 pb-8">
          <CommunityInfo />
        </section>

        {/* Footer */}
        <footer className="text-center py-8 text-muted-foreground border-t border-accent/30 bg-white/30">
          <p className="text-sm italic mb-2">
            "If we're going to have animals around we all have to be concerned about them and take care of them."
          </p>
          <p className="text-xs font-bold mb-6">— Bob Ross 🎨</p>
          
          <div className="flex flex-col items-center justify-center gap-2 mb-4">
            <p className="text-xs font-medium text-muted-foreground">For website related issues, contact:</p>
            <a 
              href="https://www.linkedin.com/in/uday-yennampelly/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:bg-blue-50 px-4 py-2 rounded-full transition-colors group border border-transparent hover:border-blue-200"
            >
              <img 
                src="/footer-linkedin-profile-dp.jpeg"
                alt="Uday Yennampelly" 
                className="w-6 h-6 rounded-full border-2 border-blue-100 group-hover:border-blue-400 transition-colors object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/initials/svg?seed=Uday";
                }}
              />
              <span className="text-sm font-bold text-blue-600 group-hover:text-blue-700">Uday Yennampelly</span>
            </a>
          </div>

          <p className="flex items-center justify-center gap-2 text-xs opacity-70">
            <Sparkles size={14} />
            Made with love for IITB animals
            <Sparkles size={14} />
          </p>
        </footer>

        {/* Modals */}
        {showAddModal && (
          <AddAnimalModal
            animals={animals}
            onClose={() => setShowAddModal(false)}
            onAnimalAdded={(newAnimal) => {
              useAnimalStore.getState().addAnimal(newAnimal);
              setShowAddModal(false);
            }}
          />
        )}

        {selectedAnimal && (
          <AnimalProfileModal
            animal={selectedAnimal}
            onClose={() => setSelectedAnimal(null)}
          />
        )}
      </div>
    </main>
  );
}
