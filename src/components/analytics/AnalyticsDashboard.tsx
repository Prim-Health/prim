'use client';

import { BarChart3, Users, Activity, AlertCircle } from 'lucide-react';

const metrics = [
  {
    name: 'Total Patients',
    value: '1,234',
    icon: Users,
    change: '+12%',
    changeType: 'positive',
  },
  {
    name: 'Active Care Plans',
    value: '856',
    icon: Activity,
    change: '+8%',
    changeType: 'positive',
  },
  {
    name: 'Pending Actions',
    value: '42',
    icon: AlertCircle,
    change: '-5%',
    changeType: 'negative',
  },
  {
    name: 'MIPS Score',
    value: '92',
    icon: BarChart3,
    change: '+3%',
    changeType: 'positive',
  },
];

export function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="rounded-lg border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <metric.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-black">{metric.name}</p>
                <p className="text-2xl font-semibold text-black">{metric.value}</p>
              </div>
            </div>
            <div className="mt-4">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  metric.changeType === 'positive'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {metric.change}
              </span>
              <span className="ml-2 text-sm text-gray-500">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-black">Quality Measures</h2>
        <div className="text-center py-12">
          <p className="text-gray-500">
            Quality measures and detailed analytics coming soon...
          </p>
        </div>
      </div>
    </div>
  );
} 