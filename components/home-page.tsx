'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Sparkles, Heart, Camera, BellRing, Linkedin } from 'lucide-react';
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
import SiteHero from '@/components/site-hero';
import NeedsYouMost from '@/components/needs-you-most';
import { getPresence } from '@/lib/presence';
import { needsAttention } from '@/lib/survey';
import CampusCensus from '@/components/campus-census';
import { useCampus } from '@/components/campus-provider';
import ExportRegister from '@/components/export-register';
import CampusMap from '@/components/campus-map';
import FeedingStations from '@/components/feeding-stations';

export default function HomePage() {
  const { campus } = useCampus();
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
      // A missed meal is a same-day matter. "Not seen" is not: on a campus of
      // ~250 dogs where the app tracks a handful, twelve quiet hours almost
      // always means nobody opened the app. Six weeks is a real question.
      const msSinceFed = now - new Date(a.last_fed).getTime();
      const unseen = getPresence(a, now).state === 'unseen';
      // Someone ticked "visible wound" or "thin" on the survey card.
      const flagged = needsAttention(a.observation);
      return msSinceFed > 12 * 60 * 60 * 1000 || unseen || flagged;
    });
  }, [activeAnimals]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Until the persisted store hydrates we still render the masthead, so the
  // first paint (and anything that never runs JS) shows PawBook rather than an
  // empty gradient. Only the animal data below waits.
  if (!isMounted) {
    return (
      <main className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 dark:from-background dark:via-background dark:to-background">
        <div className="friendship-doodle-bg fixed inset-0 pointer-events-none z-0" />
        <div className="friendship-doodle-overlay fixed inset-0 pointer-events-none z-0" />
        <div className="relative z-10 min-h-screen">
          <SiteHero />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-amber-50 via-orange-50 to-yellow-50 dark:from-background dark:via-background dark:to-background">
      <div className="friendship-doodle-bg fixed inset-0 pointer-events-none z-0" />
      <div className="friendship-doodle-overlay fixed inset-0 pointer-events-none z-0" />

      <div className="relative z-10 min-h-screen">
        <SiteHero
          stats={{ activeAnimals: activeAnimals.length, totalLikes, totalMemories }}
        />

        <CampusCensus animals={animals} />

        <CampusMap animals={animals} onOpenProfile={setSelectedAnimal} />

        <FeedingStations />

        <NeedsYouMost animals={activeAnimals} onOpenProfile={setSelectedAnimal} />

        {/* Notifications */}
        {urgentAnimals.length > 0 && (
          <section className="px-4 mb-6">
            <div className="max-w-2xl mx-auto bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
              <BellRing className="text-red-500 flex-shrink-0" size={24} />
              <div>
                <p className="font-bold text-sm">🚨 Urgent Care Needed!</p>
                <p className="text-xs mt-0.5 leading-relaxed">
                  {urgentAnimals.length} animal{urgentAnimals.length > 1 ? 's' : ''} need a check — missed a meal, not seen in weeks, or flagged on a survey: <strong>{urgentAnimals.map(a => a.name).join(', ')}</strong>. If you are on campus, please check on them!
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
                className="w-full pl-12 pr-6 py-3.5 rounded-full bg-white dark:bg-card text-foreground placeholder-muted-foreground border-2 border-accent focus:outline-none focus:border-primary transition shadow-sm"
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
                      : 'bg-white dark:bg-card text-foreground border border-accent hover:border-primary'
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
            <div className="scrapbook-card bg-white dark:bg-card p-12 text-center max-w-md mx-auto">
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

          <ExportRegister />
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
        <footer className="text-center py-8 text-muted-foreground border-t border-accent/30 bg-white dark:bg-card/30">
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
              aria-label="Contact on LinkedIn"
              className="inline-flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-4 py-2 rounded-full transition-colors border border-transparent hover:border-blue-200 text-sm font-bold text-blue-600 dark:text-blue-300"
            >
              <Linkedin size={16} aria-hidden="true" />
              LinkedIn
            </a>
          </div>

          <p className="flex items-center justify-center gap-2 text-xs opacity-70">
            <Sparkles size={14} />
            Made with love for {campus.shortName} animals
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
