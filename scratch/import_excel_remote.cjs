const fs = require('fs');
const path = require('path');
const https = require('https');

const csvFilePath = '/Users/i2carvajal/Documents/Proyectos/The Core/corporate_contacts_master.csv';
const remoteHost = 'automatizaciones-the-core-engine.vz27dz.easypanel.host';

// Helper to normalized text for comparison
function normalize(val) {
  if (!val) return "";
  return val.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Simple HTTP request wrapper for JSON APIs
function apiRequest(options, payload = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`API returned status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

// Robust CSV parser
function parseCSV(text) {
  const lines = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(cell.trim());
      lines.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  
  if (cell || row.length > 0) {
    row.push(cell.trim());
    lines.push(row);
  }
  
  return lines.filter(r => r.length > 0 && r.some(c => c !== ''));
}

async function run() {
  try {
    // 1. Fetch existing contacts from remote server to prevent duplicates
    console.log(`Fetching existing contacts from remote engine (${remoteHost})...`);
    let existingContacts = [];
    try {
      existingContacts = await apiRequest({
        hostname: remoteHost,
        port: 443,
        path: '/api/contacts',
        method: 'GET'
      });
      console.log(`Found ${existingContacts.length} contacts already on the remote database.`);
    } catch (e) {
      console.warn('Warning: Could not fetch existing contacts, proceeding without remote duplicate check:', e.message);
    }

    // Build a map of existing contacts for quick O(1) checks
    const existingMap = new Set();
    existingContacts.forEach(c => {
      const key = normalize(c.name) + '_' + normalize(c.company || '');
      existingMap.add(key);
      if (c.email) {
        existingMap.add(normalize(c.email));
      }
    });

    // 2. Read and parse CSV file
    console.log('Reading CSV file:', csvFilePath);
    const data = fs.readFileSync(csvFilePath, 'utf8');
    
    console.log('Parsing CSV...');
    const rows = parseCSV(data);
    if (rows.length < 2) {
      console.error('CSV lacks headers or data.');
      process.exit(1);
    }

    const headers = rows[0];
    console.log('Headers found:', headers);

    const colIndex = (name) => headers.indexOf(name);
    
    const emailIdx = colIndex('Email');
    const domainIdx = colIndex('Domain');
    const firstNameIdx = colIndex('First Name');
    const lastNameIdx = colIndex('Last Name');
    const companyIdx = colIndex('Company');
    const roleIdx = colIndex('Job Title');
    const phoneIdx = colIndex('Phone');
    const mobileIdx = colIndex('Mobile');
    const cityIdx = colIndex('City');
    const countryIdx = colIndex('Country');
    const sourceIdx = colIndex('Source');

    if (firstNameIdx === -1) {
      console.error("Error: 'First Name' column is mandatory.");
      process.exit(1);
    }

    const contacts = [];
    const localKeys = new Set();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length <= firstNameIdx) continue;

      const firstName = row[firstNameIdx]?.trim() || '';
      const lastName = lastNameIdx !== -1 ? row[lastNameIdx]?.trim() || '' : '';
      const name = `${firstName} ${lastName}`.trim();

      if (!name) continue;

      const email = emailIdx !== -1 ? row[emailIdx]?.trim() || null : null;
      const company = companyIdx !== -1 ? row[companyIdx]?.trim() || null : null;
      const role = roleIdx !== -1 ? row[roleIdx]?.trim() || null : null;
      const website = domainIdx !== -1 ? row[domainIdx]?.trim() || null : null;
      const phone = phoneIdx !== -1 ? row[phoneIdx]?.trim() || null : null;
      const mobile = mobileIdx !== -1 ? row[mobileIdx]?.trim() || null : null;
      
      const city = cityIdx !== -1 ? row[cityIdx]?.trim() || '' : '';
      const country = countryIdx !== -1 ? row[countryIdx]?.trim() || '' : '';
      const locationParts = [];
      if (city) locationParts.push(city);
      if (country) locationParts.push(country);
      const location = locationParts.length > 0 ? locationParts.join(', ') : null;
      
      const captureSource = sourceIdx !== -1 && row[sourceIdx] ? row[sourceIdx].trim() : 'import';

      // Duplicate Check 1: Check if already processed in this run
      const localKey = normalize(name) + '_' + normalize(company || '');
      if (localKeys.has(localKey)) {
        continue; // skip duplicate row in CSV
      }
      if (email && localKeys.has(normalize(email))) {
        continue; // skip duplicate email in CSV
      }

      // Duplicate Check 2: Check if already present on the remote server
      if (existingMap.has(localKey)) {
        continue; // skip, already exists on server by Name + Company
      }
      if (email && existingMap.has(normalize(email))) {
        continue; // skip, already exists on server by Email
      }

      // Add to local key trackers
      localKeys.add(localKey);
      if (email) {
        localKeys.add(normalize(email));
      }

      contacts.push({
        name,
        email,
        company,
        role,
        website,
        phone: phone || mobile,
        location,
        captureSource,
        relationshipScore: 50
      });
    }

    console.log(`Mapped ${contacts.length} UNIQUE contacts to import (after filtering duplicates and existing contacts).`);

    if (contacts.length === 0) {
      console.log('No new contacts to import. Everything is up to date.');
      return;
    }

    // 3. Send requests in chunks of 50
    const chunkSize = 50;
    let successCount = 0;
    let failedCount = 0;

    async function sendChunk(index) {
      if (index >= contacts.length) {
        console.log('--- Import completed successfully! ---');
        console.log(`Summary: Imported: ${successCount}, Failed: ${failedCount}`);
        return;
      }

      const chunk = contacts.slice(index, index + chunkSize);
      console.log(`Sending chunk of ${chunk.length} contacts (${index} to ${index + chunk.length})...`);
      
      const payload = JSON.stringify({ contacts: chunk });

      try {
        const resObj = await apiRequest({
          hostname: remoteHost,
          port: 443,
          path: '/api/contacts/batch',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        }, payload);

        successCount += resObj.importedCount || 0;
        failedCount += resObj.failedCount || 0;
        console.log(`Chunk response: Imported: ${resObj.importedCount}, Failed: ${resObj.failedCount}`);
        if (resObj.failures && resObj.failures.length > 0) {
          console.log('Some failures in chunk:', resObj.failures.slice(0, 5));
        }
      } catch (err) {
        console.error(`Problem with request in chunk starting at ${index}:`, err.message);
        failedCount += chunk.length;
      }

      // 300ms delay between chunks to avoid locking SQLite database in production
      setTimeout(() => {
        sendChunk(index + chunkSize);
      }, 300);
    }

    // Start chunked upload
    sendChunk(0);

  } catch (err) {
    console.error('Critical failure running import script:', err);
  }
}

run();
