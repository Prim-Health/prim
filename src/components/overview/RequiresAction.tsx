'use client';

import React from 'react';
import { useStore } from '../../lib/store';
import { Timestamp } from 'firebase/firestore';
import { AlertCircle } from 'lucide-react';

export function RequiresAction() {
  const { actions, patients } = useStore();
  
  // Filter for failed actions
  const failedActions = Object.values(actions).filter(action => action.status === 'failed');

  const formatDate = (timestamp: string | Timestamp): string => {
    try {
      let date: Date;
      if (timestamp instanceof Timestamp) {
        date = timestamp.toDate();
      } else {
        date = new Date(timestamp);
      }
      
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };
  
  if (failedActions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Requires Action</h2>
        <p className="text-gray-500">No actions require attention at this time.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Requires Action ({failedActions.length})</h2>
      <div className="space-y-4">
        {failedActions.map((action) => {
          const patient = patients[action.patient_id];
          return (
            <div key={action.id} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                {action.description}
              </h3>
              <div className="text-sm text-gray-500">
                {formatDate(action.created_at)} • {patient?.name || 'Unknown Patient'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 