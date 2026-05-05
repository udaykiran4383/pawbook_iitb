'use client';

import { useState } from 'react';
import { Pill, Plus, Calendar, User, Trash2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface MedicalRecord {
  id: string;
  record_type: 'vaccination' | 'checkup' | 'treatment' | 'injury' | 'surgery' | 'prescription';
  title: string;
  description: string;
  record_date: string;
  next_checkup_date?: string;
  veterinarian_name?: string;
  clinic_name?: string;
  contact_info?: string;
}

interface MedicalRecordsSectionProps {
  animalId: string;
  animalName: string;
  records?: MedicalRecord[];
  isOwner?: boolean;
}

const recordTypeIcons: Record<string, string> = {
  vaccination: '💉',
  checkup: '🔍',
  treatment: '⚕️',
  injury: '🤕',
  surgery: '🏥',
  prescription: '💊',
};

const recordTypeLabels: Record<string, string> = {
  vaccination: 'Vaccination',
  checkup: 'Medical Checkup',
  treatment: 'Treatment',
  injury: 'Injury Report',
  surgery: 'Surgery',
  prescription: 'Prescription',
};

export default function MedicalRecordsSection({
  animalId,
  animalName,
  records = [],
  isOwner = false,
}: MedicalRecordsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
  );

  const upcomingCheckups = sortedRecords.filter((r) => 
    r.next_checkup_date && new Date(r.next_checkup_date) > new Date()
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Pill size={20} />
          Medical Records
        </h3>
        {isOwner && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 active:scale-95 text-blue-700 font-bold text-sm rounded-full transition"
          >
            <Plus size={16} />
            Add Record
          </button>
        )}
      </div>

      {/* Upcoming Checkups Alert */}
      {upcomingCheckups.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-3 flex items-start gap-3">
          <AlertCircle size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-orange-900 text-sm">Upcoming Care Needed</p>
            {upcomingCheckups.map((record) => (
              <p key={record.id} className="text-xs text-orange-700">
                {recordTypeLabels[record.record_type]} due on {new Date(record.next_checkup_date!).toLocaleDateString()}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Record title"
            className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-400 focus:outline-none text-sm"
          />
          <textarea
            placeholder="Description"
            rows={3}
            className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-400 focus:outline-none text-sm resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              placeholder="Record date"
              className="px-3 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-400 focus:outline-none text-sm"
            />
            <input
              type="text"
              placeholder="Veterinarian name"
              className="px-3 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-400 focus:outline-none text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 border-2 border-blue-300 text-blue-700 font-bold py-2 rounded-lg hover:bg-blue-50 active:scale-95 transition"
            >
              Cancel
            </button>
            <button
              className="flex-1 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white font-bold py-2 rounded-lg transition"
            >
              Save Record
            </button>
          </div>
        </div>
      )}

      {/* Records List */}
      <div className="space-y-2">
        {sortedRecords.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground text-sm">
            No medical records yet. Health history helps us care for {animalName} better! 🏥
          </p>
        ) : (
          sortedRecords.map((record) => (
            <div
              key={record.id}
              className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition"
            >
              {/* Record Header */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === record.id ? null : record.id)
                }
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:scale-95 transition text-left"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{recordTypeIcons[record.record_type]}</span>
                  <div>
                    <p className="font-bold text-foreground">
                      {record.title || recordTypeLabels[record.record_type]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(record.record_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {expandedId === record.id ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>

              {/* Expanded Details */}
              {expandedId === record.id && (
                <div className="border-t-2 border-gray-200 p-4 bg-gray-50 space-y-2">
                  {record.description && (
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">DETAILS</p>
                      <p className="text-sm text-foreground mt-1">{record.description}</p>
                    </div>
                  )}

                  {record.veterinarian_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User size={16} className="text-gray-600" />
                      <span className="text-foreground">{record.veterinarian_name}</span>
                      {record.clinic_name && (
                        <span className="text-muted-foreground">• {record.clinic_name}</span>
                      )}
                    </div>
                  )}

                  {record.next_checkup_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={16} className="text-orange-600" />
                      <span className="text-foreground">
                        Next checkup: {new Date(record.next_checkup_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {isOwner && (
                    <button className="mt-2 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg active:scale-95 transition flex items-center gap-1 text-sm font-bold">
                      <Trash2 size={14} />
                      Delete
                    </button>
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
