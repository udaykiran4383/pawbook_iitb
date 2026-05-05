'use client';

import { useState } from 'react';
import { Heart, Plus, User, Calendar, Gift, MapPin } from 'lucide-react';

interface Donor {
  id: string;
  name: string;
  donation_type: 'food' | 'medical' | 'supplies' | 'other';
  donation_description?: string;
  donation_date: string;
  donor_type?: 'student' | 'faculty' | 'staff' | 'alumni' | 'external';
  hostel_name?: string;
}

interface DonorsSectionProps {
  animalId: string;
  animalName: string;
  donors?: Donor[];
  isLoggedIn?: boolean;
}

const donationIcons: Record<string, string> = {
  food: '🍖',
  medical: '💉',
  supplies: '📦',
  other: '🎁',
};

export default function DonorsSection({
  animalId,
  animalName,
  donors = [],
  isLoggedIn = false,
}: DonorsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    donation_type: 'food',
    donation_description: '',
    hostel_name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // API call here
    console.log('[v0] Donation submitted:', formData);
    setShowForm(false);
    setFormData({
      name: '',
      email: '',
      donation_type: 'food',
      donation_description: '',
      hostel_name: '',
    });
  };

  const recentDonors = [...donors]
    .sort((a, b) => new Date(b.donation_date).getTime() - new Date(a.donation_date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Heart size={20} className="text-red-500" />
          Donors & Contributors
        </h3>
        {isLoggedIn && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 active:scale-95 text-red-700 font-bold text-sm rounded-full transition"
          >
            <Plus size={16} />
            Donate
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 space-y-3"
        >
          <input
            type="text"
            placeholder="Your name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border-2 border-red-200 rounded-lg focus:border-red-400 focus:outline-none text-sm"
            required
          />
          <input
            type="email"
            placeholder="Your email (for updates)"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border-2 border-red-200 rounded-lg focus:border-red-400 focus:outline-none text-sm"
          />
          <select
            value={formData.donation_type}
            onChange={(e) => setFormData({ ...formData, donation_type: e.target.value })}
            className="w-full px-3 py-2 border-2 border-red-200 rounded-lg focus:border-red-400 focus:outline-none text-sm"
          >
            <option value="food">🍖 Food & Treats</option>
            <option value="medical">💉 Medical Supplies</option>
            <option value="supplies">📦 Other Supplies</option>
            <option value="other">🎁 Other</option>
          </select>
          <textarea
            placeholder="What did you donate? (e.g., dog food, first aid kit)"
            value={formData.donation_description}
            onChange={(e) => setFormData({ ...formData, donation_description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border-2 border-red-200 rounded-lg focus:border-red-400 focus:outline-none text-sm resize-none"
          />
          <input
            type="text"
            placeholder="Your hostel (optional)"
            value={formData.hostel_name}
            onChange={(e) => setFormData({ ...formData, hostel_name: e.target.value })}
            className="w-full px-3 py-2 border-2 border-red-200 rounded-lg focus:border-red-400 focus:outline-none text-sm"
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
              Record Donation
            </button>
          </div>
        </form>
      )}

      {/* Stats */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-4">
        <p className="font-bold text-foreground text-center">
          ❤️ {donors.length} kind people have helped {animalName}!
        </p>
      </div>

      {/* Donors List */}
      <div className="space-y-2">
        {recentDonors.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground text-sm">
            Be the first to help {animalName}! Every contribution matters. 🤝
          </p>
        ) : (
          recentDonors.map((donor) => (
            <div
              key={donor.id}
              className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition"
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{donationIcons[donor.donation_type]}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-foreground">{donor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(donor.donation_date).toLocaleDateString()}
                    </p>
                  </div>
                  {donor.donation_description && (
                    <p className="text-sm text-foreground mt-1">{donor.donation_description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {donor.donor_type && (
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {donor.donor_type}
                      </span>
                    )}
                    {donor.hostel_name && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {donor.hostel_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
