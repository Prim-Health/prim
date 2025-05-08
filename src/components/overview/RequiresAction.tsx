'use client';

import { useStore } from '@/lib/store';
import { AlertCircle } from 'lucide-react';

export function RequiresAction() {
  const { actions } = useStore();

  // Filter active actions
  const activeActions = Object.values(actions).filter(
    (action) => action.status === 'active'
  );

  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold">Requires Action</h2>
      {activeActions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No actions require attention</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeActions.map((action) => (
            <div
              key={action.id}
              className="flex items-start space-x-3 rounded-lg border p-4"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{action.type}</h3>
                <p className="mt-1 text-sm text-gray-600">{action.description}</p>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span>Created: {new Date(action.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 