export type Checkin = { id?: string; on_date: string; sleep: number; activity: number; stress: number; mood: string; source: 'manual'|'csv' };
export type Assessment = { id?: string; created_at: string; reaction_ms: number; memory_accuracy: number; false_starts: number; hours_awake?: number|null; sleepiness_score?: number|null; assessment_started_at?: string|null; utc_offset_minutes?: number|null; protocol_version?: string };
export type Voice = { id?: string; created_at: string; duration_ms: number; rms_mean: number };
export type Preferences = { storage_consent: boolean; ai_consent: boolean; voice_consent: boolean };
export type Dataset = { checkins: Checkin[]; assessments: Assessment[]; voices: Voice[]; preferences: Preferences; insights: {id:string;content:string;created_at:string}[]; aiAvailable: boolean; accountDeletionAvailable: boolean };
