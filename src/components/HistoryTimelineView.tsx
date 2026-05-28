import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Calendar, Phone, Mail, FileText, 
  CheckSquare, Clock, MapPin, Globe,
  ChevronRight, MessageCircle, AlertCircle, History
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { contactService } from '../services/contactService';
import { useTranslation } from '../i18n';

interface ContactInfo {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  organization?: { name: string };
}

interface MeetingInfo {
  id: string;
  title: string;
}

interface GlobalInteraction {
  id: string;
  type: 'meeting' | 'call' | 'email' | 'linkedin' | 'event' | 'note';
  date: string;
  summary: string;
  sentiment?: 'positive' | 'neutral' | 'negative' | null;
  duration?: number | null;
  location?: string | null;
  isRemote: boolean;
  followUpDue?: string | null;
  followUpDone: boolean;
  outcome?: string | null;
  contactId: string;
  contact: ContactInfo;
  meeting?: MeetingInfo | null;
}

interface HistoryTimelineViewProps {
  onExpandContact: (contact: any) => void;
  appContacts: any[];
}

export const HistoryTimelineView: React.FC<HistoryTimelineViewProps> = ({ onExpandContact, appContacts }) => {
  const { t, language } = useTranslation();
  const [interactions, setInteractions] = useState<GlobalInteraction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [filterPendingFollowUp, setFilterPendingFollowUp] = useState<boolean>(false);

  const fetchInteractions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await contactService.getAllInteractions();
      setInteractions(data);
    } catch (err) {
      console.error('Failed to load global interactions:', err);
      setError(t('history.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInteractions();
  }, []);

  const handleMarkFollowUpDone = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await contactService.markFollowUpDone(id);
      setInteractions(prev => 
        prev.map(item => item.id === id ? { ...item, followUpDone: true } : item)
      );
    } catch (err) {
      console.error('Failed to mark follow up as done:', err);
    }
  };

  const handleOpenContact = (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const contact = appContacts.find(c => c.id === contactId);
    if (contact) {
      onExpandContact(contact);
    } else {
      contactService.getDetail(contactId).then(detail => {
        onExpandContact(detail);
      }).catch(err => console.error('Failed to load contact detail:', err));
    }
  };

  const filteredInteractions = interactions.filter(item => {
    const summary = item.summary || '';
    const contactName = item.contact?.name || '';
    const role = item.contact?.role || '';
    const orgName = item.contact?.organization?.name || '';

    const matchesSearch = 
      summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      orgName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesFollowUp = !filterPendingFollowUp || (item.followUpDue && !item.followUpDone);

    return matchesSearch && matchesType && matchesFollowUp;
  });

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return <Calendar size={16} className="text-emerald-400" />;
      case 'call':
        return <Phone size={16} className="text-amber-400" />;
      case 'email':
        return <Mail size={16} className="text-blue-400" />;
      case 'linkedin':
        return <Globe size={16} className="text-indigo-400" />;
      case 'note':
        return <FileText size={16} className="text-purple-400" />;
      default:
        return <MessageCircle size={16} className="text-zinc-400" />;
    }
  };

  const getSentimentStyles = (sentiment?: string | null) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'negative':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'neutral':
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  const dateLocale = language === 'es' ? es : enUS;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-black/60 relative backdrop-blur-3xl">
      <div className="px-6 md:px-10 lg:px-12 pt-6 md:pt-8 lg:pt-10 pb-6 border-b border-white/5 bg-zinc-950/40 relative z-10 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl lg:text-5xl font-black tracking-tighter uppercase text-white mb-2">
              {t('history.title')}
            </h2>
            <p className="text-xs text-zinc-500 font-bold tracking-widest uppercase mono">
              {t('history.subtitle')}
            </p>
          </div>
          
          <button 
            onClick={fetchInteractions}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
          >
            {t('history.syncHistory')}
          </button>
        </div>

        <div className="mt-8 flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center text-zinc-500 pointer-events-none">
              <Search size={16} />
            </span>
            <input 
              type="text"
              placeholder={t('history.searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-900/60 border border-white/5 rounded-2xl text-xs font-medium text-white placeholder-zinc-500 focus:outline-none focus:border-copper/50 focus:ring-1 focus:ring-copper/30 transition-all duration-300"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: t('history.all') },
              { id: 'meeting', label: t('history.meetings') },
              { id: 'call', label: t('history.calls') },
              { id: 'email', label: t('history.emails') },
              { id: 'linkedin', label: t('history.linkedin') },
              { id: 'note', label: t('history.notes') }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setSelectedType(btn.id)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                  selectedType === btn.id
                    ? 'bg-copper/20 border-copper/60 text-copper-light shadow-glow'
                    : 'bg-zinc-900/40 border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10'
                }`}
              >
                {btn.label}
              </button>
            ))}

            <button
              onClick={() => setFilterPendingFollowUp(!filterPendingFollowUp)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 flex items-center gap-2 ${
                filterPendingFollowUp
                  ? 'bg-primary/20 border-primary/50 text-primary-light'
                  : 'bg-zinc-900/40 border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10'
              }`}
            >
              <Clock size={12} />
              {t('history.pendingFollowUp')}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-10 lg:px-12 py-6 md:py-8 lg:py-10 no-scrollbar relative">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-64 gap-4"
            >
              <div className="w-10 h-10 rounded-full border border-white/10 border-t-copper animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">{t('history.loading')}</p>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-64 gap-3 text-center max-w-sm mx-auto"
            >
              <AlertCircle size={32} className="text-primary opacity-60" />
              <p className="text-xs font-bold text-zinc-300">{error}</p>
              <button 
                onClick={fetchInteractions}
                className="mt-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white"
              >
                {t('history.retry')}
              </button>
            </motion.div>
          ) : filteredInteractions.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground gap-4"
            >
              <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center bg-zinc-950/40">
                <History size={20} className="text-zinc-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400">{t('history.noInteractions')}</p>
                <p className="text-[10px] text-zinc-500 mt-1">{t('history.noInteractionsDesc')}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative pl-8 md:pl-12 border-l border-zinc-900 space-y-8"
            >
              {filteredInteractions.map((item, index) => {
                let dayStr = '';
                let timeStr = '';
                let showDayHeader = false;

                try {
                  const dateParsed = item.date ? parseISO(item.date) : new Date();
                  dayStr = format(dateParsed, t('history.dateFormat'), { locale: dateLocale });
                  timeStr = format(dateParsed, 'HH:mm');

                  const currentDay = item.date ? format(parseISO(item.date), 'yyyy-MM-dd') : '';
                  const prevDay = (index > 0 && filteredInteractions[index - 1].date)
                    ? format(parseISO(filteredInteractions[index - 1].date), 'yyyy-MM-dd')
                    : '';
                  showDayHeader = index === 0 || currentDay !== prevDay;
                } catch (e) {
                  dayStr = t('history.unknownDate');
                  timeStr = '--:--';
                  showDayHeader = index === 0;
                }

                return (
                  <div key={item.id} className="relative group/timeline-item">
                    {showDayHeader && (
                      <div className="absolute -left-[49px] md:-left-[65px] -top-12 mb-4 bg-black border border-white/5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-zinc-500 font-mono shadow-md z-10 select-none">
                        {dayStr}
                      </div>
                    )}

                    <div className="absolute -left-[49px] md:-left-[61px] top-6 w-9 h-9 rounded-full border border-zinc-900 bg-zinc-950 flex items-center justify-center z-10 transition-all duration-300 group-hover/timeline-item:border-copper/40 group-hover/timeline-item:bg-zinc-900 group-hover/timeline-item:scale-110 shadow-lg">
                      {getInteractionIcon(item.type)}
                    </div>

                    <div className="absolute -left-[32px] md:-left-[44px] top-15 bottom-[-32px] w-[1px] bg-zinc-900 group-last/timeline-item:hidden" />

                    <div className="premium-card p-6 border border-white/5 bg-zinc-950/40 hover:bg-zinc-900/20 hover:border-white/10 transition-all duration-500 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between gap-6 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-white/5 text-[9px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                            {t(`history.types.${item.type}`)}
                          </span>

                          <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider font-mono ${getSentimentStyles(item.sentiment)}`}>
                            {t('history.sentiment')} {t(`history.sentimentLabels.${item.sentiment || 'unknown'}`)}
                          </span>

                          <span className="text-[10px] text-zinc-500 font-bold font-mono">
                            {timeStr}
                          </span>

                          {item.duration && (
                            <span className="text-[10px] text-zinc-500 font-bold font-mono flex items-center gap-1">
                              • {item.duration} min
                            </span>
                          )}

                          {item.location && (
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-medium">
                              • <MapPin size={11} className="text-zinc-600" /> {item.location} {item.isRemote && `(${t('history.remote')})`}
                            </span>
                          )}
                        </div>

                        <div 
                          onClick={(e) => handleOpenContact(item.contact?.id || '', e)}
                          className="flex items-center gap-3 inline-flex group/contact cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 transition-all group-hover/contact:border-copper/40">
                            {item.contact?.avatar ? (
                              <img src={item.contact.avatar} alt={item.contact.name || 'Contacto'} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold text-zinc-500">{(item.contact?.name || 'C').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</span>
                            )}
                          </div>
                          <div className="text-left">
                            <span className="text-xs font-black text-white group-hover/contact:text-copper-light transition-colors block">
                              {item.contact?.name || t('history.unnamedContact')}
                            </span>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                              {item.contact?.role || t('history.defaultContactRole')} {item.contact?.organization?.name ? `• ${item.contact.organization.name}` : ''}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm font-semibold text-zinc-200 leading-relaxed pt-2">
                          {item.summary}
                        </p>

                        {item.followUpDue && (
                          <div className={`mt-3 p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                            item.followUpDone 
                              ? 'bg-zinc-950/20 border-white/5 opacity-60' 
                              : 'bg-primary/5 border-primary/20 shadow-[0_0_15px_rgba(249,17,23,0.05)]'
                          }`}>
                            <div className="flex items-start gap-3">
                              <span className={`mt-0.5 ${item.followUpDone ? 'text-zinc-500' : 'text-primary'}`}>
                                <Clock size={14} />
                              </span>
                              <div>
                                <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-black block">{t('history.followUpTask')}</span>
                                <span className="text-xs font-bold text-zinc-300">
                                  {t('history.due')}: {format(parseISO(item.followUpDue), t('history.dateFormat'), { locale: dateLocale })}
                                </span>
                              </div>
                            </div>
                            
                            {!item.followUpDone ? (
                              <button
                                onClick={(e) => handleMarkFollowUpDone(item.id, e)}
                                className="px-3.5 py-1.5 rounded-xl bg-primary/20 border border-primary/50 text-[9px] font-black uppercase tracking-widest text-primary-light hover:bg-primary/30 transition-all flex items-center gap-1.5 shrink-0 self-end sm:self-center"
                              >
                                <CheckSquare size={12} />
                                {t('history.completeTask')}
                              </button>
                            ) : (
                              <span className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-white/5 text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                <CheckSquare size={12} className="text-emerald-500" />
                                {t('history.completed')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-end md:items-center shrink-0 justify-end">
                        <button
                          onClick={(e) => handleOpenContact(item.contact?.id || '', e)}
                          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all group-hover/timeline-item:translate-x-1 duration-300"
                          title={t('history.viewFullDossier')}
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
