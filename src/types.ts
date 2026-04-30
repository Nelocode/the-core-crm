export type InteractionType = 'meeting' | 'call' | 'email' | 'event' | 'note';

export interface Interaction {
  id: string;
  date: string;
  type: InteractionType;
  summary: string;
  location?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface CaptureMetadata {
  capturedAt: string; // ISO date
  latitude?: number;
  longitude?: number;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  email: string;
  phone?: string;
  location: string;
  family?: {
    spouse?: string;
    children?: string[];
  };
  hobbies: string[];
  interactions: Interaction[];
  relationshipScore: number; // 0-100
  notes: string;
  avatar?: string;
  captureMetadata?: CaptureMetadata;
}

export type MeetingStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees: string[]; // Contact IDs
  location: string;
  description: string;
  status: MeetingStatus;
}

export interface AIBriefing {
  contactId: string;
  icebreaker: string;
  strategicContext: string;
  emotionalPulse: 'positive' | 'neutral' | 'negative' | 'critical';
}

