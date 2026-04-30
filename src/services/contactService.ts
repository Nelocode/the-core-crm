import { Contact } from '../types';

const ENGINE_URL = import.meta.env.VITE_CORE_ENGINE_URL || 'https://automatizaciones-the-core-engine.vz27dz.easypanel.host';
const API_URL = `${ENGINE_URL}/api/contacts`;

export const contactService = {
  async getAll(): Promise<Contact[]> {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch contacts');
    return await response.json();
  },

  async create(contact: Contact): Promise<Contact> {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact)
    });
    if (!response.ok) throw new Error('Failed to create contact');
    return await response.json();
  },

  async update(id: string, contact: Contact): Promise<Contact> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact)
    });
    if (!response.ok) throw new Error('Failed to update contact');
    return await response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete contact');
  }
};
