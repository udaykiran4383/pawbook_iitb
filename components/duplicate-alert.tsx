'use client';

import { AlertTriangle, X } from 'lucide-react';
import { DuplicateMatch } from '@/lib/duplicate-detection';

interface DuplicateAlertProps {
  duplicates: DuplicateMatch[];
  onDismiss?: () => void;
}

export default function DuplicateAlert({
  duplicates,
  onDismiss,
}: DuplicateAlertProps) {
  if (duplicates.length === 0) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 relative">
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-yellow-600 hover:text-yellow-700"
      >
        <X size={18} />
      </button>

      <div className="flex gap-3">
        <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1 pr-6">
          <h3 className="font-semibold text-yellow-900">Potential duplicates detected</h3>
          <p className="text-sm text-yellow-700 mt-1 mb-3">
            These similar animals already exist. Please verify before adding:
          </p>
          <div className="space-y-2">
            {duplicates.map((dup, idx) => (
              <div
                key={idx}
                className="bg-white rounded p-2 text-sm border border-yellow-100"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <strong className="text-gray-900">{dup.name}</strong>
                    <p className="text-gray-600 text-xs">
                      {dup.location} • {dup.animalType}
                    </p>
                  </div>
                  <span className="text-yellow-600 font-semibold text-xs whitespace-nowrap ml-2">
                    {Math.round(dup.similarity * 100)}% match
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
