import { Patient, CarePlanSnapshot, Action, TimelineEvent } from './types';

// Helper function to create a date with random time within a range
function createDateWithRandomTime(daysOffset: number, startHour: number, endHour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  
  // Generate random hour and minute within the range
  const hour = Math.floor(Math.random() * (endHour - startHour)) + startHour;
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  
  date.setHours(hour, minute, second, 0);
  return date;
}

// Helper function to create a date with specific time range based on event type
function createDateForEventType(daysOffset: number, type: string): Date {
  switch (type) {
    case 'appointment':
      // Appointments between 8 AM and 4 PM
      return createDateWithRandomTime(daysOffset, 8, 16);
    case 'lab':
      // Lab work between 6 AM and 10 AM
      return createDateWithRandomTime(daysOffset, 6, 10);
    case 'call':
      // Calls between 9 AM and 4 PM
      return createDateWithRandomTime(daysOffset, 9, 16);
    case 'hospitalization':
      // Hospital visits can happen any time
      return createDateWithRandomTime(daysOffset, 0, 24);
    case 'diagnosis':
      // Diagnoses typically during regular hours
      return createDateWithRandomTime(daysOffset, 8, 17);
    default:
      // Default to regular business hours
      return createDateWithRandomTime(daysOffset, 9, 17);
  }
}

export const mockPatients: Record<string, Patient> = {
  'patient1': {
    name: 'John Smith',
    conditions: ['Type 2 Diabetes', 'Hypertension', 'Chronic Kidney Disease', 'Hyperlipidemia'],
    hcpcs_code: 'G0556',
    timeline: {
      'event1': {
        type: 'appointment',
        timestamp: createDateForEventType(14, 'appointment').toISOString(),
        description: 'Scheduled nephrology follow-up',
      },
      'event2': {
        type: 'call',
        timestamp: createDateForEventType(7, 'call').toISOString(),
        description: 'Monthly diabetes check-in call',
      },
      'event3': {
        type: 'lab',
        timestamp: createDateForEventType(-7, 'lab').toISOString(),
        description: 'Blood work results - HbA1c: 7.6%, eGFR: 48 mL/min/1.73m²',
      },
      'event4': {
        type: 'appointment',
        timestamp: createDateForEventType(-30, 'appointment').toISOString(),
        description: 'Primary care check-up - BP: 145/90, adjusted medication',
      },
      'event5': {
        type: 'diagnosis',
        timestamp: createDateForEventType(-90, 'diagnosis').toISOString(),
        description: 'Diagnosed with Chronic Kidney Disease, Stage 3',
      },
      'event6': {
        type: 'hospitalization',
        timestamp: createDateForEventType(-120, 'hospitalization').toISOString(),
        description: 'Emergency room visit for hypertensive crisis',
      },
    },
    care_plan_snapshots: {
      'snapshot1': {
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
    hcpcs_code: 'G0557',
    timeline: {
      'event1': {
        type: 'appointment',
        timestamp: createDateForEventType(21, 'appointment').toISOString(),
        description: 'Scheduled pulmonology follow-up',
      },
      'event2': {
        type: 'call',
        timestamp: createDateForEventType(14, 'call').toISOString(),
        description: 'Bi-weekly asthma check-in call',
      },
      'event3': {
        type: 'lab',
        timestamp: createDateForEventType(-5, 'lab').toISOString(),
        description: 'Pulmonary function test - FEV1: 85% predicted',
      },
      'event4': {
        type: 'hospitalization',
        timestamp: createDateForEventType(-15, 'hospitalization').toISOString(),
        description: 'Emergency room visit for severe asthma attack',
      },
      'event5': {
        type: 'appointment',
        timestamp: createDateForEventType(-45, 'appointment').toISOString(),
        description: 'Psychiatry consultation - anxiety management',
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
    hcpcs_code: 'G0558',
    timeline: {
      'event1': {
        type: 'appointment',
        timestamp: createDateForEventType(30, 'appointment').toISOString(),
        description: 'Scheduled cardiology follow-up',
      },
      'event2': {
        type: 'call',
        timestamp: createDateForEventType(14, 'call').toISOString(),
        description: 'Bi-weekly cardiac check-in call',
      },
      'event3': {
        type: 'lab',
        timestamp: createDateForEventType(-3, 'lab').toISOString(),
        description: 'Cardiac stress test results - normal exercise tolerance',
      },
      'event4': {
        type: 'appointment',
        timestamp: createDateForEventType(-30, 'appointment').toISOString(),
        description: 'Cardiology follow-up - stable condition',
      },
      'event5': {
        type: 'hospitalization',
        timestamp: createDateForEventType(-90, 'hospitalization').toISOString(),
        description: 'Hospital admission for chest pain evaluation',
      },
      'event6': {
        type: 'diagnosis',
        timestamp: createDateForEventType(-120, 'diagnosis').toISOString(),
        description: 'Diagnosed with Coronary Artery Disease',
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
      'action2': {
        id: 'care_plan_call_patient',
        patient_id: 'patient3',
        type: 'care_plan_call_patient',
        description: 'Follow-up call regarding medication changes',
        status: 'failed',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
        activity_log: [
          {
            description: 'Call attempt initiated',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            action: 'call_attempted',
            details: 'Attempted to reach patient'
          },
          {
            description: 'Call failed - no answer',
            timestamp: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
            action: 'call_failed',
            details: 'Patient did not answer after multiple attempts'
          },
        ],
      },
    },
  },
  'patient4': {
    name: 'Emily Davis',
    conditions: ['Depression', 'Anxiety'],
    hcpcs_code: 'G0556',
    timeline: {
      'event1': {
        type: 'appointment',
        timestamp: createDateForEventType(14, 'appointment').toISOString(),
        description: 'Scheduled psychiatry follow-up',
      },
      'event2': {
        type: 'call',
        timestamp: createDateForEventType(7, 'call').toISOString(),
        description: 'Weekly mental health check-in call',
      },
      'event3': {
        type: 'appointment',
        timestamp: createDateForEventType(-7, 'appointment').toISOString(),
        description: 'Therapy session - discussing coping strategies',
      },
      'event4': {
        type: 'appointment',
        timestamp: createDateForEventType(-30, 'appointment').toISOString(),
        description: 'Psychiatry consultation - medication adjustment',
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
    hcpcs_code: 'G0557',
    timeline: {
      'event1': {
        type: 'appointment',
        timestamp: createDateForEventType(28, 'appointment').toISOString(),
        description: 'Scheduled pulmonary follow-up',
      },
      'event2': {
        type: 'call',
        timestamp: createDateForEventType(14, 'call').toISOString(),
        description: 'Bi-weekly COPD check-in call',
      },
      'event3': {
        type: 'lab',
        timestamp: createDateForEventType(-5, 'lab').toISOString(),
        description: 'Blood gas analysis - PaO2: 85 mmHg',
      },
      'event4': {
        type: 'hospitalization',
        timestamp: createDateForEventType(-20, 'hospitalization').toISOString(),
        description: 'COPD exacerbation requiring hospitalization',
      },
      'event5': {
        type: 'appointment',
        timestamp: createDateForEventType(-60, 'appointment').toISOString(),
        description: 'Pulmonary rehabilitation assessment',
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
    hcpcs_code: 'G0558',
    timeline: {
      'event1': {
        type: 'appointment',
        timestamp: createDateForEventType(21, 'appointment').toISOString(),
        description: 'Scheduled rheumatology follow-up',
      },
      'event2': {
        type: 'call',
        timestamp: createDateForEventType(14, 'call').toISOString(),
        description: 'Bi-weekly pain management check-in call',
      },
      'event3': {
        type: 'lab',
        timestamp: createDateForEventType(-7, 'lab').toISOString(),
        description: 'Bone density scan - T-score: -2.3',
      },
      'event4': {
        type: 'appointment',
        timestamp: createDateForEventType(-30, 'appointment').toISOString(),
        description: 'Physical therapy evaluation',
      },
      'event5': {
        type: 'appointment',
        timestamp: createDateForEventType(-90, 'appointment').toISOString(),
        description: 'Rheumatology consultation - new diagnosis',
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
      'action2': {
        id: 'ehr_request_medication_pcp',
        patient_id: 'patient6',
        type: 'ehr_request_medication_pcp',
        description: 'Request pain medication adjustment',
        status: 'failed',
        created_at: new Date(Date.now() - 0.75 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 0.25 * 24 * 60 * 60 * 1000).toISOString(),
        activity_log: [
          {
            description: 'Medication request initiated',
            timestamp: new Date(Date.now() - 0.75 * 24 * 60 * 60 * 1000).toISOString(),
            action: 'request_started',
            details: 'Started medication adjustment request'
          },
          {
            description: 'Request failed - PCP unavailable',
            timestamp: new Date(Date.now() - 0.25 * 24 * 60 * 60 * 1000).toISOString(),
            action: 'request_failed',
            details: 'PCP is out of office until next week'
          },
        ],
      },
    },
  },
  'patient7': {
    name: 'James Taylor',
    conditions: ['Type 1 Diabetes', 'Hypertension'],
    hcpcs_code: 'G0557',
    timeline: {
      'event1': {
        type: 'appointment',
        timestamp: createDateForEventType(28, 'appointment').toISOString(),
        description: 'Scheduled endocrinology follow-up',
      },
      'event2': {
        type: 'call',
        timestamp: createDateForEventType(14, 'call').toISOString(),
        description: 'Bi-weekly diabetes check-in call',
      },
      'event3': {
        type: 'lab',
        timestamp: createDateForEventType(-5, 'lab').toISOString(),
        description: 'HbA1c test results - 7.2%',
      },
      'event4': {
        type: 'appointment',
        timestamp: createDateForEventType(-30, 'appointment').toISOString(),
        description: 'Endocrinology follow-up - insulin pump adjustment',
      },
      'event5': {
        type: 'hospitalization',
        timestamp: createDateForEventType(-60, 'hospitalization').toISOString(),
        description: 'Emergency room visit for severe hypoglycemia',
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
    
    // Create actions subcollection
    const actionsRef = collection(patientRef, 'actions');
    
    // Add each action to the actions subcollection
    for (const [actionId, action] of Object.entries(patient.actions)) {
      await setDoc(doc(actionsRef, actionId), {
        ...action,
        created_at: Timestamp.fromDate(new Date(action.created_at)),
        updated_at: Timestamp.fromDate(new Date(action.updated_at)),
        activity_log: action.activity_log.map(log => ({
          ...log,
          timestamp: Timestamp.fromDate(new Date(log.timestamp)),
        })),
      });
    }

    // Add patient data without actions (since they're in the subcollection)
    await setDoc(patientRef, {
      name: patient.name,
      conditions: patient.conditions,
      hcpcs_code: patient.hcpcs_code,
      care_plan_snapshots: Object.entries(patient.care_plan_snapshots).reduce((acc, [id, snapshot]) => ({
        ...acc,
        [id]: {
          ...snapshot,
          created_at: Timestamp.fromDate(new Date(snapshot.created_at)),
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