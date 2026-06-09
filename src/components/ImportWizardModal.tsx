import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Table, AlertTriangle, CheckCircle, ChevronRight, Loader2, ArrowRight } from 'lucide-react';
import { useTranslation } from '../i18n';

interface ImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

const CRM_FIELDS = [
  { key: 'name', required: true, synonyms: ['nombre', 'name', 'full name', 'fullname', 'nombre completo'] },
  { key: 'email', required: false, synonyms: ['email', 'correo', 'mail', 'email address', 'e-mail'] },
  { key: 'phone', required: false, synonyms: ['phone', 'telefono', 'teléfono', 'celular', 'mobile', 'phone number'] },
  { key: 'company', required: false, synonyms: ['company', 'empresa', 'compania', 'organización', 'organization', 'institution', 'workplace'] },
  { key: 'role', required: false, synonyms: ['role', 'cargo', 'puesto', 'title', 'job title', 'position'] },
  { key: 'department', required: false, synonyms: ['department', 'departamento', 'area', 'área'] },
  { key: 'location', required: false, synonyms: ['location', 'ubicacion', 'ciudad', 'country', 'city', 'address'] },
  { key: 'linkedin', required: false, synonyms: ['linkedin', 'linkedin url', 'linkedin profile'] },
  { key: 'twitter', required: false, synonyms: ['twitter', 'x', 'twitter url'] },
  { key: 'notes', required: false, synonyms: ['notes', 'notas', 'comentarios', 'comments', 'description', 'descripcion'] },
  { key: 'hobbies', required: false, synonyms: ['hobbies', 'intereses', 'interests', 'hobbies & interests'] },
  { key: 'relationshipScore', required: false, synonyms: ['relationship score', 'score', 'relacion', 'puntaje'] }
];

export default function ImportWizardModal({ isOpen, onClose, onImportSuccess }: ImportWizardModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dragOver, setDragOver] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Field mappings: { [crmFieldKey]: csvHeaderIndex }
  const [fieldMappings, setFieldMappings] = useState<Record<string, number>>({});
  
  // Results
  const [importResults, setImportResults] = useState<{
    success: boolean;
    importedCount: number;
    failedCount: number;
    failures: { name: string; error: string }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Robust RFC-4180 compliant CSV parser
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
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
  };

  const handleTextParse = (text: string) => {
    try {
      const parsed = parseCSV(text);
      if (parsed.length < 2) {
        throw new Error(t('importWizard.validation.invalidFile'));
      }
      
      const headers = parsed[0];
      const rows = parsed.slice(1);
      
      setCsvHeaders(headers);
      setCsvRows(rows);
      
      // Auto-mapping logic based on synonyms
      const initialMappings: Record<string, number> = {};
      CRM_FIELDS.forEach(field => {
        const matchedIndex = headers.findIndex(h => {
          const cleanH = h.toLowerCase().trim();
          return field.synonyms.some(syn => cleanH === syn || cleanH.includes(syn));
        });
        if (matchedIndex !== -1) {
          initialMappings[field.key] = matchedIndex;
        }
      });
      
      setFieldMappings(initialMappings);
      setErrorMsg('');
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || t('importWizard.readError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setErrorMsg('');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleTextParse(text);
    };
    reader.onerror = () => {
      setErrorMsg(t('importWizard.readError'));
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleGoogleSheetsImport = async () => {
    if (!googleSheetsUrl.trim()) return;
    
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      // Extract Google Sheet ID
      const match = googleSheetsUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        throw new Error(t('importWizard.invalidLink'));
      }
      
      const spreadsheetId = match[1];
      const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
      
      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error(t('importWizard.invalidLink'));
      }
      
      const text = await response.text();
      handleTextParse(text);
    } catch (err: any) {
      setErrorMsg(err.message || t('importWizard.dbConnectError'));
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      setIsLoading(true);
      setErrorMsg('');
      const reader = new FileReader();
      reader.onload = (event) => {
        handleTextParse(event.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      setErrorMsg(t('importWizard.validation.onlyCsv'));
    }
  };

  const handleMappingChange = (crmKey: string, headerIndexStr: string) => {
    const val = headerIndexStr === '' ? -1 : parseInt(headerIndexStr, 10);
    setFieldMappings(prev => {
      const updated = { ...prev };
      if (val === -1) {
        delete updated[crmKey];
      } else {
        updated[crmKey] = val;
      }
      return updated;
    });
  };

  const executeImport = async () => {
    // Validate required fields (only name is required)
    if (fieldMappings['name'] === undefined) {
      setErrorMsg(t('importWizard.validation.nameRequired'));
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      // Map rows to contacts objects
      const contactsToImport = csvRows.map(row => {
        const contact: Record<string, any> = {};
        
        CRM_FIELDS.forEach(field => {
          const colIndex = fieldMappings[field.key];
          if (colIndex !== undefined && colIndex !== null && colIndex < row.length) {
            contact[field.key] = row[colIndex];
          }
        });
        
        return contact;
      });

      const response = await fetch(`${import.meta.env.VITE_CORE_ENGINE_URL || 'http://localhost:3001'}/api/contacts/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: contactsToImport })
      });
      
      if (!response.ok) {
        throw new Error(t('importWizard.dbConnectError'));
      }
      
      const results = await response.json();
      setImportResults(results);
      setStep(3);
      onImportSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || t('importWizard.validation.importFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md"
      />
      
      {/* Modal Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="premium-card w-full h-full sm:h-auto sm:max-h-[85vh] max-w-4xl bg-zinc-950 border-0 sm:border border-white/10 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col"
      >
        {/* Header */}
        <header className="px-6 pt-[calc(1.25rem+env(safe-area-inset-top))] sm:pt-5 pb-5 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Table className="text-primary w-6 h-6" />
            <div>
              <h3 className="text-xl font-black text-white tracking-tight uppercase">{t('importWizard.title')}</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{t('importWizard.subtitle')}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        {/* Step Indicator */}
        <div className="bg-white/5 border-b border-white/5 px-8 py-3 flex items-center justify-center gap-8 text-[11px] font-black uppercase tracking-widest text-zinc-500">
          <span className={`${step === 1 ? 'text-primary' : 'text-zinc-400'}`}>{t('importWizard.stepSource')}</span>
          <ChevronRight size={12} className="text-zinc-700" />
          <span className={`${step === 2 ? 'text-primary' : 'text-zinc-500'}`}>{t('importWizard.stepMapping')}</span>
          <ChevronRight size={12} className="text-zinc-700" />
          <span className={`${step === 3 ? 'text-primary' : 'text-zinc-500'}`}>{t('importWizard.stepPreview')}</span>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
          {errorMsg && (
            <div className="bg-primary/10 border border-primary/20 text-red-400 px-4 py-3 rounded-2xl mb-6 flex items-start gap-3">
              <AlertTriangle className="shrink-0 mt-0.5" size={18} />
              <p className="text-xs font-semibold leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {/* STEP 1: Choose Source */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* File Dropzone */}
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    dragOver ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-white/20 bg-white/2'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".csv" 
                    className="hidden" 
                  />
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                    <Upload size={28} />
                  </div>
                  <h4 className="text-md font-bold text-white mb-2">{t('importWizard.importCsv')}</h4>
                  <p className="text-xs text-zinc-500 max-w-[280px]">{t('importWizard.dragCsvDesc')}</p>
                </div>

                {/* Google Sheets Input */}
                <div className="border border-white/10 bg-white/2 rounded-3xl p-8 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="text-md font-bold text-white">{t('importWizard.syncSheets')}</h4>
                    <p className="text-xs text-zinc-500">
                      {t('importWizard.googleSheetsDesc')}
                    </p>
                    <input 
                      type="url"
                      placeholder={t('importWizard.sheetUrlPlaceholder')}
                      value={googleSheetsUrl}
                      onChange={e => setGoogleSheetsUrl(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-2xl px-4 py-3.5 text-xs text-white focus:outline-none transition-all"
                    />
                  </div>
                  <button 
                    onClick={handleGoogleSheetsImport}
                    disabled={!googleSheetsUrl.trim() || isLoading}
                    className="mt-6 bg-white/5 border border-white/10 hover:border-white/20 text-white py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] w-full flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={14} /> : t('importWizard.connectSheet')}
                  </button>
                </div>
              </div>

              {isLoading && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <Loader2 className="animate-spin text-primary w-8 h-8" />
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{t('importWizard.readingData')}</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Map Columns */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-white/2 border border-white/5 rounded-3xl p-5 mb-4">
                <h4 className="text-sm font-bold text-white mb-1">{t('importWizard.attributeMapping')}</h4>
                <p className="text-xs text-zinc-500">{t('importWizard.mappingDesc')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CRM_FIELDS.map(field => {
                  const mappedHeaderIndex = fieldMappings[field.key];
                  const fieldLabel = t('importWizard.fields.' + field.key);
                  return (
                    <div key={field.key} className="flex items-center justify-between bg-zinc-900 border border-white/5 rounded-2xl p-4 gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          {fieldLabel}
                          {field.required && <span className="text-primary font-bold">*</span>}
                        </p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-0.5">{t('importWizard.mappingField')}</p>
                      </div>
                      
                      <select 
                        value={mappedHeaderIndex !== undefined ? mappedHeaderIndex : ''}
                        onChange={e => handleMappingChange(field.key, e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                      >
                        <option value="">{t('importWizard.ignore')}</option>
                        {csvHeaders.map((header, idx) => (
                          <option key={idx} value={idx}>{header}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              {/* Data Preview */}
              <div className="mt-8 border border-white/5 rounded-3xl overflow-hidden bg-white/2">
                <div className="bg-white/5 px-6 py-4 border-b border-white/5">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">{t('importWizard.dataPreview')}</p>
                </div>
                <div className="overflow-x-auto max-w-full">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-white/2 border-b border-white/5">
                        {CRM_FIELDS.map(field => {
                          const idx = fieldMappings[field.key];
                          if (idx === undefined) return null;
                          const fieldLabel = t('importWizard.fields.' + field.key);
                          return (
                            <th key={field.key} className="px-6 py-3 font-bold text-copper-light uppercase tracking-wider">
                              {fieldLabel.split(' ')[0]}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(0, 3).map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-white/5">
                          {CRM_FIELDS.map(field => {
                            const idx = fieldMappings[field.key];
                            if (idx === undefined) return null;
                            return (
                              <td key={field.key} className="px-6 py-4 text-zinc-300 font-medium truncate max-w-[150px]">
                                {row[idx] || <span className="text-zinc-600 italic">{t('importWizard.empty')}</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center mt-8 pt-4 border-t border-white/5">
                <button 
                  onClick={() => setStep(1)}
                  className="bg-white/5 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] cursor-pointer"
                >
                  {t('importWizard.back')}
                </button>
                <button 
                  onClick={executeImport}
                  disabled={isLoading || fieldMappings['name'] === undefined}
                  className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer glow-red disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={14} /> : t('importWizard.executeImport')}
                  {!isLoading && <ArrowRight size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Results */}
          {step === 3 && importResults && (
            <div className="flex flex-col items-center py-6 text-center space-y-6">
              {importResults.failedCount === 0 ? (
                <div className="w-20 h-20 bg-success/15 border border-success/35 text-success rounded-full flex items-center justify-center shadow-glow">
                  <CheckCircle size={38} />
                </div>
              ) : (
                <div className="w-20 h-20 bg-amber-500/15 border border-amber-500/35 text-amber-500 rounded-full flex items-center justify-center shadow-glow">
                  <AlertTriangle size={38} />
                </div>
              )}
              
              <div>
                <h4 className="text-2xl font-black text-white tracking-tight uppercase">{t('importWizard.importFinished')}</h4>
                <p className="text-xs text-zinc-500 mt-2 font-bold uppercase tracking-wider">{t('importWizard.batchResult')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="bg-white/2 border border-white/5 rounded-2xl p-4">
                  <p className="text-2xl font-black text-success">{importResults.importedCount}</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">{t('importWizard.imported')}</p>
                </div>
                <div className="bg-white/2 border border-white/5 rounded-2xl p-4">
                  <p className="text-2xl font-black text-primary">{importResults.failedCount}</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">{t('importWizard.failed')}</p>
                </div>
              </div>

              {importResults.failures.length > 0 && (
                <div className="w-full max-w-lg border border-white/5 rounded-2xl bg-zinc-950 text-left p-4 max-h-[200px] overflow-y-auto">
                  <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-3 text-primary flex items-center gap-1.5">
                    <AlertTriangle size={12} />
                    {t('importWizard.failures')} ({importResults.failures.length})
                  </p>
                  <div className="space-y-2 text-xs">
                    {importResults.failures.map((f, idx) => (
                      <div key={idx} className="flex justify-between items-start border-b border-white/2 pb-1.5 last:border-b-0">
                        <span className="font-bold text-white truncate max-w-[150px]">{f.name}</span>
                        <span className="text-zinc-500 text-[10px] leading-relaxed italic">{f.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={onClose}
                className="bg-white/5 border border-white/10 hover:border-white/20 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
              >
                {t('importWizard.closeWizard')}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
