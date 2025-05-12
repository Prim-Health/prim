"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Calendar,
  AlertCircle,
  FileText,
  Stethoscope,
} from "lucide-react";
import { Patient, TimelineEvent, CarePlanSnapshot } from "@/lib/types";

// Mock data for demonstration
const mockPatient: Patient = {
  name: "John Smith",
  conditions: ["Type 2 Diabetes", "Hypertension", "Chronic Kidney Disease", "Hyperlipidemia"],
  hcpcs_code: "G0556",
  timeline: {
    event1: {
      type: "appointment",
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Regular checkup with Dr. Reyes",
    },
    event2: {
      type: "lab",
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Blood work results received - HbA1c: 7.6%, eGFR: 48 mL/min/1.73m²",
    },
    event3: {
      type: "diagnosis",
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Diagnosed with Chronic Kidney Disease, Stage 3",
    },
  },
  care_plan_snapshots: {
    snapshot1: {
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      text_block: `
Patient Profile
        ---------------
        Name: John Smith
        DOB: 1948-02-13
        Medicare ID: 3AG4-TY84-83Z
        Primary Provider: Dr. Amanda Reyes, MD
        Phone: (555) 123-9876
        Address: 102 Cherry Lane, Springfield, IL

        \nChronic Conditions (ICD-10 codes)
        ---------------------------------
        1. Type 2 Diabetes Mellitus – E11.9
        2. Hypertension – I10
        3. Chronic Kidney Disease, Stage 3 – N18.3
        4. Hyperlipidemia – E78.5

        \nCurrent Medications
        -------------------
        - Metformin, 500 mg, Twice daily with food
        - Lisinopril, 10 mg, Once daily
        - Atorvastatin, 20 mg, Once daily at night
        - Furosemide, 40 mg, Once daily

        \nVital Stats / Labs
        ------------------
        - BP: 138/82 (recorded 2025-04-18)
        - HbA1c: 7.6% (checked 2025-03-05)
        - eGFR: 48 mL/min/1.73m²
        - LDL: 110 mg/dL

        \nPatient Goals
        -------------
        - Reduce HbA1c to <7.0% by 2025-07-01
        - Monitor BP weekly, keep <130/80
        - Improve daily walking to 30 mins/day by 2025-06-15
        - Maintain eGFR above 45 (ongoing)

        \nPatient Preferences / Needs
        ---------------------------
        - Communication preference: Phone and patient portal
        - Cultural considerations: Spanish-speaking caregiver at home
        - Support system: Daughter and part-time home aide

        \nInterventions
        -------------
        - Medication reconciliation by Care manager – Monthly
        - BP and glucose self-monitoring check-ins by Care coordinator – Weekly
        - Dietary counseling by Dietitian – Every 2 months
        - Kidney function lab orders (CMP, eGFR) by PCP – Every 3 months
        - Physical activity encouragement by Care manager – Monthly phone check

        \nTime Spent on APCM This Month
        ----------------------------
        - 32 minutes
        - 10 min: Phone call
        - 15 min: Care plan update and med review
        - 7 min: Coordination with dietitian
      `,
      requiresRevision: true,
      flags: [
        'Recent lab results show elevated cholesterol levels',
        'Blood pressure medication needs adjustment',
        'Diabetes management plan needs review',
        'Patient reported medication side effects'
      ],
      suggestions: [
        'Increase statin dosage',
        'Adjust blood pressure medication timing',
        'Add dietary consultation',
        'Schedule follow-up in 2 weeks',
        'Consider alternative diabetes medication'
      ],
    },
    snapshot2: {
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      text_block: "Initial care plan established. Patient to monitor blood pressure daily and report any significant changes.",
      requiresRevision: false,
      flags: [],
      suggestions: [],
    },
  },
  actions: {
    action1: {
      id: 'care_plan_call_patient',
      patient_id: 'patient1',
      type: 'care_plan_call_patient',
      description: 'Follow-up call regarding medication changes',
      status: 'active',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      activity_log: [
        {
          description: 'Call initiated',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          action: 'call_initiated',
          details: 'Initial contact with patient'
        },
        {
          description: 'Patient confirmed understanding of new medication schedule',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          action: 'medication_confirmation',
          details: 'Patient acknowledged new schedule'
        },
      ],
    },
  },
};

const eventIcons: Record<string, any> = {
  call: Clock,
  appointment: Calendar,
  hospitalization: AlertCircle,
  lab: FileText,
  diagnosis: Stethoscope,
};

export function PatientDetail({ patientId }: { patientId: string }) {
  const router = useRouter();
  const [selectedCarePlan, setSelectedCarePlan] = useState<string>("snapshot1");
  const [isExpanded, setIsExpanded] = useState(false);

  // Sort timeline events by timestamp
  const sortedEvents = Object.entries(mockPatient.timeline).sort(
    ([_, a], [__, b]) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const carePlanText = mockPatient.care_plan_snapshots[selectedCarePlan].text_block;
  const shouldShowSeeMore = carePlanText.length > 500;
  const displayText = isExpanded ? carePlanText : carePlanText.slice(0, 500) + '...';

  return (
    <div>
      <div className="mb-6 flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 cursor-pointer"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patients
        </button>
      </div>

      <div className="mb-6 rounded-lg border bg-white p-6">
        <h1 className="text-2xl font-semibold text-black">{mockPatient.name}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          {mockPatient.conditions.map((condition, index) => (
            <span
              key={index}
              className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600"
            >
              {condition}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column: Care Plan */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black mb-2">Current Care Plan</h2>
              <select
                value={selectedCarePlan}
                onChange={(e) => setSelectedCarePlan(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm cursor-pointer text-black"
              >
                {Object.entries(mockPatient.care_plan_snapshots).map(
                  ([id, snapshot]) => (
                    <option key={id} value={id} className="text-black">
                      {new Date(snapshot.created_at).toLocaleDateString()}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-600">
                {displayText}
              </pre>
              {shouldShowSeeMore && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer"
                >
                  {isExpanded ? 'Show less' : 'See more'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Timeline */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-black">Medical Timeline</h2>
          <div className="space-y-6">
            {sortedEvents.map(([id, event]) => {
              const Icon = eventIcons[event.type];
              return (
                <div key={id} className="flex space-x-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="mt-2 h-full w-0.5 bg-gray-200" />
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium capitalize text-black">{event.type}</h3>
                      <span className="text-sm text-black">
                        {new Date(event.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-black">
                      {event.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
