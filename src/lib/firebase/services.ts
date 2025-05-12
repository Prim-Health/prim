import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './config';
import { UserSession, Patient, Action, CarePlanSnapshot } from '../types';

// Session Management
export async function createSession(session: UserSession): Promise<string> {
  const sessionId = new Date().getTime().toString();
  const sessionRef = doc(db, 'user_sessions', sessionId);
  await setDoc(sessionRef, {
    user_id: session.user_id,
    date_created: Timestamp.fromDate(new Date()),
  });
  return sessionId;
}

export function subscribeToSession(sessionId: string, callback: (session: UserSession | null) => void) {
  const sessionRef = doc(db, 'user_sessions', sessionId);
  return onSnapshot(sessionRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      if (data.date_created instanceof Timestamp) {
        callback({
          user_id: data.user_id,
          date_created: data.date_created.toDate().toISOString(),
        } as UserSession);
      } else {
        console.error('date_created is not a Timestamp:', data.date_created);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}

// Patient Management
export async function getPatients(sessionId: string): Promise<Record<string, Patient>> {
  const patientsRef = collection(db, 'user_sessions', sessionId, 'patients');
  const snapshot = await getDocs(patientsRef);
  const patients: Record<string, Patient> = {};
  
  snapshot.forEach((doc) => {
    patients[doc.id] = doc.data() as Patient;
  });
  
  return patients;
}

export function subscribeToPatient(
  sessionId: string,
  patientId: string,
  callback: (patient: Patient | null) => void
) {
  const patientRef = doc(db, 'user_sessions', sessionId, 'patients', patientId);
  return onSnapshot(patientRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as Patient);
    } else {
      callback(null);
    }
  });
}

// Care Plan Management
export async function updateCarePlan(
  sessionId: string,
  patientId: string,
  snapshot: CarePlanSnapshot
): Promise<void> {
  const snapshotId = new Date().getTime().toString();
  const snapshotRef = doc(
    db,
    'user_sessions',
    sessionId,
    'patients',
    patientId,
    'care_plan_snapshots',
    snapshotId
  );
  
  await setDoc(snapshotRef, {
    ...snapshot,
    created_at: Timestamp.fromDate(new Date(snapshot.created_at)),
  });
}

// Action Management
export async function updateAction(
  sessionId: string,
  patientId: string,
  actionId: string,
  action: Partial<Action>
): Promise<void> {
  const actionRef = doc(
    db,
    'user_sessions',
    sessionId,
    'patients',
    patientId,
    'actions',
    actionId
  );
  
  await updateDoc(actionRef, action);
}

export function subscribeToActions(
  sessionId: string,
  patientId: string,
  callback: (actions: Record<string, Action>) => void
) {
  const actionsRef = collection(
    db,
    'user_sessions',
    sessionId,
    'patients',
    patientId,
    'actions'
  );
  
  return onSnapshot(actionsRef, (snapshot) => {
    const actions: Record<string, Action> = {};
    snapshot.forEach((doc) => {
      const action = doc.data() as Action;
      actions[action.id] = action;
    });
    callback(actions);
  });
}

// Analytics
export async function getAnalytics(sessionId: string) {
  const patientsRef = collection(db, 'user_sessions', sessionId, 'patients');
  const snapshot = await getDocs(patientsRef);
  
  const analytics = {
    totalPatients: snapshot.size,
    activeCarePlans: 0,
    pendingActions: 0,
    mipsScore: 0,
  };
  
  for (const patientDoc of snapshot.docs) {
    const patient = patientDoc.data() as Patient;
    
    // Count active care plans
    Object.values(patient.care_plan_snapshots || {}).forEach((snapshot) => {
      if (!snapshot.requiresRevision) {
        analytics.activeCarePlans++;
      }
    });
    
    // Get actions from subcollection
    const actionsRef = collection(db, 'user_sessions', sessionId, 'patients', patientDoc.id, 'actions');
    const actionsSnapshot = await getDocs(actionsRef);
    
    // Count pending actions
    actionsSnapshot.forEach((actionDoc) => {
      const action = actionDoc.data() as Action;
      if (action.status === 'active') {
        analytics.pendingActions++;
      }
    });
  }
  
  // Mock MIPS score calculation
  analytics.mipsScore = Math.floor(
    (analytics.activeCarePlans / analytics.totalPatients) * 100
  );
  
  return analytics;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const sessionRef = doc(db, 'user_sessions', sessionId);
  await deleteDoc(sessionRef);
} 