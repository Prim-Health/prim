'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { CarePlanReviewModal } from './CarePlanReviewModal';
import { Patient, CarePlanSnapshot } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

interface CarePlan {
  patientId: string;
  patientName: string;
  snapshotId: string;
  snapshot: CarePlanSnapshot;
}

export function CarePlanUpdates() {
  const { patients } = useStore();
  const [selectedPlan, setSelectedPlan] = useState<CarePlan | null>(null);

  const carePlansNeedingRevision = Object.entries(patients).flatMap(([patientId, patient]) =>
    Object.entries(patient.care_plan_snapshots || {})
      .filter(([_, snapshot]) => snapshot.requiresRevision)
      .map(([snapshotId, snapshot]) => ({
        patientId,
        patientName: patient.name,
        snapshotId,
        snapshot,
      }))
  );

  const handlePlanClick = (plan: CarePlan) => {
    console.log('Plan clicked:', plan);
    setSelectedPlan(plan);
  };

  const handleCloseModal = () => {
    console.log('Closing modal');
    setSelectedPlan(null);
  };

  const formatDate = (date: any) => {
    if (date instanceof Timestamp) {
      return date.toDate().toLocaleDateString();
    }
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString();
    }
    return 'Invalid Date';
  };

  if (carePlansNeedingRevision.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-black">Care Plan Updates</h2>
        <p className="text-gray-500">No care plans require updates.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-black">Care Plan Updates</h2>
      <div className="space-y-4">
        {carePlansNeedingRevision.map((plan: CarePlan) => (
          <button
            key={`${plan.patientId}-${plan.snapshotId}`}
            onClick={() => handlePlanClick(plan)}
            className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-black">{plan.patientName}</h3>
                <p className="text-sm text-gray-500">
                  {plan.snapshot.flags.length} flags • {plan.snapshot.suggestions.length} suggestions
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(plan.snapshot.created_at)}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedPlan && (
        <CarePlanReviewModal
          isOpen={true}
          onClose={handleCloseModal}
          patientId={selectedPlan.patientId}
          patientName={selectedPlan.patientName}
          snapshotId={selectedPlan.snapshotId}
          snapshot={selectedPlan.snapshot}
        />
      )}
    </div>
  );
} 