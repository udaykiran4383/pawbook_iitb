'use client';

import { useState } from 'react';
import { AlertTriangle, Plus, Phone, Mail, Users } from 'lucide-react';

interface HelpNeeded {
  id: string;
  help_type: 'medical' | 'shelter' | 'food' | 'transport' | 'other';
  urgency: 'critical' | 'high' | 'moderate' | 'low';
  description: string;
  specific_needs?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'unable_to_help';
  reported_by_name?: string;
}

interface HelpNeededSectionProps {
  animalId: string;
  animalName: string;
  helpRequests?: HelpNeeded[];
  isLoggedIn?: boolean;
  isOwner?: boolean;
}

const helpTypeIcons: Record<string, string> = {
  medical: '🏥',
  shelter: '🏠',
  food: '🍖',
  transport: '🚗',
  other: '🆘',
};

const helpTypeLabels: Record<string, string> = {
  medical: 'Medical Help',
  shelter: 'Shelter Needed',
  food: 'Food & Nutrition',
  transport: 'Transport Help',
  other: 'Other Help',
};

const urgencyColors: Record<string, string> = {
  critical: 'bg-red-100 border-red-300 text-red-700',
  high: 'bg-orange-100 border-orange-300 text-orange-700',
  moderate: 'bg-yellow-100 border-yellow-300 text-yellow-700',
  low: 'bg-green-100 border-green-300 text-green-700',
};

const urgencyLabels: Record<string, string> = {
  critical: '🚨 CRITICAL',
  high: '⚠️ High Priority',
  moderate: '⏰ Moderate',
  low: '📌 Low Priority',
};

export default function HelpNeededSection({
  animalId,
  animalName,
  helpRequests = [],
  isLoggedIn = false,
  isOwner = false,
}: HelpNeededSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    help_type: 'medical',
    urgency: 'high',
    description: '',
    specific_needs: '',
  });

  const openRequests = helpRequests.filter((r) => r.status === 'open');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // API call here
    console.log('[v0] Help request submitted:', formData);
    setShowForm(false);
    setFormData({
      help_type: 'medical',
      urgency: 'high',
      description: '',
      specific_needs: '',
    });
  };

  if (openRequests.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Alert Banner */}
      <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
              🆘 {animalName} Needs Help!
            </h3>
            <p className="text-sm text-red-600 mt-1">
              {openRequests.length} active request{openRequests.length !== 1 ? 's' : ''} for this
              friend
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      {isOwner && showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 space-y-3"
        >
          <select
            value={formData.help_type}
            onChange={(e) => setFormData({ ...formData, help_type: e.target.value })}
            className="w-full px-3 py-2 border-2 border-red-200 rounded-lg focus:border-red-400 focus:outline-none text-sm"
          >
            <option value="medical">🏥 Medical Help</option>
            <option value="shelter">🏠 Shelter Needed</option>
            <option value="food">🍖 Food & Nutrition</option>
            <option value="transport">🚗 Transport</option>
            <option value="other">🆘 Other</option>
          </select>

          <select
            value={formData.urgency}
            onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
            className="w-full px-3 py-2 border-2 border-red-200 rounded-lg focus:border-red-400 focus:outline-none text-sm"
          >
            <option value="critical">🚨 CRITICAL - Need immediate help!</option>
            <option value="high">⚠️ High Priority - Please help soon</option>
            <option value="moderate">⏰ Moderate - Help needed within days</option>
            <option value="low">📌 Low Priority - Ongoing need</option>
          </select>

          <textarea
            placeholder="What help is needed? (Be as specific as possible)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border-2 border-red-200 rounded-lg focus:border-red-400 focus:outline-none text-sm resize-none"
            required
          />

          <textarea
            placeholder="Specific needs (e.g., 'Needs antibiotics for wound', 'Looking for a safe place to stay')"
            value={formData.specific_needs}
            onChange={(e) => setFormData({ ...formData, specific_needs: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border-2 border-red-200 rounded-lg focus:border-red-400 focus:outline-none text-sm resize-none"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 border-2 border-red-300 text-red-700 font-bold py-2 rounded-lg hover:bg-red-50 active:scale-95 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold py-2 rounded-lg transition"
            >
              Post Help Request
            </button>
          </div>
        </form>
      )}

      {/* Help Requests List */}
      <div className="space-y-3">
        {openRequests.map((request) => (
          <div
            key={request.id}
            className={`border-2 rounded-2xl p-4 space-y-2 ${urgencyColors[request.urgency]}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{helpTypeIcons[request.help_type]}</span>
                <div>
                  <p className="font-bold text-lg">{helpTypeLabels[request.help_type]}</p>
                  <p className="font-bold text-sm">{urgencyLabels[request.urgency]}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm leading-relaxed">{request.description}</p>

            {/* Specific Needs */}
            {request.specific_needs && (
              <div className="bg-white/50 rounded-lg p-2">
                <p className="text-xs font-bold opacity-75 mb-1">SPECIFIC NEEDS:</p>
                <p className="text-sm">{request.specific_needs}</p>
              </div>
            )}

            {/* Call to Action */}
            {request.urgency === 'critical' || request.urgency === 'high' ? (
              <div className="bg-white/50 rounded-lg p-3 mt-3">
                <p className="font-bold text-sm mb-2">Can you help? Contact us:</p>
                <div className="flex flex-wrap gap-2">
                  <button className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-gray-100 active:scale-95 rounded-full text-sm font-bold transition">
                    <Phone size={14} />
                    Call
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-gray-100 active:scale-95 rounded-full text-sm font-bold transition">
                    <Mail size={14} />
                    Email
                  </button>
                  {isLoggedIn && (
                    <button className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-gray-100 active:scale-95 rounded-full text-sm font-bold transition">
                      <Users size={14} />
                      I can help
                    </button>
                  )}
                </div>
              </div>
            ) : (
              isLoggedIn && (
                <button className="w-full px-3 py-2 bg-white hover:bg-gray-100 active:scale-95 rounded-lg font-bold text-sm transition">
                  👋 I Can Help
                </button>
              )
            )}

            {/* Reporter Info */}
            {request.reported_by_name && (
              <p className="text-xs opacity-75 mt-2">Reported by {request.reported_by_name}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
