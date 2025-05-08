'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { RequiresAction } from '@/components/overview/RequiresAction';
import { CarePlanUpdates } from '@/components/overview/CarePlanUpdates';
import { ActivityLog } from '@/components/overview/ActivityLog';

export default function OverviewPage() {
  const router = useRouter();
  const { loadPatients, loadAnalytics, isLoading, error, sessionId } = useStore();

  useEffect(() => {
    // Check if sessionId is set, if not, redirect to login
    if (!sessionId) {
        window.location.href = '/login';
    }
    loadPatients();
    loadAnalytics();
  }, [loadPatients, loadAnalytics, sessionId, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-2xl font-semibold text-black">Overview</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <RequiresAction />
        <CarePlanUpdates />
      </div>
      <div className="mt-6">
        <ActivityLog />
      </div>
    </div>
  );
} 