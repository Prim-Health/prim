import { Patient, CarePlanSnapshot, Action, TimelineEvent } from './types';

export const mockPatients: Record<string, Patient> = {
  'patient1': {
    name: 'John Smith',
    conditions: ['Hypertension', 'Type 2 Diabetes', 'High Cholesterol'],
    timeline: {
      'event1': {
        type: 'appointment',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Regular checkup with Dr. Johnson',
      },
      'event2': {
        type: 'lab',
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Blood work results received - Cholesterol levels elevated',
      },
      'event3': {
        type: 'diagnosis',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Diagnosed with Type 2 Diabetes',
      },
    },
    care_plan_snapshots: {
      'snapshot1': {
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        text_block: `
Patient Profile
        ---------------
        Name: Linda Martinez
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
      'snapshot2': {
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        text_block: 'Initial care plan established. Patient to monitor blood pressure daily and report any significant changes.',
        requiresRevision: false,
        flags: [],
        suggestions: [],
      },
    },
    actions: {
      'action1': {
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
  },
  'patient2': {
    name: 'Sarah Johnson',
    conditions: ['Asthma', 'Anxiety'],
    timeline: {
      'event1': {
        type: 'hospitalization',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Emergency room visit for severe asthma attack',
      },
      'event2': {
        type: 'lab',
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Pulmonary function test results',
      },
    },
    care_plan_snapshots: {
      'snapshot1': {
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        text_block: 'Patient experienced severe asthma attack. Prescribed new inhaler and emergency action plan.',
        requiresRevision: false,
        flags: [],
        suggestions: [],
      },
    },
    actions: {
      'action1': {
        id: 'ehr_request_medication_pcp',
        patient_id: 'patient2',
        type: 'ehr_request_medication_pcp',
        description: 'Request new inhaler prescription',
        status: 'successful',
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        activity_log: [
          {
            description: 'Medication request submitted',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            action: 'request_submitted',
            details: 'New prescription request sent to PCP'
          },
          {
            description: 'Prescription approved by PCP',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            action: 'prescription_approved',
            details: 'PCP approved new inhaler prescription'
          },
        ],
      },
    },
  },
  'patient3': {
    name: 'Michael Brown',
    conditions: ['Heart Disease', 'High Cholesterol'],
    timeline: {
      'event1': {
        type: 'appointment',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Cardiology follow-up appointment',
      },
      'event2': {
        type: 'lab',
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Cardiac stress test results',
      },
    },
    care_plan_snapshots: {
      'snapshot1': {
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        text_block: 'Patient showing improvement in cardiac function. Continue current medication regimen and exercise program.',
        requiresRevision: false,
        flags: [],
        suggestions: [],
      },
    },
    actions: {
      'action1': {
        id: 'ehr_message_pcp',
        patient_id: 'patient3',
        type: 'ehr_message_pcp',
        description: 'Send cardiac test results to PCP',
        status: 'failed',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        activity_log: [
          {
            description: 'Message composition started',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            action: 'message_started',
            details: 'Started composing message to PCP'
          },
          {
            description: 'Failed to send message - system error',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            action: 'message_failed',
            details: 'Technical error prevented message delivery'
          },
        ],
      },
    },
  },
  'patient4': {
    name: 'Emily Davis',
    conditions: ['Depression', 'Anxiety'],
    timeline: {
      'event1': {
        type: 'appointment',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Psychiatry consultation',
      },
      'event2': {
        type: 'call',
        timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Follow-up call regarding medication side effects',
      },
    },
    care_plan_snapshots: {
      'snapshot1': {
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        text_block: 'Patient reporting improved mood with current medication. Continue therapy sessions and medication as prescribed.',
        requiresRevision: false,
        flags: [],
        suggestions: [],
      },
    },
    actions: {
      'action1': {
        id: 'care_plan_send_patient',
        patient_id: 'patient4',
        type: 'care_plan_send_patient',
        description: 'Send updated care plan to patient',
        status: 'successful',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        activity_log: [
          {
            description: 'Care plan prepared',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            action: 'plan_prepared',
            details: 'Updated care plan document generated'
          },
          {
            description: 'Care plan sent to patient',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            action: 'plan_sent',
            details: 'Care plan delivered via patient portal'
          },
        ],
      },
    },
  },
  'patient5': {
    name: 'Robert Wilson',
    conditions: ['COPD', 'Hypertension'],
    timeline: {
      'event1': {
        type: 'hospitalization',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'COPD exacerbation requiring hospitalization',
      },
      'event2': {
        type: 'lab',
        timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Blood gas analysis results',
      },
    },
    care_plan_snapshots: {
      'snapshot1': {
        created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        text_block: 'Patient recovering from COPD exacerbation. Adjust medication dosages and implement new breathing exercise regimen.',
        requiresRevision: false,
        flags: [],
        suggestions: [],
      },
    },
    actions: {
      'action1': {
        id: 'ehr_request_referral_pcp',
        patient_id: 'patient5',
        type: 'ehr_request_referral_pcp',
        description: 'Request pulmonary rehabilitation referral',
        status: 'successful',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        activity_log: [
          {
            description: 'Referral request initiated',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            action: 'referral_started',
            details: 'Started pulmonary rehab referral process'
          },
          {
            description: 'Referral approved',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            action: 'referral_approved',
            details: 'PCP approved pulmonary rehab referral'
          },
        ],
      },
    },
  },
  'patient6': {
    name: 'Lisa Anderson',
    conditions: ['Rheumatoid Arthritis', 'Osteoporosis'],
    timeline: {
      'event1': {
        type: 'appointment',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Rheumatology follow-up',
      },
      'event2': {
        type: 'lab',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Bone density scan results',
      },
    },
    care_plan_snapshots: {
      'snapshot1': {
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        text_block: 'Patient showing improvement in joint mobility. Continue current medication and physical therapy regimen.',
        requiresRevision: false,
        flags: [],
        suggestions: [],
      },
    },
    actions: {
      'action1': {
        id: 'ehr_escalate_task_ma',
        patient_id: 'patient6',
        type: 'ehr_escalate_task_ma',
        description: 'Escalate physical therapy scheduling',
        status: 'failed',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
        activity_log: [
          {
            description: 'Task escalation initiated',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            action: 'escalation_started',
            details: 'Started escalation process for PT scheduling'
          },
          {
            description: 'Escalation failed - no available slots',
            timestamp: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
            action: 'escalation_failed',
            details: 'No available PT slots found'
          },
        ],
      },
    },
  },
  'patient7': {
    name: 'James Taylor',
    conditions: ['Type 1 Diabetes', 'Hypertension'],
    timeline: {
      'event1': {
        type: 'appointment',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Endocrinology follow-up',
      },
      'event2': {
        type: 'lab',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'HbA1c test results',
      },
    },
    care_plan_snapshots: {
      'snapshot1': {
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        text_block: 'Patient maintaining good blood sugar control. Continue current insulin regimen and dietary recommendations.',
        requiresRevision: false,
        flags: [],
        suggestions: [],
      },
    },
    actions: {
      'action1': {
        id: 'ehr_update_patient',
        patient_id: 'patient7',
        type: 'ehr_update_patient',
        description: 'Update patient records with latest HbA1c results',
        status: 'successful',
        created_at: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 0.25 * 24 * 60 * 60 * 1000).toISOString(),
        activity_log: [
          {
            description: 'Record update started',
            timestamp: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
            action: 'update_started',
            details: 'Started updating patient records'
          },
          {
            description: 'Records updated successfully',
            timestamp: new Date(Date.now() - 0.25 * 24 * 60 * 60 * 1000).toISOString(),
            action: 'update_completed',
            details: 'Successfully updated patient records with new data'
          },
        ],
      },
    },
  },
};

export async function populateMockData(sessionId: string) {
  const { db } = await import('./firebase/config');
  const { collection, doc, setDoc, Timestamp } = await import('firebase/firestore');

  // Create the parent session document first
  const sessionRef = doc(db, 'user_sessions', sessionId);
  await setDoc(sessionRef, {
    date_created: Timestamp.fromDate(new Date()),
  });

  // Create patients collection
  const patientsRef = collection(db, 'user_sessions', sessionId, 'patients');

  // Populate each patient
  for (const [patientId, patient] of Object.entries(mockPatients)) {
    const patientRef = doc(patientsRef, patientId);
    await setDoc(patientRef, {
      name: patient.name,
      conditions: patient.conditions,
      care_plan_snapshots: Object.entries(patient.care_plan_snapshots).reduce((acc, [id, snapshot]) => ({
        ...acc,
        [id]: {
          ...snapshot,
          created_at: Timestamp.fromDate(new Date(snapshot.created_at)),
        }
      }), {}),
      actions: Object.entries(patient.actions).reduce((acc, [id, action]) => ({
        ...acc,
        [id]: {
          ...action,
          created_at: Timestamp.fromDate(new Date(action.created_at)),
          updated_at: Timestamp.fromDate(new Date(action.updated_at)),
          activity_log: action.activity_log.map(log => ({
            ...log,
            timestamp: Timestamp.fromDate(new Date(log.timestamp)),
          })),
        }
      }), {}),
    });

    // Create timeline subcollection
    const timelineRef = collection(patientRef, 'timeline');
    for (const [eventId, event] of Object.entries(patient.timeline)) {
      await setDoc(doc(timelineRef, eventId), {
        ...event,
        timestamp: Timestamp.fromDate(new Date(event.timestamp)),
      });
    }
  }
} 