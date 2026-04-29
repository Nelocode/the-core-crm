/**
 * n8n Integration Service for The Core
 * Handles AI Enrichment and Business Card OCR via n8n Webhooks
 */

export interface ScanCardResult {
  name?: string;
  role?: string;
  company?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface InvestigateResult {
  location?: string;
  hobbies?: string[];
  notes?: string;
  relationshipScore?: number;
}

const SCAN_URL = import.meta.env.VITE_N8N_SCAN_CARD_URL;
const INVESTIGATE_URL = import.meta.env.VITE_N8N_INVESTIGATE_URL;

export const n8nService = {
  /**
   * Sends a base64 image to n8n for OCR processing
   */
  async scanBusinessCard(base64Image: string): Promise<ScanCardResult> {
    if (!SCAN_URL) {
      throw new Error('CONFIG_MISSING');
    }

    try {
      const base64Data = base64Image.split(',')[1] || base64Image;
      const response = await fetch(SCAN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data })
      });
      
      if (!response.ok) throw new Error('n8n scan request failed');
      return await response.json();
    } catch (error) {
      console.error('Error scanning card with n8n:', error);
      throw error;
    }
  },

  /**
   * Sends contact name/company to n8n for deep search enrichment
   */
  async investigateContact(name: string, company?: string): Promise<InvestigateResult> {
    if (!INVESTIGATE_URL) {
      console.warn('n8n Investigate URL not configured, returning simulation data.');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {
        location: 'New York, NY (Simulated)',
        hobbies: ['Polo', 'Digital Art'],
        notes: 'Expanding market reach in EMEA through strategic acquisitions.'
      };
    }

    try {
      const response = await fetch(INVESTIGATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company })
      });
      
      if (!response.ok) throw new Error('n8n investigation request failed');
      return await response.json();
    } catch (error) {
      console.error('Error investigating with n8n:', error);
      throw error;
    }
  }
};
