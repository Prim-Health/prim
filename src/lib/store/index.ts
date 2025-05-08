import { create } from 'zustand';
import { UserSession, Patient, Action } from '../types';
import {
  createSession,
  subscribeToSession,
  getPatients,
  subscribeToPatient,
  subscribeToActions,
  getAnalytics,
} from '../firebase/services';
import { populateMockData } from '../mockData';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// Helper function to handle no session
const handleNoSession = () => {
  console.log('No valid session found, redirecting to login...');
  window.location.href = '/login';
};

interface StoreState {
  sessionId: string | null;
  session: UserSession | null;
  patients: Record<string, Patient>;
  actions: Record<string, Action>;
  analytics: {
    totalPatients: number;
    activeCarePlans: number;
    pendingActions: number;
    mipsScore: number;
  };
  isLoading: boolean;
  error: string | null;
  setSessionId: (id: string | null) => void;
  createNewSession: (session: UserSession) => Promise<string>;
  loadPatients: () => Promise<void>;
  loadAnalytics: () => Promise<void>;
  createCarePlanSnapshot: (patientId: string, snapshot: any) => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  sessionId: null,
  session: null,
  patients: {},
  actions: {},
  analytics: {
    totalPatients: 0,
    activeCarePlans: 0,
    pendingActions: 0,
    mipsScore: 0,
  },
  isLoading: false,
  error: null,

  setSessionId: (id: string | null) => {
    console.log('Setting session ID:', id);
    set({ sessionId: id });
    if (id) {
      // Subscribe to session updates
      subscribeToSession(id, (session) => {
        console.log('Session updated:', session);
        set({ session });
      });
    } else {
      set({ session: null });
      // Clear all data when session is removed
      set({ patients: {}, actions: {}, analytics: { totalPatients: 0, activeCarePlans: 0, pendingActions: 0, mipsScore: 0 } });
      handleNoSession();
    }
  },

  createNewSession: async (session: UserSession) => {
    try {
      console.log('Creating new session in store...');
      set({ isLoading: true, error: null });
      
      // Create the session in Firestore
      const sessionId = await createSession(session);
      console.log('Session created with ID:', sessionId);
      
      if (!sessionId) {
        throw new Error('Failed to create session - no ID returned');
      }
      
      // Set the session ID in the store
      set({ sessionId });
      
      // Subscribe to session updates
      subscribeToSession(sessionId, (session) => {
        console.log('Session updated:', session);
        set({ session });
      });

      // Populate mock data
      console.log('Populating mock data...');
      await populateMockData(sessionId);
      console.log('Mock data populated');
      
      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create session' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loadPatients: async () => {
    const { sessionId } = get();
    if (!sessionId) {
      console.log('No session ID available for loading patients');
      handleNoSession();
      return;
    }

    try {
      console.log('Loading patients...');
      set({ isLoading: true, error: null });
      const patients = await getPatients(sessionId);
      console.log('Patients loaded:', patients);
      set({ patients });

      // Subscribe to patient updates
      Object.keys(patients).forEach((patientId) => {
        subscribeToPatient(sessionId, patientId, (patient) => {
          if (patient) {
            console.log('Patient updated:', patientId, patient);
            set((state) => ({
              patients: {
                ...state.patients,
                [patientId]: patient,
              },
            }));
          }
        });

        // Subscribe to actions for each patient
        subscribeToActions(sessionId, patientId, (actions) => {
          console.log('Actions updated for patient:', patientId, actions);
          set((state) => ({
            actions: {
              ...state.actions,
              ...actions,
            },
          }));
        });
      });
    } catch (error) {
      console.error('Error loading patients:', error);
      set({ error: 'Failed to load patients' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadAnalytics: async () => {
    const { sessionId } = get();
    if (!sessionId) {
      console.log('No session ID available for loading analytics');
      handleNoSession();
      return;
    }

    try {
      console.log('Loading analytics...');
      set({ isLoading: true, error: null });
      const analytics = await getAnalytics(sessionId);
      console.log('Analytics loaded:', analytics);
      set({ analytics });
    } catch (error) {
      console.error('Error loading analytics:', error);
      set({ error: 'Failed to load analytics' });
    } finally {
      set({ isLoading: false });
    }
  },

  createCarePlanSnapshot: async (patientId: string, snapshot: any) => {
    const { sessionId } = get();
    if (!sessionId) {
      console.error('No session ID available');
      return;
    }

    try {
      const patientRef = doc(db, 'sessions', sessionId, 'patients', patientId);
      const patientDoc = await getDoc(patientRef);
      
      if (!patientDoc.exists()) {
        throw new Error('Patient not found');
      }

      const patientData = patientDoc.data();
      const snapshots = patientData.care_plan_snapshots || {};
      const newSnapshotId = `snapshot${Object.keys(snapshots).length + 1}`;

      await updateDoc(patientRef, {
        [`care_plan_snapshots.${newSnapshotId}`]: {
          ...snapshot,
          created_at: Timestamp.fromDate(snapshot.created_at),
        },
      });

      // Refresh patients data
      await get().loadPatients();
    } catch (error) {
      console.error('Error creating care plan snapshot:', error);
      throw error;
    }
  },
})); 