const fs = require('fs');
const path = require('path');
const https = require('https');

const csvFilePath = '/Users/i2carvajal/Documents/Proyectos/The Core/CRM_Master_IanHarris - CRM Master.csv';

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

try {
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

  // Map header indexes
  const colIndex = (name) => headers.indexOf(name);
  
  const nameIdx = colIndex('Nombre Completo');
  const roleIdx = colIndex('Cargo');
  const companyIdx = colIndex('Empresa');
  const websiteIdx = colIndex('Sitio Web');
  const emailIdx = colIndex('Email');
  const phoneIdx = colIndex('Teléfono');
  const cityIdx = colIndex('Ciudad');
  const countryIdx = colIndex('País');
  const notesIdx = colIndex('Notas');
  const sourceIdx = colIndex('Fuente de Contacto');
  const linkedinIdx = colIndex('LinkedIn');

  const contacts = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Name is required
    const name = nameIdx !== -1 ? row[nameIdx] : '';
    if (!name || !name.trim()) continue;

    const locationParts = [];
    if (cityIdx !== -1 && row[cityIdx]) locationParts.push(row[cityIdx]);
    if (countryIdx !== -1 && row[countryIdx]) locationParts.push(row[countryIdx]);
    
    contacts.push({
      name: name.trim(),
      role: roleIdx !== -1 ? row[roleIdx] : null,
      company: companyIdx !== -1 ? row[companyIdx] : null,
      website: websiteIdx !== -1 ? row[websiteIdx] : null,
      email: emailIdx !== -1 ? row[emailIdx] : null,
      phone: phoneIdx !== -1 ? row[phoneIdx] : null,
      location: locationParts.length > 0 ? locationParts.join(', ') : null,
      notes: notesIdx !== -1 ? row[notesIdx] : null,
      captureSource: sourceIdx !== -1 && row[sourceIdx] ? row[sourceIdx] : 'import',
      linkedin: linkedinIdx !== -1 ? row[linkedinIdx] : null,
      relationshipScore: 50 // default score
    });
  }

  console.log(`Mapped ${contacts.length} valid contacts to import.`);

  // Send request in chunks of 50 to prevent payload timeout or DB locks on production SQLite
  const chunkSize = 50;
  let successCount = 0;
  let failedCount = 0;
  
  async function sendChunk(index) {
    if (index >= contacts.length) {
      console.log('Import processing finished!');
      console.log(`Summary: Imported: ${successCount}, Failed: ${failedCount}`);
      return;
    }

    const chunk = contacts.slice(index, index + chunkSize);
    console.log(`Sending chunk of ${chunk.length} contacts (${index} to ${index + chunk.length})...`);
    
    const payload = JSON.stringify({ contacts: chunk });

    const reqOptions = {
      hostname: 'automatizaciones-the-core-engine.vz27dz.easypanel.host',
      port: 443,
      path: '/api/contacts/batch',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(reqOptions, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const resObj = JSON.parse(body);
          successCount += resObj.importedCount || 0;
          failedCount += resObj.failedCount || 0;
          console.log(`Chunk response: Imported: ${resObj.importedCount}, Failed: ${resObj.failedCount}`);
          if (resObj.failures && resObj.failures.length > 0) {
            console.log('Some failures in chunk:', resObj.failures.slice(0, 5));
          }
        } catch (e) {
          console.error('Failed to parse chunk response body:', body);
          failedCount += chunk.length;
        }
        
        // Process next chunk
        setTimeout(() => {
          sendChunk(index + chunkSize);
        }, 300); // 300ms delay between chunks to be gentle with SQLite
      });
    });

    req.on('error', (e) => {
      console.error(`Problem with request in chunk starting at ${index}:`, e.message);
      failedCount += chunk.length;
      setTimeout(() => {
        sendChunk(index + chunkSize);
      }, 500);
    });

    req.write(payload);
    req.end();
  }

  // Start sending
  sendChunk(0);

} catch (err) {
  console.error('Critical failure running import script:', err);
}
