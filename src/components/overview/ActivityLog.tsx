import { useStore } from '@/lib/store';
import { Clock, AlertCircle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface RawActivityLogEntry {
  description: string;
  timestamp: Timestamp | string;
  action: string;
  details: string;
}

interface ProcessedActivityLogEntry {
  description: string;
  timestamp: Date;
  action: string;
  details: string;
  actionId: string;
  patientId: string;
}

export function ActivityLog() {
  const { actions } = useStore();

  // Get all activity log entries from all actions
  const allActivityLogs = Object.values(actions).flatMap((action) =>
    action.activity_log.map((log: RawActivityLogEntry): ProcessedActivityLogEntry => ({
      description: log.description,
      action: log.action,
      details: log.details,
      actionId: action.id,
      patientId: action.patient_id,
      // Convert Firestore Timestamp to Date if needed
      timestamp: log.timestamp instanceof Timestamp 
        ? log.timestamp.toDate() 
        : new Date(log.timestamp),
    }))
  );

  // Sort by timestamp (most recent first)
  const sortedLogs = allActivityLogs.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-black">Activity Log</h2>
      {sortedLogs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedLogs.map((log, index) => {
            const isFailed = log.action.includes('failed');
            return (
              <div key={index} className="flex items-start space-x-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  isFailed ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  {isFailed ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-black">{log.description}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {log.timestamp.toLocaleDateString()} at {log.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 