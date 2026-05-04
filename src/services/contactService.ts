// Contact type is defined in App.tsx - using any here for ESM compatibility

const ENGINE_URL = import.meta.env.VITE_CORE_ENGINE_URL || 'https://automatizaciones-the-core-engine.vz27dz.easypanel.host';
const API_URL = `${ENGINE_URL}/api/contacts`;

interface PendingAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  data?: Contact;
  timestamp: number;
}

const getQueue = (): PendingAction[] => {
  try {
    const data = localStorage.getItem('contact_sync_queue');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to parse sync queue', e);
    return [];
  }
};

const saveQueue = (queue: PendingAction[]) => {
  try {
    localStorage.setItem('contact_sync_queue', JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to save sync queue', e);
  }
};

export const contactService = {
  async getAll(): Promise<Contact[]> {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Offline');
      const data = await response.json();
      // Cache for offline view
      localStorage.setItem('core_contacts_cache', JSON.stringify(data));
      return data;
    } catch (error) {
      console.warn('Using offline cache');
      const cached = localStorage.getItem('core_contacts_cache');
      return cached ? JSON.parse(cached) : [];
    }
  },

  async create(contact: Contact): Promise<Contact> {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact)
      });
      if (!response.ok) throw new Error('Offline');
      return await response.json();
    } catch (error) {
      this.queueAction({ id: contact.id, type: 'create', data: contact, timestamp: Date.now() });
      return contact; // Optimistic return
    }
  },

  async update(id: string, contact: Contact): Promise<Contact> {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact)
      });
      if (!response.ok) throw new Error('Offline');
      return await response.json();
    } catch (error) {
      this.queueAction({ id, type: 'update', data: contact, timestamp: Date.now() });
      return contact;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Offline');
    } catch (error) {
      this.queueAction({ id, type: 'delete', timestamp: Date.now() });
    }
  },

  queueAction(action: PendingAction) {
    const queue = getQueue();
    // Avoid duplicates for the same ID
    const filtered = queue.filter(a => a.id !== action.id);
    saveQueue([...filtered, action]);
    this.syncOfflineData();
  },

  async syncOfflineData() {
    const queue = getQueue();
    if (queue.length === 0) return;

    console.log(`Attempting to sync ${queue.length} actions...`);
    const remaining: PendingAction[] = [];

    for (const action of queue) {
      try {
        if (action.type === 'create' && action.data) {
          await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.data)
          });
        } else if (action.type === 'update' && action.data) {
          await fetch(`${API_URL}/${action.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action.data)
          });
        } else if (action.type === 'delete') {
          await fetch(`${API_URL}/${action.id}`, {
            method: 'DELETE'
          });
        }
      } catch (e) {
        remaining.push(action);
      }
    }

    saveQueue(remaining);
  }
};


// Synchronization is now handled by the main application to ensure safe initialization order.
