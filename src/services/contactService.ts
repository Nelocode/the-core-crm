// contactService.ts — Robust Persistence Layer for The Core CRM
// 3-layer defense: fetch timeout + retry → server SQLite → localStorage queue

const ENGINE_URL = import.meta.env.VITE_CORE_ENGINE_URL || 'https://automatizaciones-the-core-engine.vz27dz.easypanel.host';
const API_URL = `${ENGINE_URL}/api/contacts`;
const INTERACTIONS_URL = `${ENGINE_URL}/api/interactions`;
const NOTES_URL = `${ENGINE_URL}/api/notes`;
const TAGS_URL = `${ENGINE_URL}/api/tags`;

const CACHE_KEY = 'core_contacts_v2';
const QUEUE_KEY = 'core_sync_queue_v2';
const CACHE_VERSION = 2;

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingAction {
  id: string;             // contact ID
  opId: string;           // unique operation ID (prevents dedup of different ops)
  type: 'create' | 'update' | 'delete';
  data?: any;
  timestamp: number;
  retries: number;
}

interface CacheEntry {
  version: number;
  data: any[];
  savedAt: number;
}

// ─── Storage Helpers ─────────────────────────────────────────────────────────

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const readQueue = (): PendingAction[] => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeQueue = (queue: PendingAction[]): void => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    // Dispatch event so App.tsx can update the pending count badge
    window.dispatchEvent(new CustomEvent('core:queue-update', { detail: { count: queue.length } }));
  } catch (e) {
    console.error('[Core] Failed to write sync queue:', e);
  }
};

const readCache = (): any[] => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const entry: CacheEntry = JSON.parse(raw);
    // Invalidate stale cache from old schema versions
    if (entry.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return [];
    }
    return entry.data;
  } catch {
    return [];
  }
};

const writeCache = (data: any[]): void => {
  try {
    const entry: CacheEntry = { version: CACHE_VERSION, data, savedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (e) {
    console.warn('[Core] Cache write failed (storage full?):', e);
  }
};

// ─── Network Helpers ──────────────────────────────────────────────────────────

const fetchWithTimeout = (url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

const fetchWithRetry = async (url: string, options: RequestInit, retries = 3): Promise<Response> => {
  const delays = [0, 2000, 5000];
  for (let i = 0; i < retries; i++) {
    if (delays[i] > 0) await new Promise(r => setTimeout(r, delays[i]));
    try {
      const res = await fetchWithTimeout(url, options);
      if (res.ok) return res;
      // 4xx errors are final — don't retry
      if (res.status >= 400 && res.status < 500) throw new Error(`HTTP ${res.status}`);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw new Error('Request timed out');
      if (i === retries - 1) throw err;
    }
  }
  throw new Error('Max retries exceeded');
};

// ─── Queue Management ─────────────────────────────────────────────────────────

/**
 * Add operation to queue preserving correct ordering:
 * - If there's a pending CREATE for this contact, UPDATE merges into it
 * - DELETE cancels any pending CREATE (no point syncing what we'll delete)
 * - Multiple UPDATEs for the same contact collapse into the latest one
 */
const enqueue = (action: Omit<PendingAction, 'opId' | 'retries'>): void => {
  const queue = readQueue();
  const existingCreate = queue.find(a => a.id === action.id && a.type === 'create');

  if (action.type === 'delete' && existingCreate) {
    // Contact was never synced — remove from queue entirely, nothing to do on server
    writeQueue(queue.filter(a => a.id !== action.id));
    return;
  }

  if (action.type === 'update' && existingCreate) {
    // Merge update data into the pending create — update the create's data
    const updated = queue.map(a =>
      a.id === action.id && a.type === 'create'
        ? { ...a, data: action.data, timestamp: action.timestamp }
        : a
    );
    writeQueue(updated);
    return;
  }

  if (action.type === 'update') {
    // Replace any existing pending update for same contact with the latest
    const filtered = queue.filter(a => !(a.id === action.id && a.type === 'update'));
    writeQueue([...filtered, { ...action, opId: generateId(), retries: 0 }]);
    return;
  }

  writeQueue([...queue, { ...action, opId: generateId(), retries: 0 }]);
};

// ─── Sync Engine ──────────────────────────────────────────────────────────────

let isSyncing = false;

const syncQueue = async (): Promise<void> => {
  if (isSyncing) return;
  const queue = readQueue();
  if (queue.length === 0) return;

  isSyncing = true;
  console.log(`[Core] Syncing ${queue.length} pending operation(s)...`);

  const remaining: PendingAction[] = [];

  for (const action of queue) {
    try {
      if (action.type === 'create' && action.data) {
        await fetchWithTimeout(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data)
        });
      } else if (action.type === 'update' && action.data) {
        await fetchWithTimeout(`${API_URL}/${action.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action.data)
        });
      } else if (action.type === 'delete') {
        await fetchWithTimeout(`${API_URL}/${action.id}`, { method: 'DELETE' });
      }
      console.log(`[Core] ✓ Synced ${action.type} for contact ${action.id}`);
    } catch (e) {
      const updated = { ...action, retries: (action.retries || 0) + 1 };
      // Drop after 10 failed retries (something is seriously wrong)
      if (updated.retries < 10) {
        remaining.push(updated);
      } else {
        console.error(`[Core] ✗ Dropping action after 10 retries:`, action);
      }
    }
  }

  writeQueue(remaining);
  isSyncing = false;

  if (remaining.length > 0) {
    console.warn(`[Core] ${remaining.length} operation(s) still pending.`);
  } else {
    console.log('[Core] ✓ All operations synced successfully.');
  }
};

// Auto-sync when browser comes back online
window.addEventListener('online', () => {
  console.log('[Core] Back online — triggering sync...');
  syncQueue();
});

// ─── Public API ───────────────────────────────────────────────────────────────

export const contactService = {
  /**
   * Returns contacts: shows cache immediately, then refreshes from server.
   * If server is unreachable, returns cached data without throwing.
   */
  async getAll(): Promise<any[]> {
    // Always try to sync pending ops first
    syncQueue();

    try {
      const res = await fetchWithTimeout(API_URL, {}, 8000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      writeCache(data);
      return data;
    } catch (error) {
      console.warn('[Core] Server unreachable, using cache:', error);
      return readCache();
    }
  },

  /**
   * Creates a contact. Optimistic: returns immediately, syncs in background.
   * Queues for retry if server is down.
   */
  async create(contact: any): Promise<any> {
    // Optimistically update cache
    const current = readCache();
    writeCache([contact, ...current]);

    try {
      const res = await fetchWithRetry(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact)
      });
      const saved = await res.json();
      // Update cache with server-confirmed version
      const updated = readCache().map(c => c.id === contact.id ? saved : c);
      writeCache(updated);
      console.log('[Core] ✓ Contact created on server:', saved.id);
      return saved;
    } catch (error) {
      console.warn('[Core] Server down — queued create for contact:', contact.id);
      enqueue({ id: contact.id, type: 'create', data: contact, timestamp: Date.now() });
      return contact; // Optimistic return
    }
  },

  /**
   * Updates a contact. Always tries server first with retry.
   * Falls back to queue if server is unreachable.
   */
  async update(id: string, contact: any): Promise<any> {
    // Optimistically update cache
    const current = readCache();
    writeCache(current.map(c => c.id === id ? contact : c));

    try {
      const res = await fetchWithRetry(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact)
      });
      const saved = await res.json();
      const updated = readCache().map(c => c.id === id ? saved : c);
      writeCache(updated);
      console.log('[Core] ✓ Contact updated on server:', id);
      return saved;
    } catch (error) {
      console.warn('[Core] Server down — queued update for contact:', id);
      enqueue({ id, type: 'update', data: contact, timestamp: Date.now() });
      return contact;
    }
  },

  /**
   * Deletes a contact. Optimistic: removes from cache immediately.
   */
  async delete(id: string): Promise<void> {
    // Optimistically remove from cache
    const current = readCache();
    writeCache(current.filter(c => c.id !== id));

    try {
      await fetchWithRetry(`${API_URL}/${id}`, { method: 'DELETE' });
      console.log('[Core] ✓ Contact deleted on server:', id);
    } catch (error) {
      console.warn('[Core] Server down — queued delete for contact:', id);
      enqueue({ id, type: 'delete', timestamp: Date.now() });
    }
  },

  /**
   * Manually trigger sync (e.g., from a UI "Retry" button).
   */
  async syncNow(): Promise<void> {
    return syncQueue();
  },

  /**
   * Returns how many operations are waiting to sync.
   */
  getPendingCount(): number {
    return readQueue().length;
  },

  // ─── Interaction API ──────────────────────────────────────────────────────

  /**
   * Log a new interaction for a contact.
   * The backend auto-recalculates the relationship score.
   */
  async addInteraction(contactId: string, data: {
    type: string;
    date: string;
    summary: string;
    sentiment?: string;
    duration?: number;
    location?: string;
    isRemote?: boolean;
    followUpDue?: string;
    outcome?: string;
  }): Promise<any> {
    const res = await fetchWithRetry(`${INTERACTIONS_URL}/contact/${contactId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  /** Delete an interaction by ID */
  async deleteInteraction(id: string): Promise<void> {
    await fetchWithTimeout(`${INTERACTIONS_URL}/${id}`, { method: 'DELETE' });
  },

  /** Mark a follow-up as done */
  async markFollowUpDone(id: string): Promise<any> {
    const res = await fetchWithTimeout(`${INTERACTIONS_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followUpDone: true })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  // ─── Notes API ────────────────────────────────────────────────────────────

  /** Create a note for a contact */
  async addNote(contactId: string, content: string, isPinned = false): Promise<any> {
    const res = await fetchWithRetry(`${NOTES_URL}/contact/${contactId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, isPinned })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  /** Update note content or pin state */
  async updateNote(id: string, data: { content?: string; isPinned?: boolean }): Promise<any> {
    const res = await fetchWithTimeout(`${NOTES_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  /** Delete a note */
  async deleteNote(id: string): Promise<void> {
    await fetchWithTimeout(`${NOTES_URL}/${id}`, { method: 'DELETE' });
  },

  // ─── Tags API ─────────────────────────────────────────────────────────────

  /** Assign a tag to a contact by IDs */
  async assignTag(tagId: string, contactId: string): Promise<any> {
    const res = await fetchWithTimeout(`${TAGS_URL}/${tagId}/contacts/${contactId}`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  /** Remove a tag from a contact */
  async removeTag(tagId: string, contactId: string): Promise<void> {
    await fetchWithTimeout(`${TAGS_URL}/${tagId}/contacts/${contactId}`, { method: 'DELETE' });
  },

  /** Get or create a tag by name and color */
  async upsertTag(name: string, color?: string): Promise<any> {
    const res = await fetchWithRetry(TAGS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },

  /** Fetch all available tags */
  async getTags(): Promise<any[]> {
    const res = await fetchWithTimeout(TAGS_URL, {}, 5000);
    if (!res.ok) return [];
    return res.json();
  },

  // ─── Contact Detail ───────────────────────────────────────────────────────

  /** Fetch a fully hydrated contact (all interactions, notes, tags, org) */
  async getDetail(id: string): Promise<any> {
    const res = await fetchWithTimeout(`${API_URL}/${id}`, {}, 8000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
};
