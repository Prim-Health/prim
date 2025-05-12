export type EventType = 'call' | 'appointment' | 'hospitalization' | 'lab' | 'diagnosis';

export type ActionStatus = 'successful' | 'scheduled' | 'failed' | 'active';

export type ActionType =
  | 'care_plan_call_patient'
  | 'ehr_update_patient'
  | 'ehr_request_referral_pcp'
  | 'ehr_request_medication_pcp'
  | 'care_plan_send_patient'
  | 'ehr_message_pcp'
  | 'ehr_escalate_task_ma';

export interface TimelineEvent {
  type: EventType;
  timestamp: string;
  description: string;
}

export interface CarePlanSuggestion {
  text: string;
  accepted: boolean;
}

export interface CarePlanSnapshot {
  created_at: string;
  text_block: string;
  requiresRevision: boolean;
  flags: string[];
  suggestions: string[];
}

export interface ActionActivityLog {
  description: string;
  timestamp: string;
}

export interface Action {
  id: string;
  patient_id: string;
  type: string;
  description: string;
  status: ActionStatus;
  created_at: string;
  updated_at: string;
  activity_log: ActivityLogEntry[];
}

export interface Patient {
  name: string;
  conditions: string[];
  timeline: Record<string, TimelineEvent>;
  care_plan_snapshots: Record<string, CarePlanSnapshot>;
  actions: Record<string, Action>;
  hcpcs_code: 'G0556' | 'G0557' | 'G0558';
}

export interface UserSession {
  user_id: string;
  date_created: string;
}

export interface ActivityLogEntry {
  timestamp: string;
  action: string;
  details: string;
  description: string;
} 