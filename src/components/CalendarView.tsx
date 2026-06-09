import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Link, CheckCircle, Loader2, RefreshCw, Sparkles, 
  Clock, MapPin, Check, X
} from 'lucide-react';
import { calendarService } from '../services/calendarService';
import type { CalendarMeeting } from '../services/calendarService';
import { useTranslation } from '../i18n';

interface CalendarViewProps {
  onExpandContact: (contact: any) => void;
  appContacts: any[];
}

export default function CalendarView({ onExpandContact, appContacts }: CalendarViewProps) {
  const { t } = useTranslation();
  
  const [status, setStatus] = useState<any>(null);
  const [meetings, setMeetings] = useState<CalendarMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Connection form states
  const [provider, setProvider] = useState<'apple' | 'google'>('apple');
  const [webcalUrl, setWebcalUrl] = useState('');
  
  // Selected meeting for briefing detail popup
  const [selectedMeeting, setSelectedMeeting] = useState<CalendarMeeting | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchStatusAndMeetings = async () => {
    setLoading(true);
    try {
      const statusData = await calendarService.getStatus();
      setStatus(statusData);
      if (statusData.connected) {
        const meetingsData = await calendarService.getMeetings();
        setMeetings(meetingsData);
      } else {
        setMeetings([]);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndMeetings();

    // Check URL parameters for successful connection redirects
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'google') {
      showToast(t('calendar.googleConnected') || 'Google Calendar conectado');
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchStatusAndMeetings();
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (provider === 'apple' && !webcalUrl.trim()) return;

    if (provider === 'google') {
      // Redirect to Google OAuth2 Flow
      window.location.href = calendarService.getGoogleAuthUrl();
      return;
    }

    // Connect Apple Webcal
    setSyncing(true);
    try {
      await calendarService.saveConfig('apple', webcalUrl.trim());
      showToast(t('calendar.appleConnected') || 'Calendario Apple conectado');
      setShowConfig(false);
      await fetchStatusAndMeetings();
    } catch (err: any) {
      alert(err.message || 'Error connecting Apple Calendar');
    } finally {
      setSyncing(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await calendarService.sync();
      showToast(t('calendar.syncSuccess') || 'Sincronización completada');
      await fetchStatusAndMeetings();
    } catch (err: any) {
      alert(err.message || 'Error syncing calendar');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm(t('calendar.confirmDisconnect') || '¿Estás seguro de desconectar el calendario?')) return;
    setSyncing(true);
    try {
      await calendarService.disconnect();
      showToast(t('calendar.disconnected') || 'Calendario desconectado');
      await fetchStatusAndMeetings();
    } catch (err: any) {
      alert(err.message || 'Error disconnecting');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 h-full flex flex-col space-y-6 relative overflow-hidden bg-black/40 backdrop-blur-xl pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-[300] bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-glow text-xs font-black uppercase tracking-wider flex items-center gap-3"
          >
            <CheckCircle size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center shrink-0 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Calendar className="text-primary" size={28} />
            {t('calendar.title') || 'Calendario Inteligente'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest font-semibold">
            {t('calendar.subtitle') || 'Sincroniza tus eventos y prepara reuniones con inteligencia de IA'}
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          {status?.connected && (
            <button 
              onClick={handleSync}
              disabled={syncing}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-wider hover:bg-white/10 transition-all"
            >
              {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {t('calendar.sync') || 'Sincronizar'}
            </button>
          )}
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-glow"
          >
            <Link size={14} />
            {status?.connected ? (t('calendar.manage') || 'Gestionar') : (t('calendar.connect') || 'Conectar')}
          </button>
        </div>
      </div>

      {/* Config Overlay/Drawer */}
      <AnimatePresence>
        {showConfig && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-zinc-900/90 border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl relative z-20"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-black uppercase tracking-wider text-white">
                {t('calendar.configTitle') || 'Configuración del Calendario'}
              </h4>
              <button onClick={() => setShowConfig(false)} className="text-zinc-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {status?.connected ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-zinc-950/50 border border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <p className="text-xs font-black text-white uppercase">{status.provider === 'google' ? 'Google Calendar' : 'Apple Calendar'}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {status.lastSyncedAt ? `${t('calendar.lastSynced') || 'Última sincronización'}: ${new Date(status.lastSyncedAt).toLocaleString()}` : ''}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleDisconnect}
                    className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-wider hover:bg-primary/20 transition-all"
                  >
                    {t('calendar.disconnect') || 'Desconectar'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setProvider('apple')}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                      provider === 'apple' ? 'border-primary bg-primary/5 text-white' : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:border-white/10'
                    }`}
                  >
                    <span className="text-xs font-black uppercase tracking-wider">Apple iCal (Webcal)</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setProvider('google')}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                      provider === 'google' ? 'border-primary bg-primary/5 text-white' : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:border-white/10'
                    }`}
                  >
                    <span className="text-xs font-black uppercase tracking-wider">Google Calendar</span>
                  </button>
                </div>

                {provider === 'apple' ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mono block">URL de suscripción (.ics o webcal://)</label>
                    <input 
                      type="url"
                      required
                      placeholder="webcal://calendar.icloud.com/..."
                      value={webcalUrl}
                      onChange={e => setWebcalUrl(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 text-xs text-zinc-400 leading-relaxed">
                    Serás redirigido a las páginas de Google para autorizar a <strong>The Core</strong> a leer tus eventos del calendario corporativo.
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={syncing}
                  className="w-full py-3.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-glow"
                >
                  {syncing && <Loader2 size={14} className="animate-spin" />}
                  {provider === 'google' ? 'Iniciar Autorización' : 'Guardar y Sincronizar'}
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="text-primary animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mono">Cargando eventos...</span>
          </div>
        ) : !status?.connected ? (
          <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl max-w-xl mx-auto flex flex-col items-center p-8 space-y-6 bg-zinc-950/20 backdrop-blur-md">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-zinc-500">
              <Calendar size={28} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Sin Calendario Conectado</h3>
              <p className="text-xs text-zinc-500 mt-2 max-w-md mx-auto leading-relaxed">
                Conecta tu cuenta de Google Calendar o Apple iCloud Calendar para importar automáticamente tus reuniones y programar rompehielos de IA antes de cada evento.
              </p>
            </div>
            <button 
              onClick={() => setShowConfig(true)}
              className="px-6 py-3 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-glow"
            >
              Conectar Ahora
            </button>
          </div>
        ) : meetings.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl max-w-xl mx-auto flex flex-col items-center p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-500">
              <Check size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Todo al día</h3>
              <p className="text-xs text-zinc-500 mt-1.5">
                No hay reuniones programadas para los próximos días en tu calendario.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            {/* Meetings Checklist */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mono flex items-center gap-2">
                Próximas Reuniones 
                <span className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-black text-zinc-400 mono">{meetings.length}</span>
              </h3>

              <div className="space-y-3">
                {meetings.map((meeting) => {
                  const hasBriefings = meeting.attendees.some(a => a.aiIcebreaker);
                  
                  return (
                    <div 
                      key={meeting.id}
                      onClick={() => setSelectedMeeting(meeting)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-start ${
                        selectedMeeting?.id === meeting.id 
                          ? 'bg-zinc-900 border-primary shadow-glow-sm' 
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                      }`}
                    >
                      <div className="space-y-3 min-w-0 flex-1 pr-4">
                        <div>
                          <h4 className="font-bold text-sm text-white truncate">{meeting.title}</h4>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5">
                            <span className="text-[10px] text-zinc-500 mono flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(meeting.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(meeting.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {meeting.location && (
                              <span className="text-[10px] text-zinc-500 truncate max-w-[150px] flex items-center gap-1">
                                <MapPin size={10} />
                                {meeting.location}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Attendees List */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {meeting.attendees.map((attendee) => (
                            <span 
                              key={attendee.id}
                              className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-zinc-400 font-semibold"
                            >
                              {attendee.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {hasBriefings && (
                        <div className="w-7 h-7 rounded-full bg-copper/10 border border-copper/20 flex items-center justify-center shrink-0">
                          <Sparkles size={12} className="text-copper" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Briefing Detail Panel */}
            <div className="relative">
              {/* Mobile Drawer (Only visible on mobile) */}
              <AnimatePresence>
                {selectedMeeting && (
                  <div className="block lg:hidden">
                    {/* Backdrop */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[150] backdrop-blur-md bg-black/60"
                      onClick={() => setSelectedMeeting(null)}
                    />
                    {/* Drawer Content */}
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 250 }}
                      className="fixed bottom-0 left-0 right-0 z-[160] bg-zinc-950 border-t border-white/10 rounded-t-[2.5rem] p-6 space-y-6 max-h-[80vh] overflow-y-auto"
                    >
                      <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-2" onClick={() => setSelectedMeeting(null)} />
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-copper-light mono flex items-center gap-1.5">
                            <Sparkles size={11} className="text-copper" />
                            AI Pre-Meeting Prep
                          </span>
                          <h3 className="text-lg font-black text-white tracking-tight mt-1">{selectedMeeting.title}</h3>
                        </div>
                        <button 
                          onClick={() => setSelectedMeeting(null)} 
                          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* Synced Attendees Intelligence List */}
                      <div className="space-y-5 pb-8">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mono">Inteligencia de Participantes</h4>
                        
                        {selectedMeeting.attendees.map((attendee) => {
                          const matchedContact = appContacts.find(c => c.email === attendee.email || c.name.toLowerCase() === attendee.name.toLowerCase());
                          const icebreaker = attendee.aiIcebreaker || matchedContact?.aiIcebreaker || matchedContact?.intelligence?.icebreaker;
                          
                          return (
                            <div key={attendee.id} className="p-4 rounded-xl bg-zinc-950/40 border border-white/5 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-white">{attendee.name}</span>
                                    {matchedContact && (
                                      <button 
                                        onClick={() => {
                                          onExpandContact(matchedContact);
                                          setSelectedMeeting(null);
                                        }}
                                        className="text-[9px] font-black text-primary hover:underline uppercase mono tracking-wider"
                                      >
                                        Ver Expediente
                                      </button>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-zinc-500 mt-0.5 block">{attendee.role || 'Participante'} @ {attendee.company || 'Externo'}</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 mono">
                                  Score: {attendee.relationshipScore || matchedContact?.relationshipScore || 50}%
                                </span>
                              </div>

                              {icebreaker ? (
                                <div className="pt-2 border-t border-white/5 space-y-1.5">
                                  <span className="text-[8px] font-black text-copper uppercase tracking-wider mono block">Rompehielo sugerido</span>
                                  <p className="text-xs text-zinc-300 italic leading-relaxed">"{icebreaker}"</p>
                                </div>
                              ) : (
                                <p className="text-[10px] text-zinc-600 italic">No hay inteligencia cargada para este participante.</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Desktop view */}
              <div className="hidden lg:block">
                {selectedMeeting ? (
                  <motion.div 
                    key={selectedMeeting.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="premium-card p-6 space-y-6 sticky top-0"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-copper-light mono flex items-center gap-1.5">
                          <Sparkles size={11} className="text-copper" />
                          AI Pre-Meeting Prep
                        </span>
                        <h3 className="text-lg font-black text-white tracking-tight mt-1">{selectedMeeting.title}</h3>
                      </div>
                      <button 
                        onClick={() => setSelectedMeeting(null)} 
                        className="text-zinc-500 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {/* Synced Attendees Intelligence List */}
                    <div className="space-y-5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mono">Inteligencia de Participantes</h4>
                      
                      {selectedMeeting.attendees.map((attendee) => {
                        const matchedContact = appContacts.find(c => c.email === attendee.email || c.name.toLowerCase() === attendee.name.toLowerCase());
                        const icebreaker = attendee.aiIcebreaker || matchedContact?.aiIcebreaker || matchedContact?.intelligence?.icebreaker;
                        
                        return (
                          <div key={attendee.id} className="p-4 rounded-xl bg-zinc-950/40 border border-white/5 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-white">{attendee.name}</span>
                                  {matchedContact && (
                                    <button 
                                      onClick={() => onExpandContact(matchedContact)}
                                      className="text-[9px] font-black text-primary hover:underline uppercase mono tracking-wider"
                                    >
                                      Ver Expediente
                                    </button>
                                  )}
                                </div>
                                <span className="text-[10px] text-zinc-500 mt-0.5 block">{attendee.role || 'Participante'} @ {attendee.company || 'Externo'}</span>
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 mono">
                                Score: {attendee.relationshipScore || matchedContact?.relationshipScore || 50}%
                              </span>
                            </div>

                            {icebreaker ? (
                              <div className="pt-2 border-t border-white/5 space-y-1.5">
                                <span className="text-[8px] font-black text-copper uppercase tracking-wider mono block">Rompehielo sugerido</span>
                                <p className="text-xs text-zinc-300 italic leading-relaxed">"{icebreaker}"</p>
                              </div>
                            ) : (
                              <p className="text-[10px] text-zinc-600 italic">No hay inteligencia cargada para este participante.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-64 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-zinc-600">
                    <Sparkles size={24} className="opacity-20 mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Selecciona una reunión para ver el reporte de IA</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
