// calendarService.ts — Service to communicate with the Backend Calendar Endpoints

const ENGINE_URL = import.meta.env.VITE_CORE_ENGINE_URL || 'https://automatizaciones-the-core-engine.vz27dz.easypanel.host';
const CALENDAR_URL = `${ENGINE_URL}/api/calendar`;

export interface CalendarStatus {
  connected: boolean;
  provider?: 'google' | 'apple';
  webcalUrl?: string;
  lastSyncedAt?: string;
}

export interface CalendarSyncResult {
  success: boolean;
  provider: 'google' | 'apple';
  totalEventsFound: number;
  meetingsSynced: number;
  contactsCreated: number;
  lastSyncedAt: string;
}

export interface CalendarAttendee {
  id: string;
  name: string;
  email: string;
  relationshipScore: number;
  role?: string;
  company?: string;
  aiIcebreaker?: string;
  personalNotes?: string;
}

export interface CalendarMeeting {
  id: string;
  title: string;
  startTime: string; // ISO date
  endTime: string;   // ISO date
  location?: string;
  description?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  attendees: CalendarAttendee[];
}

export const calendarService = {
  /** Get current calendar connection status */
  async getStatus(): Promise<CalendarStatus> {
    try {
      const res = await fetch(`${CALENDAR_URL}/status`);
      if (!res.ok) throw new Error('Failed to get calendar status');
      return await res.json();
    } catch (e) {
      console.error('[Calendar Service] getStatus error:', e);
      return { connected: false };
    }
  },

  /** Save connection configuration (Apple Calendar Webcal URL or Google init) */
  async saveConfig(provider: 'google' | 'apple', webcalUrl?: string): Promise<any> {
    const res = await fetch(`${CALENDAR_URL}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, webcalUrl })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to save calendar configuration');
    }
    return await res.json();
  },

  /** Trigger real synchronization */
  async sync(): Promise<CalendarSyncResult> {
    const res = await fetch(`${CALENDAR_URL}/sync`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to sync calendar');
    }
    return await res.json();
  },

  /** Fetch all synced meetings */
  async getMeetings(): Promise<CalendarMeeting[]> {
    try {
      const res = await fetch(`${CALENDAR_URL}/meetings`);
      if (!res.ok) throw new Error('Failed to fetch meetings');
      return await res.json();
    } catch (e) {
      console.error('[Calendar Service] getMeetings error:', e);
      return [];
    }
  },

  /** Disconnect current calendar */
  async disconnect(): Promise<void> {
    const res = await fetch(`${CALENDAR_URL}/config`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to disconnect calendar');
    }
  },

  /** Get Google auth login redirection URL */
  getGoogleAuthUrl(): string {
    return `${CALENDAR_URL}/auth`;
  }
};

