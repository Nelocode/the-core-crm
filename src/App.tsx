import { useState, createContext, useContext, useEffect, useRef } from 'react';
import { 
  Users, 
  Calendar, 
  LayoutDashboard, 
  Search, 
  Settings, 
  ChevronRight,
  Plus,
  History,
  BrainCircuit,
  Zap,
  Globe,
  Maximize2,
  X,
  Sparkles,
  Command,
  LayoutGrid,
  List,
  Briefcase,
  Heart,
  Trash2,
  Upload,
  Edit3,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday } from 'date-fns';
import { n8nService, type InvestigateResult } from './services/n8nService';
import { Camera } from 'lucide-react';
import { contacts, meetings, mockAIBriefings } from './data';
import { translations } from './translations';
import type { Language } from './translations';

// --- i18n Logic ---

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('the-core-lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('the-core-lang', lang);
  };

  const t = (path: string) => {
    const keys = path.split('.');
    let result: any = translations[language];
    for (const key of keys) {
      result = result?.[key];
    }
    return result || path;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used within LanguageProvider');
  return context;
};

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, setIsAddModalOpen }: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void,
  setIsAddModalOpen: (open: boolean) => void
}) => {
  const { t, language, setLanguage } = useTranslation();
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard') },
    { id: 'contacts', icon: Users, label: t('sidebar.contacts') },
    { id: 'calendar', icon: Calendar, label: t('sidebar.calendar') },
    { id: 'history', icon: History, label: t('sidebar.history') },
  ];

  return (
    <div className="hidden lg:flex w-64 border-r border-border h-screen flex-col glass p-6 transition-all duration-300 relative z-20">
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="relative group cursor-pointer">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 group-hover:scale-110 transition-transform duration-500">
            <div className="w-6 h-6 bg-primary rounded-full blur-[2px] animate-pulse" />
            <div className="absolute inset-0 w-10 h-10 border border-primary/20 rounded-full animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-2 w-6 h-6 border border-white/20 rounded-full animate-[spin_6s_linear_infinite_reverse]" />
          </div>
          <div className="absolute -inset-2 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="hidden lg:block ml-2">
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-[-0.05em] leading-none text-white">CORE<span className="text-primary text-[6px] align-top ml-0.5">TM</span></h1>
            <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-0.5">v1.5.1 Engine</span>
          </div>
          <p className="text-[8px] text-muted-foreground uppercase tracking-[0.3em] font-bold mt-1.5 opacity-60">{t('common.intelligenceCRM')}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
              activeTab === item.id 
                ? 'bg-primary text-white glow-red shadow-lg' 
                : 'text-muted-foreground hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon 
              size={18} 
              strokeWidth={activeTab === item.id ? 2 : 1.5} 
              className={activeTab === item.id ? 'scale-110' : 'group-hover:scale-110 transition-transform'} 
            />
            <span className="font-semibold text-sm hidden lg:block tracking-tight">{item.label}</span>
          </button>
        ))}
      </nav>

      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all group mb-4"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Plus size={18} strokeWidth={2.5} />
        </div>
        <span className="font-bold text-xs hidden lg:block tracking-widest uppercase">{t('sidebar.contacts')} +</span>
      </button>

      <div className="mt-auto space-y-4 pt-6 border-t border-border">
        {/* Language Switcher */}
        <div className="hidden lg:flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl border border-white/5">
          <Globe size={14} strokeWidth={1.5} className="text-muted-foreground" />
          <div className="flex gap-1">
            {(['en', 'es'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2 py-1 text-[10px] font-black uppercase rounded-md transition-all ${
                  language === lang 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <button className="w-full flex items-center gap-4 px-4 py-3 text-muted-foreground hover:text-white transition-colors group">
          <Settings size={18} strokeWidth={1.5} className="group-hover:rotate-45 transition-transform" />
          <span className="font-semibold text-sm hidden lg:block tracking-tight">{t('sidebar.settings')}</span>
        </button>
      </div>
    </div>
  );
};

const MobileNav = ({ activeTab, setActiveTab, setIsAddModalOpen }: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void,
  setIsAddModalOpen: (open: boolean) => void
}) => {
  const { t } = useTranslation();
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard') },
    { id: 'contacts', icon: Users, label: t('sidebar.contacts') },
    { id: 'calendar', icon: Calendar, label: t('sidebar.calendar') },
    { id: 'history', icon: History, label: t('sidebar.history') },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] glass rounded-t-[2.5rem] p-4 pb-8 flex items-center justify-around border-t border-white/5 backdrop-blur-3xl">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === item.id ? 'text-primary scale-110' : 'text-muted-foreground'
          }`}
        >
          <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 1.5} />
          <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
        </button>
      ))}
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-lg glow-red -translate-y-4 border-4 border-black"
      >
        <Plus size={24} strokeWidth={3} />
      </button>
    </div>
  );
};

const AIBriefingCard = ({ contactId }: { contactId: string }) => {
  const { t } = useTranslation();
  const briefing = mockAIBriefings[contactId as keyof typeof mockAIBriefings];
  const contact = contacts.find(c => c.id === contactId);

  if (!briefing || !contact) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="premium-card p-8 border-t border-t-copper/30 relative"
    >
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <BrainCircuit size={120} className="text-copper animate-pulse" />
      </div>
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-copper/20 flex items-center justify-center">
            <BrainCircuit size={16} strokeWidth={1.5} className="text-copper" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-copper-light mono">{t('intelligence.briefingTitle')}</span>
        </div>
        <div className="px-3 py-1 rounded-full bg-success/10 border border-success/20 text-[10px] font-bold text-success uppercase tracking-wider mono flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-success animate-pulse" />
          {t('intelligence.liveAnalysis')}
        </div>
      </div>

      <div className="space-y-8 relative z-10">
        <section>
          <h4 className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3 mono">{t('intelligence.icebreaker')}</h4>
          <p className="text-xl font-medium leading-relaxed italic text-white selection:bg-copper/30">
            "{briefing.icebreaker}"
          </p>
        </section>

        <section>
          <h4 className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3 mono">{t('intelligence.strategicContext')}</h4>
          <p className="text-sm text-white/70 leading-relaxed max-w-2xl">
            {briefing.strategicContext}
          </p>
        </section>

        <div className="flex items-center gap-8 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${
              briefing.emotionalPulse === 'positive' ? 'bg-success' : 'bg-warning'
            } shadow-[0_0_10px_rgba(16,185,129,0.5)]`} />
            <div>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black mono block">{t('intelligence.sentiment')}</span>
              <span className="text-xs font-bold uppercase">{briefing.emotionalPulse}</span>
            </div>
          </div>
          <div className="border-l border-white/10 pl-8">
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-black mono block">{t('intelligence.certainty')}</span>
            <span className="text-xs font-bold">98.4%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const filterContacts = (appContacts: Contact[], query: string) => {
  if (query === '') return appContacts;
  
  const lowerQuery = query.toLowerCase();
  
  // Smart Filters
  if (lowerQuery.includes('company:')) {
    const companyQuery = lowerQuery.split('company:')[1].trim();
    return appContacts.filter(c => c.company.toLowerCase().includes(companyQuery));
  }
  if (lowerQuery.includes('role:')) {
    const roleQuery = lowerQuery.split('role:')[1].trim();
    return appContacts.filter(c => c.role.toLowerCase().includes(roleQuery));
  }
  if (lowerQuery.includes('score>')) {
    const scoreQuery = parseInt(lowerQuery.split('score>')[1].trim());
    if (!isNaN(scoreQuery)) return appContacts.filter(c => c.relationshipScore > scoreQuery);
  }
  if (lowerQuery.includes('score<')) {
    const scoreQuery = parseInt(lowerQuery.split('score<')[1].trim());
    if (!isNaN(scoreQuery)) return appContacts.filter(c => c.relationshipScore < scoreQuery);
  }

  return appContacts.filter(c => 
    c.name.toLowerCase().includes(lowerQuery) || 
    c.company.toLowerCase().includes(lowerQuery) ||
    c.role.toLowerCase().includes(lowerQuery)
  );
};

const CommandPalette = ({ 
  isOpen, 
  onClose, 
  onSelectContact,
  contacts: appContacts 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSelectContact: (c: Contact) => void,
  contacts: Contact[]
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [hoveredContactId, setHoveredContactId] = useState<string | null>(null);
  
  const filteredContacts = query === '' 
    ? appContacts.slice(0, 5) 
    : filterContacts(appContacts, query);

  const hoveredContact = appContacts.find(c => c.id === hoveredContactId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] lg:pt-[15vh] px-4 backdrop-blur-md bg-black/40"
        onClick={onClose}
      >
        <div className="relative w-full max-w-2xl flex flex-col lg:flex-row gap-4 items-start pb-20">
          <motion.div 
            initial={{ scale: 0.95, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: -20, opacity: 0 }}
            className="flex-1 bg-zinc-900/95 border border-white/10 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 px-6 py-5 border-b border-white/5">
              <Search size={20} className="text-zinc-500" />
              <input 
                autoFocus
                placeholder={t('dashboard.search') + " (ej: company:Thorne, score>80)..."}
                className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder:text-zinc-600 font-medium"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                <span className="text-[10px] font-black text-zinc-400">ESC</span>
              </div>
            </div>

            <div className="p-2 max-h-[60vh] overflow-y-auto no-scrollbar">
              {filteredContacts.length > 0 ? (
                <div className="space-y-1">
                  <div className="px-4 py-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{t('sidebar.contacts')}</span>
                  </div>
                  {filteredContacts.map(contact => (
                    <button
                      key={contact.id}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-left group"
                      onMouseEnter={() => setHoveredContactId(contact.id)}
                      onMouseLeave={() => setHoveredContactId(null)}
                      onClick={() => {
                        onSelectContact(contact);
                        onClose();
                      }}
                    >
                      <ContactAvatar src={contact.avatar} name={contact.name} className="w-10 h-10 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-sm text-white">{contact.name}</h5>
                        <p className="text-xs text-zinc-500">{contact.role} @ {contact.company}</p>
                      </div>
                      <ChevronRight size={14} className="text-zinc-700 group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center gap-4 text-zinc-600">
                  <Search size={40} strokeWidth={1} className="opacity-20" />
                  <p className="text-sm font-medium">No se encontraron resultados para "{query}"</p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-black/40 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                    <Command size={10} className="text-zinc-500" />
                    <span className="text-[9px] font-black text-zinc-400">K</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Abrir</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                    <span className="text-[9px] font-black text-zinc-400">↵</span>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Seleccionar</span>
                </div>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-700 mono">CORE Intelligence Search</span>
            </div>
          </motion.div>

          {/* Quick Icebreaker Peek */}
          <AnimatePresence>
            {hoveredContact && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="hidden lg:block w-72 bg-zinc-900/90 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles size={14} className="text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mono">{t('intelligence.icebreaker')}</span>
                </div>
                <p className="text-sm font-medium italic text-white leading-relaxed">
                  "{mockAIBriefings[hoveredContact.id as keyof typeof mockAIBriefings]?.icebreaker}"
                </p>
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Inteligencia Activa</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const Dashboard = ({ onExpandContact, forceSelectedContactId, appContacts, setIsAddModalOpen }: { 
  onExpandContact: (c: Contact) => void,
  forceSelectedContactId?: string | null,
  appContacts: Contact[],
  setIsAddModalOpen: (open: boolean) => void,
  onEditContact: (c: Contact) => void
}) => {
  const { t } = useTranslation();
  const [selectedMeeting, setSelectedMeeting] = useState(meetings[0]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Sync with external selection (Command Palette)
  useEffect(() => {
    if (forceSelectedContactId) {
      setSelectedContactId(forceSelectedContactId);
      const meetingWithContact = meetings.find(m => m.attendees.includes(forceSelectedContactId));
      if (meetingWithContact) setSelectedMeeting(meetingWithContact);
    }
  }, [forceSelectedContactId]);
  
  const activeContact = selectedContactId 
    ? appContacts.find(c => c.id === selectedContactId) 
    : appContacts.find(c => c.id === selectedMeeting.attendees[0]);

  return (
    <div className="flex flex-col h-full max-w-[1600px] mx-auto overflow-x-hidden overflow-y-auto lg:overflow-hidden pb-24 lg:pb-0">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end p-6 lg:p-8 pb-4 flex-shrink-0 gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tighter mb-1 uppercase">{t('dashboard.title')}</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse glow" />
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mono">{t('dashboard.syncStatus')} • {t('dashboard.justNow')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="glass px-4 py-2 flex items-center gap-2 hover:border-copper transition-colors group">
            <Search size={16} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold tracking-tight">{t('dashboard.search')}</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 glow-red hover:scale-105 transition-transform"
          >
            <Plus size={16} strokeWidth={2} />
            <span className="text-sm font-semibold tracking-tight">{t('dashboard.addContact')}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-0 overflow-visible lg:overflow-hidden px-6 lg:px-8 pb-8">
        {/* Fixed Center Column (Upcoming Meetings & Recent Contacts) */}
        <div className="col-span-1 lg:col-span-5 lg:pr-8 overflow-visible lg:overflow-y-auto no-scrollbar space-y-8 py-4">
          <section className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">{t('dashboard.nextMeeting')}</h3>
            {meetings.map(meeting => (
              <div 
                key={meeting.id}
                className={`p-6 rounded-xl border transition-all cursor-pointer ${
                  selectedMeeting.id === meeting.id ? 'border-primary bg-primary/5' : 'border-border glass hover:border-muted-foreground'
                }`}
                onClick={() => {
                  setSelectedMeeting(meeting);
                  setSelectedContactId(null);
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-primary text-xs font-bold mono">
                      {isToday(new Date(meeting.startTime)) ? t('dashboard.today') : format(new Date(meeting.startTime), 'MMM d')}
                    </span>
                    <h4 className="text-lg font-bold mt-1 text-zinc-300 group-hover:text-white transition-colors">{meeting.title}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground mono">{format(new Date(meeting.startTime), 'HH:mm')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground/80">
                  <Users size={14} strokeWidth={1.5} />
                  <span className="tracking-tight font-medium">{t('dashboard.with')} {meeting.attendees.map(id => appContacts.find(c => c.id === id)?.name).join(', ')}</span>
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white pt-4">{t('dashboard.recentContacts')}</h3>
            <div className="space-y-3">
              {appContacts.map(contact => (
                <div 
                  key={contact.id} 
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer group ${
                    (selectedContactId === contact.id || (!selectedContactId && activeContact?.id === contact.id)) 
                      ? 'bg-white/10 border-white/20 shadow-sm' 
                      : 'border-transparent hover:bg-white/5 hover:border-white/10'
                  }`}
                >
                  {contact.avatar ? (
                    <div className="relative group/avatar cursor-zoom-in" onClick={(e) => { e.stopPropagation(); onExpandContact(contact); }}>
                      <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover border border-white/10 group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 size={12} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-secondary rounded-full flex-center text-xl font-black text-copper group-hover:scale-110 transition-transform">
                      {contact.name[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <h5 className="font-bold text-sm">{contact.name}</h5>
                    <p className="text-[11px] text-muted-foreground tracking-tight font-medium">{contact.role} {t('dashboard.at')} {contact.company}</p>
                  </div>
                  <ChevronRight size={16} strokeWidth={1.5} className="text-muted-foreground group-hover:text-copper transition-colors" />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Scrollable Right Column (AI Intelligence) */}
        <div className="col-span-1 lg:col-span-7 lg:pl-8 border-t lg:border-t-0 lg:border-l border-border overflow-visible lg:overflow-y-auto no-scrollbar py-8 lg:py-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
            {selectedContactId ? t('dashboard.contactIntelligence') : t('dashboard.meetingIntelligence')}
          </h3>
          
          {activeContact && (
            <div className="space-y-8 pb-12">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 p-6 lg:p-8 premium-card border-b border-b-primary/30">
                  <ContactAvatar src={activeContact.avatar} name={activeContact.name} className="w-20 h-20 lg:w-24 lg:h-24" />

                <div className="flex-1 relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-4xl font-black tracking-tight mb-2">{activeContact.name}</h3>
                      <p className="text-copper-light font-bold uppercase text-[10px] tracking-[0.3em] mono">
                        {activeContact.role} <span className="text-muted-foreground mx-2">•</span> {activeContact.company}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-4">
                      <button 
                        onClick={() => onEditContact(activeContact)}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                      >
                        <Edit3 size={12} />
                        {t('dashboard.editContact')}
                      </button>
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mono mb-1">{t('intelligence.relationshipScore')}</div>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-black text-white text-glow">{activeContact.relationshipScore}</span>
                          <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${activeContact.relationshipScore}%` }}
                              className="h-full bg-gradient-to-r from-copper to-primary"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              <AIBriefingCard contactId={activeContact.id} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="premium-card p-6 border border-white/5">
                  <h5 className="text-[10px] text-muted-foreground uppercase mb-4 tracking-widest mono">{t('intelligence.familyArchitecture')}</h5>
                  <div className="space-y-2">
                    <p className="text-sm font-bold flex justify-between">
                      <span className="text-muted-foreground">{t('intelligence.spouse')}:</span>
                      <span>{activeContact.family?.spouse || 'N/A'}</span>
                    </p>
                    <p className="text-sm font-bold flex justify-between">
                      <span className="text-muted-foreground">{t('intelligence.children')}:</span>
                      <span>{activeContact.family?.children?.join(', ') || 'None'}</span>
                    </p>
                  </div>
                </div>
                <div className="premium-card p-6 border border-white/5">
                  <h5 className="text-[10px] text-muted-foreground uppercase mb-4 tracking-widest mono">{t('intelligence.interests')}</h5>
                  <div className="flex flex-wrap gap-2">
                    {activeContact.hobbies?.map(hobby => (
                      <span key={hobby} className="px-2 py-1 rounded bg-copper/10 border border-copper/20 text-[10px] font-bold text-copper-light uppercase mono">
                        {hobby}
                      </span>
                    ))}
                    {(!activeContact.hobbies || activeContact.hobbies.length === 0) && (
                      <span className="text-[10px] text-muted-foreground uppercase mono tracking-widest italic">No intereses registrados</span>
                    )}
                  </div>
                </div>
              </div>

              {/* History Timeline */}
              <div className="premium-card p-8 space-y-8">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-3">
                    <History size={16} strokeWidth={1.5} className="text-primary" /> {t('intelligence.interactionLog')}
                  </h4>
                  <button className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors mono">
                    {t('intelligence.viewFullHistory')} →
                  </button>
                </div>
                
                <div className="relative pl-8 space-y-10 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                  {activeContact.interactions?.map((interaction, idx) => (
                    <div key={interaction.id} className={`relative ${idx > 0 ? 'opacity-50 hover:opacity-100 transition-opacity' : ''}`}>
                      <div className={`absolute -left-[23px] top-1 w-[11px] h-[11px] rounded-full ${
                        idx === 0 ? 'bg-primary glow-red shadow-[0_0_10px_rgba(249,17,23,0.5)]' : 'bg-zinc-800'
                      } border-2 border-background z-10`} />
                      
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-black mono uppercase tracking-widest ${idx === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                          {idx === 0 ? t('intelligence.latestInteraction') : interaction.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground mono">{format(new Date(interaction.date), 'PPP')}</span>
                      </div>
                      <h5 className="text-sm font-bold text-white mb-2 leading-snug">{interaction.summary}</h5>
                      <div className="flex items-center gap-4">
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mono uppercase font-medium">
                          <Search size={10} strokeWidth={1.5} /> {interaction.location || t('intelligence.remote')}
                        </p>
                        <div className={`text-[9px] font-black px-2 py-0.5 rounded-sm uppercase mono ${
                          interaction.sentiment === 'positive' ? 'bg-success/10 text-success' : 'bg-white/5 text-muted-foreground'
                        }`}>
                          {interaction.sentiment}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!activeContact.interactions || activeContact.interactions.length === 0) && (
                    <div className="py-10 text-center border border-dashed border-white/5 rounded-2xl bg-white/5">
                      <History size={32} className="mx-auto text-zinc-800 mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Sin historial de interacciones</p>
                    </div>
                  )}
                </div>
              </div>


            </div>
          )}

        </div>
      </div>
    </div>
  );
};


const ContactAvatar = ({ 
  src, 
  name, 
  className = "w-20 h-20",
  size = "md"
}: { 
  src?: string, 
  name: string, 
  className?: string,
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) => {
  const [hasError, setHasError] = useState(false);
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (!src || hasError) {
    return (
      <div className={`${className} bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10 flex items-center justify-center relative overflow-hidden group`}>
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className={`font-black tracking-tighter text-zinc-500 group-hover:text-primary transition-colors font-mono uppercase text-center leading-none ${
          size === 'xl' ? 'text-8xl' : size === 'lg' ? 'text-4xl' : 'text-xl'
        }`}>
          {initials || <Users size={24} />}
        </span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      className={`${className} object-cover border border-white/10 shadow-xl`} 
      alt={name}
      onError={() => setHasError(true)}
    />
  );
};

const ContactModal = ({ 
  isOpen, 
  onClose, 
  onSave,
  contact
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (c: Contact) => void,
  contact?: Contact | null
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'prof' | 'intl' | 'int'>('prof');
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [investigateResults, setInvestigateResults] = useState<InvestigateResult | null>(null);
  const [cardImages, setCardImages] = useState<File[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    email: '',
    website: '',
    phone: '',
    location: '',
    avatar: '',
    birthday: '',
    spouseName: '',
    spouseBirthday: '',
    children: '',
    hobbies: '',
    personalGoal: '',
    relationshipScore: 50,
    captureMetadata: undefined as any, // will be typed as CaptureMetadata | undefined
    intelligence: { icebreaker: '' }
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab('prof');
    }
    if (contact) {
      setFormData({
        name: contact.name || '',
        role: contact.role || '',
        company: contact.company || '',
        email: contact.email || '',
        website: contact.website || '',
        phone: contact.phone || '',
        location: contact.location || '',
        avatar: contact.avatar || '',
        birthday: '', // Assuming these might not be in the mock data but in the type soon
        spouseName: contact.family?.spouse || '',
        spouseBirthday: '',
        children: contact.family?.children?.join(', ') || '',
        hobbies: contact.hobbies?.join(', ') || '',
        personalGoal: contact.notes || '',
        relationshipScore: contact.relationshipScore || 50,
        captureMetadata: contact.captureMetadata || { capturedAt: '', meetingLocation: '' },
        intelligence: { icebreaker: contact.intelligence?.icebreaker || '' }
      });
    } else {
      setFormData({
        name: '', role: '', company: '', email: '', website: '', phone: '', location: '', avatar: '', birthday: '', 
        spouseName: '', spouseBirthday: '', children: '', hobbies: '', 
        personalGoal: '', relationshipScore: 50, captureMetadata: { capturedAt: '', meetingLocation: '' },
        intelligence: { icebreaker: '' }
      });
    }
  }, [contact, isOpen]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIInvestigate = async () => {
    if (!formData.name) return;
    setIsInvestigating(true);
    try {
      const result = await n8nService.investigateContact({
        name: formData.name, 
        company: formData.company,
        role: formData.role,
        location: formData.location,
        website: formData.website
      });
      setInvestigateResults(result);
    } catch (error) {
      console.error('Failed to investigate contact:', error);
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleCardScan = () => {
    cardInputRef.current?.click();
  };

  const handleCardFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCardImages(prev => [...prev, file]);
    if (cardInputRef.current) cardInputRef.current.value = '';
  };

  const processCardImages = async () => {
    if (cardImages.length === 0) return;

    setIsScanning(true);
    setScanError(null);

    try {
      // Create a canvas to resize the image before sending to n8n
      const optimizeImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          const objectUrl = URL.createObjectURL(file);
          
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; // Ultra-light for fast transfer
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Cleanup memory immediately
            URL.revokeObjectURL(objectUrl);
            
            canvas.toBlob((blob) => {
              if (blob) resolve(blob as any);
              else reject(new Error('Canvas toBlob failed'));
            }, 'image/jpeg', 0.8);
          };
          img.onerror = (err) => {
            URL.revokeObjectURL(objectUrl);
            reject(err);
          };
          img.src = objectUrl;
        });
      };

      // Watchdog: Force stop scanning after 20s if it hangs
      const watchdog = setTimeout(() => {
        if (isScanning) {
          setIsScanning(false);
          setScanError('La conexión con la IA ha tardado demasiado.');
        }
      }, 20000);

      const blobs = await Promise.all(cardImages.map(f => optimizeImage(f)));
      
      // Intentar obtener ubicación GPS
      let lat, lng;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (err) {
        console.warn('Geolocation failed or denied', err);
      }

      const captureMetadata = {
        capturedAt: new Date().toISOString(),
        meetingLocation: lat && lng ? `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}` : '',
        latitude: lat,
        longitude: lng
      };

      // We send the blobs directly to our service
      const result = await n8nService.scanBusinessCard(blobs as any);
      
      clearTimeout(watchdog);
      
      if (!result.name && !result.email) {
        throw new Error('READ_FAILED');
      }

      setFormData(prev => ({
        ...prev,
        name: result.name || prev.name,
        role: result.role || prev.role,
        company: result.company || prev.company,
        email: result.email || prev.email,
        website: result.website || prev.website,
        phone: result.phone || prev.phone,
        location: result.location || prev.location,
        avatar: result.avatar || prev.avatar,
        captureMetadata
      }));
      setActiveTab('prof');
      setCardImages([]);
    } catch (error: any) {
      console.error('Failed to process card:', error);
      setScanError(
        error.message === 'READ_FAILED' 
          ? 'No se detectó información legible en la tarjeta.' 
          : 'La imagen es demasiado pesada o hubo un error de conexión.'
      );
      setTimeout(() => setScanError(null), 5000);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const contactData: Contact = {
      id: contact?.id || Math.random().toString(36).substr(2, 9),
      name: formData.name,
      role: formData.role,
      company: formData.company,
      email: formData.email,
      website: formData.website,
      phone: formData.phone,
      location: formData.location || contact?.location || 'Remote',
      relationshipScore: formData.relationshipScore,
      lastInteraction: contact?.lastInteraction || new Date().toISOString(),
      avatar: formData.avatar || '',
      captureMetadata: formData.captureMetadata,
      status: 'active',
      family: { 
        spouse: formData.spouseName, 
        children: formData.children ? formData.children.split(',').map(s => s.trim()) : [] 
      },
      hobbies: formData.hobbies ? formData.hobbies.split(',').map(s => s.trim()) : [],
      interactions: contact?.interactions || [],
      notes: formData.personalGoal,
      intelligence: {
        lastInteractionType: 'email',
        keyInterests: formData.hobbies ? formData.hobbies.split(',').map(s => s.trim()) : [],
        communicationStyle: 'Professional',
        icebreaker: formData.intelligence?.icebreaker || ''
      }
    };
    onSave(contactData);
    onClose();
    // Reset handled by useEffect on reopen
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'prof', label: 'Profesional', icon: Briefcase },
    { id: 'intl', label: 'Intimidad', icon: Heart },
    { id: 'int', label: 'Intereses', icon: Sparkles },
  ] as const;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[250] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/80"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 30, opacity: 0 }}
          className="w-full max-w-full lg:max-w-3xl bg-zinc-950 border border-white/5 rounded-[2rem] lg:rounded-[3rem] shadow-[0_0_150px_rgba(249,17,23,0.15)] overflow-x-hidden overflow-y-auto flex flex-col h-[90vh] lg:h-[700px] relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Scanning Overlay */}
          <AnimatePresence>
            {(isScanning || isInvestigating) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md"
              >
                <div className="relative w-64 h-64 lg:w-80 lg:h-80 border border-primary/20 rounded-2xl overflow-hidden">
                  <motion.div 
                    animate={{ y: [0, 320] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 right-0 h-1 bg-primary glow-red z-10"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BrainCircuit size={80} className="text-primary animate-pulse" />
                  </div>
                </div>
                <p className="mt-8 text-xs font-black uppercase tracking-[0.5em] text-primary animate-pulse font-mono">
                  {isScanning ? 'Extrayendo Datos de Tarjeta...' : 'Deep Search AI: Active'}
                </p>
              </motion.div>
            )}
            {scanError && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-10 left-10 right-10 z-50 bg-red-500/90 backdrop-blur-md text-white p-4 rounded-2xl flex items-center gap-4 shadow-2xl border border-red-400/50"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Error de Inteligencia</p>
                  <p className="text-xs font-bold opacity-90">{scanError}</p>
                </div>
                  </motion.div>
            )}
          </AnimatePresence>

          {/* Two-Sided Scan Staging Overlay */}
          <AnimatePresence>
            {cardImages.length > 0 && !isScanning && !investigateResults && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-[110] bg-zinc-950/98 backdrop-blur-3xl flex flex-col p-6 lg:p-10 justify-center items-center text-center"
              >
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary mb-8 animate-pulse shadow-glow">
                  <Camera size={40} />
                </div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
                  {cardImages.length === 1 ? 'Cara Frontal Lista' : 'Ambas Caras Listas'}
                </h3>
                <p className="text-sm text-zinc-400 mb-12 max-w-sm">
                  {cardImages.length === 1 
                    ? '¿La tarjeta tiene información importante en el reverso (ej. página web, teléfono)?' 
                    : 'Imágenes capturadas. Listas para la unidad de inteligencia.'}
                </p>
                
                <div className="flex flex-col gap-4 w-full max-w-sm">
                  {cardImages.length === 1 && (
                    <button 
                      onClick={handleCardScan}
                      className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all flex justify-center items-center gap-2"
                    >
                      <Camera size={18} />
                      Añadir Reverso
                    </button>
                  )}
                  <button 
                    onClick={processCardImages}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-glow hover:scale-[1.02] transition-all"
                  >
                    Extraer Datos Ahora
                  </button>
                  <button 
                    onClick={() => setCardImages([])}
                    className="w-full py-4 text-zinc-500 font-bold uppercase tracking-widest hover:text-white transition-all text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Investigation Audit Overlay */}
          <AnimatePresence>
            {investigateResults && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute inset-0 z-[100] bg-zinc-950/95 backdrop-blur-3xl flex flex-col p-6 lg:p-10"
              >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
                      <Sparkles className="text-primary" /> Auditoría Humana
                    </h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Selecciona los datos encontrados para guardar</p>
                  </div>
                  <button onClick={() => setInvestigateResults(null)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                  {['avatar', 'role', 'location', 'notes', 'icebreaker'].map((field) => {
                    const val = investigateResults[field as keyof typeof investigateResults];
                    if (!val) return null;
                    return (
                      <div key={field} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase text-primary font-black tracking-widest mb-1">
                            {field === 'notes' ? 'Bio / Notas' : field === 'icebreaker' ? 'Rompehielos Estratégico' : field}
                          </p>
                          <p className="text-sm text-white truncate">{typeof val === 'string' ? val : Array.isArray(val) ? val.join(', ') : ''}</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            if (field === 'icebreaker') {
                              setFormData(prev => ({ ...prev, intelligence: { ...prev.intelligence, icebreaker: val as string } }));
                            } else {
                              setFormData(prev => ({ ...prev, [field === 'notes' ? 'personalGoal' : field]: val }));
                            }
                            setInvestigateResults(prev => ({ ...prev, [field]: undefined }) as any);
                          }}
                          className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-all whitespace-nowrap"
                        >
                          Aprobar
                        </button>
                      </div>
                    );
                  })}
                  
                  {investigateResults.hobbies && investigateResults.hobbies.length > 0 && (
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase text-primary font-black tracking-widest mb-1">Hobbies / Intereses</p>
                        <p className="text-sm text-white truncate">{investigateResults.hobbies.join(', ')}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, hobbies: investigateResults.hobbies!.join(', ') }));
                          setInvestigateResults(prev => ({ ...prev, hobbies: undefined }) as any);
                        }}
                        className="px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-all whitespace-nowrap"
                      >
                        Aprobar
                      </button>
                    </div>
                  )}

                  {!['avatar', 'role', 'location', 'notes', 'hobbies', 'icebreaker'].some(k => investigateResults[k as keyof typeof investigateResults]) && (
                    <div className="text-center py-10 text-muted-foreground text-sm font-medium">
                      Todos los datos procesados o no se encontró información adicional.
                    </div>
                  )}
                </div>

                <div className="pt-6 mt-auto border-t border-white/10 flex justify-end">
                  <button 
                    type="button"
                    onClick={() => setInvestigateResults(null)}
                    className="bg-zinc-800 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all border border-white/5"
                  >
                    Volver al Formulario
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header & Tabs Navigation */}
          <div className="p-6 lg:p-10 pb-0 lg:pb-0 space-y-6 lg:space-y-8 flex-shrink-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-3xl lg:text-4xl font-black tracking-tighter text-white uppercase">
                  {contact ? t('dashboard.editContact') : 'Sincronización'}
                </h3>
                <p className="text-[10px] text-primary uppercase tracking-[0.4em] font-black mt-2 font-mono">
                  {isInvestigating ? 'AI Deep Search Active...' : isScanning ? 'Parsing Card Metadata...' : contact ? 'Updating Profile...' : 'Intelligence Unit v2.0'}
                </p>
              </div>
              <div className="flex gap-2 lg:gap-4">
                <input 
                  type="file" 
                  ref={cardInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleCardFileChange} 
                />
                {!contact && (formData.name || formData.company) && (
                  <button 
                    onClick={handleCardScan}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Maximize2 size={14} className={isScanning ? 'animate-pulse text-primary' : ''} />
                    <span className="hidden sm:inline">Escanear Tarjeta</span>
                  </button>
                )}
                <button onClick={onClose} className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-all group">
                  <X size={20} className="text-zinc-500 group-hover:text-white" />
                </button>
              </div>
            </div>

            <div className="flex gap-2 bg-white/5 p-1.5 rounded-[1.5rem] border border-white/5">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab.id ? 'bg-zinc-800 text-white shadow-xl border border-white/5' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <tab.icon size={14} strokeWidth={3} className={activeTab === tab.id ? 'text-primary' : ''} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-10 pt-6 lg:pt-8">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8 flex-1"
                >
                  {activeTab === 'prof' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                      {!contact && !formData.name && !formData.company && (
                        <div className="col-span-1 md:col-span-2 mb-2 space-y-6">
                          <button 
                            type="button"
                            onClick={handleCardScan}
                            className="w-full relative group overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 p-10 lg:p-12 flex flex-col items-center justify-center gap-6 hover:border-primary transition-all glow-red shadow-2xl"
                          >
                            <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
                            <div className="w-20 h-20 lg:w-24 lg:h-24 bg-primary rounded-full flex items-center justify-center text-white shadow-glow group-hover:scale-110 transition-transform">
                              <Camera size={40} className="lg:w-12 lg:h-12" />
                            </div>
                            <div className="text-center relative z-10">
                              <h3 className="text-xl lg:text-2xl font-black text-white uppercase tracking-widest">Tomar Foto de Tarjeta</h3>
                              <p className="text-[10px] lg:text-xs text-primary/80 mt-2 font-medium uppercase tracking-widest">Extracción Mágica + GPS</p>
                            </div>
                          </button>
                          
                          <div className="flex items-center gap-4 px-4">
                            <div className="h-[1px] flex-1 bg-white/10"></div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">O crea el perfil manualmente</span>
                            <div className="h-[1px] flex-1 bg-white/10"></div>
                          </div>
                        </div>
                      )}
                      <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row items-end gap-4">
                        <div className="space-y-3 flex-1 w-full">
                          <label className="label-executive">Nombre Completo</label>
                          <input required className="input-core" placeholder="Ej. Alexander Pierce" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <button 
                          type="button"
                          onClick={handleAIInvestigate}
                          disabled={!formData.name || isInvestigating}
                          className={`w-full sm:w-auto h-[52px] flex items-center justify-center gap-2 px-6 rounded-xl border transition-all ${isInvestigating ? 'bg-primary/20 text-primary border-primary/30' : formData.name ? 'bg-primary/10 text-primary hover:bg-primary hover:text-white border-primary/30 glow-red' : 'bg-white/5 text-zinc-600 border-white/5'}`}
                        >
                          <Sparkles size={16} className={isInvestigating ? 'animate-spin' : ''} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{isInvestigating ? 'Buscando...' : 'Deep Search AI'}</span>
                        </button>
                      </div>
                      <div className="space-y-3">
                        <label className="label-executive">Cargo / Role</label>
                        <input required className="input-core" placeholder="CEO / Founder" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label className="label-executive">Compañía</label>
                        <input required className="input-core" placeholder="The Core Industries" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label className="label-executive">Teléfono</label>
                        <input type="tel" className="input-core" placeholder="+1 234 567 890" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label className="label-executive flex justify-between">
                          Página Web
                          {formData.website && <a href={formData.website} target="_blank" rel="noreferrer" className="text-primary hover:underline uppercase text-[8px] tracking-widest font-bold">Abrir</a>}
                        </label>
                        <input className="input-core" placeholder="https://thecore.com" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label className="label-executive">Email Corporativo</label>
                        <input required type="email" className="input-core" placeholder="alex@company.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-3">
                        <label className="label-executive flex justify-between">
                          Dirección / Ubicación
                          {formData.captureMetadata?.meetingLocation && (
                            <span className="text-primary/70 text-[8px] font-mono tracking-widest">{formData.captureMetadata.meetingLocation}</span>
                          )}
                        </label>
                        <input className="input-core" placeholder="Ciudad, País o Dirección Física" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-3">
                        <label className="label-executive flex justify-between">
                          Rompehielos / Icebreaker AI
                          <Sparkles size={12} className="text-primary" />
                        </label>
                        <input className="input-core bg-primary/5 border-primary/20 text-primary placeholder:text-primary/30" placeholder="Un buen tema de conversación para la próxima reunión..." value={formData.intelligence?.icebreaker} onChange={e => setFormData({...formData, intelligence: { ...formData.intelligence, icebreaker: e.target.value }})} />
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-3 p-4 lg:p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                        <label className="label-executive text-primary">Identidad Visual (Foto)</label>
                        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                          <div className="relative group/avatar cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <ContactAvatar src={formData.avatar} name={formData.name || 'User'} className="w-20 h-20 rounded-2xl border-2 border-dashed border-white/20 group-hover/avatar:border-primary/50 transition-colors" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center rounded-2xl transition-opacity">
                              <Upload size={20} className="text-white" />
                            </div>
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              accept="image/*" 
                              onChange={handleFileUpload} 
                            />
                          </div>
                          <div className="flex-1 space-y-3">
                            <input 
                              className="input-core bg-black/40 py-3 text-sm" 
                              placeholder="Pega la URL de la imagen..." 
                              value={formData.avatar?.startsWith('data:') ? 'Imagen Cargada Localmente' : formData.avatar} 
                              onChange={e => setFormData({...formData, avatar: e.target.value})} 
                            />
                            <p className="text-[9px] text-zinc-600 font-medium italic">
                              * Haz clic en el recuadro para subir un archivo local o pega una URL arriba.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 col-span-1 md:col-span-2">
                        <label className="label-executive">Cumpleaños</label>
                        <input type="date" className="input-core" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} />
                      </div>
                      <div className="col-span-1 md:col-span-2 mt-2 pt-6 border-t border-white/5 space-y-6">
                        <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                          <Sparkles size={14} className="text-primary" /> Contexto del Encuentro
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                          <div className="space-y-3">
                            <label className="label-executive">Fecha y Hora del Encuentro</label>
                            <input 
                              type="datetime-local"
                              className="input-core" 
                              value={formData.captureMetadata?.capturedAt ? new Date(formData.captureMetadata.capturedAt).toISOString().slice(0,16) : ''} 
                              onChange={e => setFormData({
                                ...formData, 
                                captureMetadata: { ...formData.captureMetadata, capturedAt: e.target.value ? new Date(e.target.value).toISOString() : '' } as any
                              })} 
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="label-executive">Lugar del Encuentro</label>
                            <input 
                              className="input-core" 
                              placeholder="Ej. Restaurante Cipriani, GPS..." 
                              value={formData.captureMetadata?.meetingLocation || ''} 
                              onChange={e => setFormData({
                                ...formData, 
                                captureMetadata: { ...formData.captureMetadata, meetingLocation: e.target.value } as any
                              })} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'intl' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                      <div className="space-y-3">
                        <label className="label-executive">Pareja / Cónyuge</label>
                        <input className="input-core" placeholder="Nombre" value={formData.spouseName} onChange={e => setFormData({...formData, spouseName: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label className="label-executive">Cumpleaños Pareja</label>
                        <input type="date" className="input-core" value={formData.spouseBirthday} onChange={e => setFormData({...formData, spouseBirthday: e.target.value})} />
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-3">
                        <label className="label-executive">Hijos (Nombres separados por coma)</label>
                        <input className="input-core" placeholder="Ej. Mateo, Sofía" value={formData.children} onChange={e => setFormData({...formData, children: e.target.value})} />
                      </div>
                      <div className="col-span-1 md:col-span-2 p-4 lg:p-6 rounded-2xl bg-primary/5 border border-primary/10">
                        <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-2 font-mono italic">Nota de Inteligencia:</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">Saber los nombres de su familia te permite un rompehielo Nivel 3. Úsalo con discreción ejecutiva.</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'int' && (
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="label-executive">Pasiones (Separados por coma)</label>
                        <input className="input-core" placeholder="Ej. F1, Vinos, Golf, Relojes" value={formData.hobbies} onChange={e => setFormData({...formData, hobbies: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label className="label-executive">Obsesión Actual / Meta Personal</label>
                        <textarea className="input-core h-32 resize-none" placeholder="¿En qué está enfocado ahora mismo?" value={formData.personalGoal} onChange={e => setFormData({...formData, personalGoal: e.target.value})} />
                      </div>
                      <div className="space-y-3">
                        <label className="label-executive">Puntuación de Relación inicial: {formData.relationshipScore}%</label>
                        <input type="range" className="w-full h-1 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary" value={formData.relationshipScore} onChange={e => setFormData({...formData, relationshipScore: parseInt(e.target.value)})} />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Action Bar */}
              <div className="pt-8 mt-auto flex justify-between items-center gap-6 border-t border-white/5">
                <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-mono font-black">
                  {activeTab === 'prof' ? 'Paso 1 de 3' : activeTab === 'intl' ? 'Paso 2 de 3' : 'Finalizar Perfil'}
                </p>
                <div className="flex gap-4">
                  {activeTab !== 'prof' && (
                    <button 
                      type="button"
                      onClick={() => setActiveTab(activeTab === 'int' ? 'intl' : 'prof')}
                      className="px-6 lg:px-8 py-3 lg:py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all"
                    >
                      Atrás
                    </button>
                  )}
                  {activeTab !== 'int' ? (
                    <button 
                      type="button"
                      onClick={() => setActiveTab(activeTab === 'prof' ? 'intl' : 'int')}
                      className="bg-zinc-800 text-white px-6 lg:px-10 py-3 lg:py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all border border-white/5 shadow-xl"
                    >
                      Siguiente
                    </button>
                  ) : (
                    <button type="submit" className="bg-primary text-white px-6 lg:px-10 py-3 lg:py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest glow-red hover:scale-105 active:scale-95 transition-all shadow-xl">
                      {contact ? t('dashboard.saveChanges') : 'Completar Perfil'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ContactsView = ({ 
  appContacts, 
  onExpandContact,
  onAddContact,
  onEditContact,
  onDeleteContact 
}: { 
  appContacts: Contact[], 
  onExpandContact: (c: Contact) => void,
  onAddContact: () => void,
  onEditContact: (c: Contact) => void,
  onDeleteContact: (id: string) => void
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);

  const filtered = filterContacts(appContacts, search);

  return (
    <div className="p-4 sm:p-6 lg:p-10 h-full flex flex-col space-y-6 lg:space-y-10 overflow-x-hidden overflow-y-auto">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 flex-shrink-0">
        <div>
          <h2 className="text-3xl lg:text-5xl font-black tracking-tighter mb-2 uppercase">{t('sidebar.contacts')}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mono">Total: {appContacts.length} Perfiles</p>
            </div>
            <div className="flex bg-white/5 border border-white/5 rounded-xl p-1 gap-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-zinc-600 hover:text-white'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-white' : 'text-zinc-600 hover:text-white'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative group w-full lg:w-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors" />
            <input 
              className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all w-full lg:w-80"
              placeholder={t('dashboard.search') + " (ej: company:Thorne, score>80)..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={onAddContact}
            className="bg-primary text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-3 glow-red hover:scale-105 transition-all font-black uppercase tracking-widest text-xs"
          >
            <Plus size={18} strokeWidth={3} />
            {t('dashboard.addContact')}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map(contact => (
              <motion.div 
                key={contact.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="premium-card p-6 flex items-center gap-6 group hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
                onClick={() => onExpandContact(contact)}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative">
                  <ContactAvatar src={contact.avatar} name={contact.name} className="w-20 h-20 rounded-2xl group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-zinc-900 shadow-glow" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xl font-black text-white truncate mb-1 tracking-tight">{contact.name}</h4>
                  <p className="text-xs font-bold text-copper-light uppercase tracking-widest truncate">{contact.role}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium mt-1 truncate">{contact.company}</p>
                </div>

                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditContact(contact);
                    }}
                    className="p-2 rounded-lg bg-zinc-900/80 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setContactToDelete(contact.id);
                    }}
                    className="p-2 rounded-lg bg-zinc-900/80 text-zinc-500 hover:text-primary hover:bg-zinc-800 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-12 px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 mono">
              <div className="col-span-4">Nombre / Perfil</div>
              <div className="col-span-3">Empresa / Cargo</div>
              <div className="col-span-2">Relación</div>
              <div className="col-span-2">Estado</div>
              <div className="col-span-1 text-right">Acción</div>
            </div>
            {filtered.map(contact => (
              <motion.div 
                key={contact.id}
                layout
                className="grid grid-cols-12 items-center px-6 py-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer group"
                onClick={() => onExpandContact(contact)}
              >
                <div className="col-span-4 flex items-center gap-4">
                  <ContactAvatar src={contact.avatar} name={contact.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <h5 className="font-bold text-sm text-white group-hover:text-primary transition-colors">{contact.name}</h5>
                    <p className="text-[10px] text-muted-foreground mono">{contact.email}</p>
                  </div>
                </div>
                <div className="col-span-3">
                  <p className="text-xs font-bold text-zinc-300">{contact.company}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{contact.role}</p>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary/50" style={{ width: `${contact.relationshipScore}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 mono">{contact.relationshipScore}%</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success shadow-glow" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Activo</span>
                  </div>
                </div>
                <div className="col-span-1 flex justify-end items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditContact(contact);
                    }}
                    className="p-2 opacity-0 group-hover:opacity-100 rounded-lg text-zinc-500 hover:text-white transition-all"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setContactToDelete(contact.id);
                    }}
                    className="p-2 opacity-0 group-hover:opacity-100 rounded-lg text-zinc-500 hover:text-primary transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {contactToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/80"
            onClick={() => setContactToDelete(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] p-10 text-center space-y-8 shadow-[0_0_100px_rgba(249,17,23,0.15)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Trash2 size={32} className="text-primary animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tighter text-white uppercase">¿Eliminar Inteligencia?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Estás a punto de borrar permanentemente este perfil ejecutivo. Esta acción es irreversible y eliminará todo el historial de interacciones.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    onDeleteContact(contactToDelete);
                    setContactToDelete(null);
                  }}
                  className="w-full bg-primary text-white font-black uppercase tracking-widest py-5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(239,68,68,0.2)]"
                >
                  Confirmar Eliminación
                </button>
                <button 
                  onClick={() => setContactToDelete(null)}
                  className="w-full bg-white/5 text-zinc-500 font-black uppercase tracking-widest py-5 rounded-2xl hover:bg-white/10 hover:text-white transition-all"
                >
                  Protocolo de Aborto
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedContact, setExpandedContact] = useState<Contact | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [appContacts, setAppContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('core_contacts');
    return saved ? JSON.parse(saved) : contacts;
  });
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [externalSelectedContactId, setExternalSelectedContactId] = useState<string | null>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('core_contacts', JSON.stringify(appContacts));
  }, [appContacts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <LanguageProvider>
      <div className="flex h-screen bg-black text-foreground selection:bg-primary/30 overflow-hidden relative">
        {/* Command Palette */}
        <CommandPalette 
          isOpen={isCommandPaletteOpen} 
          onClose={() => setIsCommandPaletteOpen(false)}
          contacts={appContacts}
          onSelectContact={(c) => {
            setExternalSelectedContactId(c.id);
            setActiveTab('dashboard');
          }}
        />

        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-6 right-6 z-[300] bg-primary text-white px-6 py-4 rounded-2xl shadow-glow font-black uppercase tracking-widest text-[10px] flex items-center gap-3"
            >
              <CheckCircle size={16} />
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <ContactModal 
          isOpen={isAddModalOpen || !!contactToEdit}
          contact={contactToEdit}
          onClose={() => {
            setIsAddModalOpen(false);
            setContactToEdit(null);
          }}
          onSave={(contactData) => {
            if (contactToEdit) {
              setAppContacts(prev => prev.map(c => c.id === contactData.id ? contactData : c));
              setToastMessage('Perfil actualizado correctamente');
            } else {
              setAppContacts([contactData, ...appContacts]);
              setToastMessage('Contacto creado correctamente');
            }
            setTimeout(() => setToastMessage(null), 3000);
          }}
        />

        {/* Immersive Background Layers */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black" />
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] core-pulse pointer-events-none" />
          <div className="absolute inset-0 noise" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
        </div>

        <SidebarWrapper activeTab={activeTab} setActiveTab={setActiveTab} setIsAddModalOpen={setIsAddModalOpen} />
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} setIsAddModalOpen={setIsAddModalOpen} />
        
        <main className="flex-1 relative overflow-hidden z-10">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full relative"
              >
                <Dashboard 
                  onExpandContact={setExpandedContact} 
                  appContacts={appContacts}
                  forceSelectedContactId={externalSelectedContactId}
                  setIsAddModalOpen={setIsAddModalOpen}
                  onEditContact={(c) => setContactToEdit(c)}
                />
              </motion.div>
            )}
            {activeTab === 'contacts' && (
              <motion.div
                key="contacts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <ContactsView 
                  appContacts={appContacts}
                  onExpandContact={setExpandedContact}
                  onAddContact={() => setIsAddModalOpen(true)}
                  onEditContact={(c) => setContactToEdit(c)}
                  onDeleteContact={(id) => {
                    setAppContacts(prev => prev.filter(c => c.id !== id));
                  }}
                />
              </motion.div>
            )}
            {activeTab !== 'dashboard' && activeTab !== 'contacts' && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-center h-full text-muted-foreground flex-col gap-6"
              >
                <div className="w-16 h-16 rounded-full border border-white/5 flex-center relative">
                  <div className="absolute inset-0 border border-primary/20 rounded-full animate-ping" />
                  <Zap size={32} strokeWidth={1} className="opacity-20" />
                </div>
                <TranslationPlaceholder />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Executive Detail Modal */}
        <AnimatePresence>
          {expandedContact && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-8 backdrop-blur-xl bg-black/60"
              onClick={() => setExpandedContact(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="premium-card max-w-2xl w-full p-0 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                onClick={e => e.stopPropagation()}
              >
                <div className="relative aspect-[4/3] w-full group">
                    <ContactAvatar 
                      src={expandedContact.avatar} 
                      name={expandedContact.name} 
                      className="w-full h-full grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" 
                      size="xl"
                    />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <button 
                    onClick={() => setExpandedContact(null)}
                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-primary transition-colors"
                  >
                    <X size={20} />
                  </button>
                  
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-[1px] w-12 bg-primary" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mono">AI Executive Intelligence</span>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tight">{expandedContact.name}</h2>
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">{expandedContact.role} @ {expandedContact.company}</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setContactToEdit(expandedContact);
                          setExpandedContact(null);
                        }}
                        className="px-4 py-2 rounded-lg bg-primary/20 border border-primary/30 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary transition-all flex items-center gap-2"
                      >
                        <Edit3 size={12} />
                        {t('dashboard.editContact')}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-10 bg-zinc-950/50">
                  <div className="flex gap-6 items-start">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={24} className="text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4 tracking-[0.2em]">Rompehielo Recomendado</h4>
                      <p className="text-xl font-medium text-white italic leading-relaxed leading-snug tracking-tight">
                        "{mockAIBriefings[expandedContact.id as keyof typeof mockAIBriefings]?.icebreaker || "No hay rompehielo disponible"}"
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LanguageProvider>
  );
}



// Wrapper to useTranslation hook safely
const SidebarWrapper = ({ activeTab, setActiveTab, setIsAddModalOpen }: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void,
  setIsAddModalOpen: (open: boolean) => void
}) => {
  return <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} setIsAddModalOpen={setIsAddModalOpen} />;
};

const TranslationPlaceholder = () => {
  const { t } = useTranslation();
  return <p className="mono uppercase tracking-widest text-xs">{t('common.underConstruction')}</p>;
};

