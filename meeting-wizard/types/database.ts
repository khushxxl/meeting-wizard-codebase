export type MeetingStatus =
  | "scheduled"
  | "joining"
  | "recording"
  | "processing"
  | "ready"
  | "failed";

export interface Participant {
  name: string;
  email: string;
}

export interface TranscriptEntry {
  timestamp: string;
  speaker: string;
  text: string;
}

export interface ActionItem {
  id: string;
  text: string;
  owner: string;
  completed: boolean;
  due_date?: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Simplified database type. We use `any` for the generic param
// and rely on our own query layer types for safety.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
