'use client';

import { useState } from 'react';
import { AlertCircle, X, Upload } from 'lucide-react';
import ImageUpload from './image-upload';

interface EmergencyCase {
  id: number;
  description: string;
  severity: 'critical' | 'urgent' | 'moderate';
  location: string;
  images: string[];
  timestamp: string;
  resolved: boolean;
}

export default function EmergencyCases() {
  const [showModal, setShowModal] = useState(false);
  const [cases, setCases] = useState<EmergencyCase[]>(() => [
    {
      id: 1,
      description: 'Dog with visible injury near sports complex',
      severity: 'critical',
      location: 'Sports Complex',
      images: [],
      timestamp: new Date().toISOString(),
      resolved: false,
    },
    {
      id: 2,
      description: 'Kitten stuck in tree near library',
      severity: 'urgent',
      location: 'Library Entrance',
      images: [],
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      resolved: false,
    },
  ]);
  const [formData, setFormData] = useState({
    description: '',
    severity: 'urgent' as const,
    location: '',
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'from-red-100 to-red-50 border-red-300';
      case 'urgent':
        return 'from-orange-100 to-orange-50 border-orange-300';
      case 'moderate':
        return 'from-yellow-100 to-yellow-50 border-yellow-300';
      default:
        return 'from-gray-100 to-gray-50 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'urgent':
        return '⚠️';
      case 'moderate':
        return '❗';
      default:
        return '📢';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.location.trim()) return;

    const newCase: EmergencyCase = {
      id: Math.max(...cases.map(c => c.id), 0) + 1,
      ...formData,
      images: [],
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    setCases(prevCases => [newCase, ...prevCases]);
    setFormData({ description: '', severity: 'urgent', location: '' });
    setShowModal(false);
  };

  return (
    <div className="my-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          🚨 Emergency Cases
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-full text-sm md:text-base font-bold hover:shadow-lg transition soft-shadow"
        >
          Report Emergency
        </button>
      </div>

      {/* Emergency Cases Grid */}
      {cases.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-lg">No active emergencies reported. Great news! 🎉</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cases.map(emergencyCase => (
            <div
              key={emergencyCase.id}
              className={`bg-gradient-to-br ${getSeverityColor(emergencyCase.severity)} border-2 p-4 rounded-2xl soft-shadow hover:shadow-lg transition`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{getSeverityIcon(emergencyCase.severity)}</span>
                {emergencyCase.resolved && (
                  <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                    Resolved
                  </span>
                )}
              </div>

              <p className="font-bold text-foreground mb-2">{emergencyCase.description}</p>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <span>📍</span>
                <span>{emergencyCase.location}</span>
              </div>

              <button className="w-full bg-white/70 hover:bg-white text-foreground py-2 rounded-lg font-bold text-sm transition">
                Help This Case
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Emergency Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 soft-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-foreground">Report Emergency</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the emergency..."
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Where is this happening?"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  Severity
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="moderate">Moderate</option>
                  <option value="urgent">Urgent</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border-2 border-gray-200 text-foreground rounded-lg font-bold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition"
                >
                  Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
