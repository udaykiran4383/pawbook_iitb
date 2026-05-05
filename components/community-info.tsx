'use client';

import { useState } from 'react';
import { Shield, Phone, ExternalLink, ChevronDown, ChevronUp, Users, MessageCircle } from 'lucide-react';

export default function CommunityInfo() {
  const [expandedSection, setExpandedSection] = useState<string | null>('rules');

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  return (
    <section className="mb-12">
      {/* Bob Ross Quote */}
      <div className="bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 border-2 border-green-200/40 rounded-3xl p-6 mb-8 text-center shadow-sm">
        <p className="text-lg md:text-xl text-foreground font-medium italic leading-relaxed">
          "If we're going to have animals around we all have to be concerned about them and take care of them."
        </p>
        <p className="text-muted-foreground mt-2 font-bold">— Bob Ross 🎨</p>
      </div>

      <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
        <Shield size={28} className="text-primary" />
        Community Guidelines & Contacts
      </h2>

      {/* Rules */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('rules')}
          className="w-full flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border-2 border-amber-200/60 rounded-2xl p-4 transition active:scale-[0.99]"
        >
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">📜 PawBook Rules</h3>
          {expandedSection === 'rules' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        {expandedSection === 'rules' && (
          <div className="bg-white border-2 border-amber-100 border-t-0 rounded-b-2xl p-5 space-y-3">
            {[
              { num: 1, text: 'Any animal is allowed.', emoji: '🐾' },
              { num: 2, text: 'Only self-clicked pics allowed.', emoji: '📸' },
              { num: 3, text: 'No content showcasing pain to animals is allowed.', emoji: '🚫' },
              { num: 4, text: 'Humans are not under purview of rule 3.', emoji: '😄' },
              { num: 5, text: "Rules can't be changed.", emoji: '🔒' },
            ].map(rule => (
              <div key={rule.num} className="flex items-start gap-3 bg-amber-50/50 p-3 rounded-xl">
                <div className="flex-shrink-0 w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center font-bold text-sm text-amber-800">
                  {rule.num}
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-lg">{rule.emoji}</span>
                  <p className="text-foreground font-medium text-sm">{rule.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Animal Welfare Contacts */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection('welfare')}
          className="w-full flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200/60 rounded-2xl p-4 transition active:scale-[0.99]"
        >
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">🏥 Animal Welfare Group</h3>
          {expandedSection === 'welfare' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        {expandedSection === 'welfare' && (
          <div className="bg-white border-2 border-blue-100 border-t-0 rounded-b-2xl p-5 space-y-4">
            {/* Main contact */}
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                  <Phone size={18} className="text-blue-700" />
                </div>
                <div>
                  <p className="font-bold text-foreground">Mr. Mukki</p>
                  <p className="text-sm text-muted-foreground">Animal Welfare Coordinator</p>
                </div>
              </div>
              <a
                href="tel:7021735454"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl transition active:scale-95 text-sm justify-center"
              >
                <Phone size={16} />
                7021735454
              </a>
              <p className="text-xs text-muted-foreground mt-2 text-center">📅 Available: 7:30 AM – 6 PM</p>
            </div>

            {/* WhatsApp Group */}
            <a
              href="https://chat.whatsapp.com/BtkfaDN5gmeAcw9kGZnokf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl p-4 transition active:scale-[0.98]"
            >
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <MessageCircle size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-sm">Join WhatsApp Group</p>
                <p className="text-xs text-muted-foreground">IITB Animal Welfare Community</p>
              </div>
              <ExternalLink size={16} className="text-green-600" />
            </a>

            {/* Professors in charge */}
            <div>
              <h4 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                <Users size={16} />
                Profs In-Charge of Animal Welfare
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { name: 'Jay Ghosh', phone: '7045358337' },
                  { name: 'Krishnan', phone: '9930564242' },
                  { name: 'Sarthak', phone: '9967776254' },
                  { name: 'Bellure', phone: '9987466279' },
                ].map(prof => (
                  <a
                    key={prof.phone}
                    href={`tel:${prof.phone}`}
                    className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-xl p-3 transition active:scale-95"
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600">
                      {prof.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-xs">{prof.name}</p>
                      <p className="text-[10px] text-muted-foreground">{prof.phone}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
