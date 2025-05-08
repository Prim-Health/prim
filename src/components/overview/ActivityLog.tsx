import { useStore } from '@/lib/store';
import { Clock } from 'lucide-react';

export function ActivityLog() {
  const { actions } = useStore();

  // Get all activity log entries from all actions
  const allActivityLogs = Object.values(actions).flatMap((action) =>
    action.activity_log.map((log) => ({
      ...log,
      actionId: action.id,
      patientId: action.patient_id,
    }))
  );

  // Sort by timestamp (most recent first)
  const sortedLogs = allActivityLogs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold">Activity Log</h2>
      {sortedLogs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedLogs.map((log, index) => (
            <div key={index} className="flex space-x-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                  <Clock className="h-4 w-4 text-gray-600" />
                </div>
                {index < sortedLogs.length - 1 && (
                  <div className="mt-2 h-full w-0.5 bg-gray-200" />
                )}
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{log.action}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{log.details}</p>
                <div className="mt-2 text-xs text-gray-500">
                  Action ID: {log.actionId} | Patient ID: {log.patientId}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 