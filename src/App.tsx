import { useState, createContext, useContext, useEffect, useRef, Component } from 'react';
import React from 'react';
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
  CheckCircle,
  AlertCircle,
  Camera,
  Mic,
  Check,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday } from 'date-fns';
import { n8nService, type InvestigateResult } from './services/n8nService';
import { contactService } from './services/contactService';
type Language = 'en' | 'es';

const contacts_fallback = [
  {
    id: '1',
    name: 'Marcus Thorne',
    role: 'CEO',
    company: 'Thorne Industries',
    email: 'marcus@thorne.com',
    location: 'Zurich, Switzerland',
    avatar: '/avatars/marcus.png',
    family: { spouse: 'Elena', children: ['Sophia (8)', 'Leo (5)'] },
    hobbies: ['Vintage Watches', 'Sailing', 'Quantum Computing'],
    interactions: [
      { id: 'int1', date: '2025-11-12T10:00:00Z', type: 'meeting', summary: 'Discussed expansion.', sentiment: 'positive' }
    ],
    relationshipScore: 88,
    notes: 'Very detail-oriented.'
  }
];

const meetings_fallback = [
  { id: 'm1', title: 'Strategic Partnership', startTime: '2026-04-28T09:00:00Z', attendees: ['1'], status: 'upcoming' }
];

const translations_fallback = {
  en: {
    sidebar: { dashboard: 'Dashboard', contacts: 'Contacts' },
    dashboard: { title: 'Dashboard', syncStatus: 'Synced', justNow: 'Just now', search: 'Search', contactIntelligence: 'Intelligence', meetingIntelligence: 'Briefing' },
    intelligence: { relationshipScore: 'Score', familyArchitecture: 'Family', spouse: 'Spouse', children: 'Children' },
    common: { underConstruction: 'Construction', intelligenceCRM: 'CRM' }
  },
  es: {
    sidebar: { dashboard: 'Panel Control', contacts: 'Contactos' },
    dashboard: { title: 'Panel Control', syncStatus: 'Sincronizado', justNow: 'Ahora', search: 'Buscar', contactIntelligence: 'Inteligencia', meetingIntelligence: 'Briefing' },
    intelligence: { relationshipScore: 'Relación', familyArchitecture: 'Familia', spouse: 'Cónyuge', children: 'Hijos' },
    common: { underConstruction: 'En Construcción', intelligenceCRM: 'CRM' }
  }
};

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
    let result: any = (translations_fallback as any)[language];
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
// --- Error Monitoring ---
const ErrorDisplay = ({ error }: { error: Error }) => (
  <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center p-10 z-[500] font-mono">
    <div className="max-w-2xl w-full bg-red-950/20 border border-red-500/30 rounded-3xl p-8 space-y-6">
      <div className="flex items-center gap-4 text-red-500">
        <AlertCircle size={32} />
        <h1 className="text-xl font-black uppercase tracking-widest">CRITICAL SYSTEM FAILURE</h1>
      </div>
      <div className="bg-black/50 p-6 rounded-xl border border-white/5 overflow-auto max-h-[40vh]">
        <p className="text-red-400 font-bold mb-2">Error: {error.message}</p>
        <pre className="text-[10px] text-zinc-500 leading-relaxed">{error.stack}</pre>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="w-full bg-red-500 text-white font-black uppercase tracking-widest py-4 rounded-xl hover:bg-red-600 transition-all"
      >
        Reboot System
      </button>
    </div>
  </div>
);

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorDisplay error={this.state.error} />;
    }
    return this.props.children;
  }
}

// --- Components ---

// --- Components ---

function Sidebar({ activeTab, setActiveTab, setIsAddModalOpen }: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void,
  setIsAddModalOpen: (open: boolean) => void
}) {
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

function MobileNav({ activeTab, setActiveTab, setIsAddModalOpen }: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void,
  setIsAddModalOpen: (open: boolean) => void
}) {
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

function AIBriefingCard({ contactId }: { contactId: string }) {
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

function CommandPalette({ 
  isOpen, 
  onClose, 
  contacts, 
  onSelectContact 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  contacts: Contact[],
  onSelectContact: (c: Contact) => void
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [hoveredContactId, setHoveredContactId] = useState<string | null>(null);
  
  const filteredContacts = query === '' 
    ? contacts.slice(0, 5) 
    : filterContacts(contacts, query);

  const hoveredContact = contacts.find(c => c.id === hoveredContactId);

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

// --- Atomic Components ---

function ContactAvatar({ 
  src, 
  name, 
  className = "w-12 h-12 rounded-2xl",
  size = "md"
}: { 
  src?: string, 
  name: string, 
  className?: string,
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
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

function Dashboard({ onExpandContact, forceSelectedContactId, appContacts, setIsAddModalOpen, onEditContact }: { 
  onExpandContact: (c: Contact) => void,
  forceSelectedContactId?: string | null,
  appContacts: Contact[],
  setIsAddModalOpen: (open: boolean) => void,
  onEditContact: (c: Contact) => void
}) {
  const { t } = useTranslation();
  const [selectedMeeting, setSelectedMeeting] = useState(meetings?.[0] || null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Sync with external selection (Command Palette)
  useEffect(() => {
    if (forceSelectedContactId) {
      setSelectedContactId(forceSelectedContactId);
      const meetingWithContact = meetings?.find(m => m.attendees.includes(forceSelectedContactId));
      if (meetingWithContact) setSelectedMeeting(meetingWithContact);
    }
  }, [forceSelectedContactId]);
  
  const activeContact = selectedContactId 
    ? appContacts.find(c => c.id === selectedContactId) 
    : (selectedMeeting?.attendees?.[0] ? appContacts.find(c => c.id === selectedMeeting.attendees[0]) : appContacts[0]);

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
                  selectedMeeting?.id === meeting.id ? 'border-primary bg-primary/5' : 'border-border glass hover:border-muted-foreground'
                }`}
                onClick={() => {
                  setSelectedMeeting(meeting);
                  setSelectedContactId(null);
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mono">
                      {(() => {
                        try {
                          const date = new Date(meeting.startTime);
                          if (isNaN(date.getTime())) return 'Invalid Date';
                          return isToday(date) ? t('dashboard.today') : format(date, 'MMM d');
                        } catch (e) {
                          return 'Invalid Date';
                        }
                      })()}
                    </p>
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



const CONTACT_CATEGORIES = [
  { id: 'private_investor', label: 'Private Investor', group: 'Retail' },
  { id: 'hnw', label: 'HNW', group: 'Retail' },
  { id: 'vip', label: 'VIP', group: 'Retail' },
  { id: 'broker_buy', label: 'Broker (Buy)', group: 'Instituciones' },
  { id: 'broker_sell', label: 'Broker (Sell)', group: 'Instituciones' },
  { id: 'family_office', label: 'Family Office', group: 'Funds' },
  { id: 'hedge_fund', label: 'Hedge Fund', group: 'Funds' },
  { id: 'long_term_fund', label: 'Long Term Fund', group: 'Funds' },
];

function ContactModal({ isOpen, onClose, onSave, contact }: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (data: Partial<Contact>) => void,
  contact?: Contact | null
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'prof' | 'intl' | 'int'>('prof');
  const [quickAddStep, setQuickAddStep] = useState<'CAPTURE' | 'NOTES' | 'CATEGORY' | 'SUCCESS'>('CAPTURE');
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [investigateResults, setInvestigateResults] = useState<InvestigateResult | null>(null);
  const [cardImages, setCardImages] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [suggestedAction, setSuggestedAction] = useState<{ type: string, label: string } | null>(null);

  useEffect(() => {
    const text = formData.personalGoal.toLowerCase();
    if (text.includes('llamar') || text.includes('call')) {
      setSuggestedAction({ type: 'call', label: '📞 Programar llamada' });
    } else if (text.includes('reunion') || text.includes('reunión') || text.includes('meeting')) {
      setSuggestedAction({ type: 'meeting', label: '📅 Agendar reunión' });
    } else if (text.includes('recordar') || text.includes('remind')) {
      setSuggestedAction({ type: 'note', label: '🔔 Crear recordatorio' });
    } else {
      setSuggestedAction(null);
    }
  }, [formData.personalGoal]);
  
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
    intelligence: { icebreaker: '' },
    category: ''
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab('prof');
      if (!contact) setQuickAddStep('CAPTURE');
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

  const handleCardFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const newImages = [...cardImages, file];
    setCardImages(newImages);
    if (cardInputRef.current) cardInputRef.current.value = '';

    // If it's a new contact, we start background processing after the first or second photo
    // But for the frictionless flow, we'll let the user decide when to move to notes
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const text = await n8nService.transcribeAudio(audioBlob);
          setFormData(prev => ({ ...prev, personalGoal: prev.personalGoal ? `${prev.personalGoal}\n${text}` : text }));
        } catch (error) {
          console.error('Transcription failed:', error);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access denied:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Stop all tracks to release the microphone
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
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
      avatar: formData.avatar || '',
      captureMetadata: formData.captureMetadata,
      family: { 
        spouse: formData.spouseName, 
        children: formData.children ? formData.children.split(',').map(s => s.trim()) : [] 
      },
      hobbies: formData.hobbies ? formData.hobbies.split(',').map(s => s.trim()) : [],
      interactions: contact?.interactions || [],
      notes: formData.personalGoal,
      category: formData.category,
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
        className="fixed inset-0 z-[250] flex items-center justify-center p-0 lg:p-4 backdrop-blur-2xl bg-black/90"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 30, opacity: 0 }}
          className="w-full h-full lg:h-[700px] lg:max-w-3xl bg-zinc-950 border-0 lg:border lg:border-white/5 lg:rounded-[3rem] shadow-[0_0_150px_rgba(249,17,23,0.15)] overflow-hidden flex flex-col relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Close Button (Universal) */}
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 z-[160] w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-all group"
          >
            <X size={24} className="text-zinc-500 group-hover:text-white" />
          </button>

          {/* Quick Add Flow for New Contacts */}
          {!contact ? (
            <div className="flex-1 flex flex-col h-full">
              <AnimatePresence mode="wait">
                {/* STEP 1: CAPTURE PHOTO */}
                {quickAddStep === 'CAPTURE' && (
                  <motion.div 
                    key="step-capture"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="flex-1 flex flex-col p-8 lg:p-12"
                  >
                    <div className="mb-12">
                      <h3 className="text-4xl lg:text-5xl font-black tracking-tighter text-white uppercase mb-2">Capturar Tarjeta</h3>
                      <p className="text-xs text-primary font-black uppercase tracking-[0.3em] mono">Unidad de Inteligencia</p>
                    </div>

                    <div className="flex-1 flex flex-col gap-6 justify-center">
                      <div className="grid grid-cols-2 gap-4 h-64 lg:h-80">
                        {[0, 1].map((idx) => (
                          <button 
                            key={idx}
                            onClick={() => cardInputRef.current?.click()}
                            className="relative group overflow-hidden rounded-[2rem] border-2 border-dashed border-white/10 hover:border-primary/50 transition-all flex flex-col items-center justify-center bg-white/[0.02]"
                          >
                            {cardImages[idx] ? (
                              <img 
                                src={URL.createObjectURL(cardImages[idx])} 
                                className="absolute inset-0 w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" 
                                alt={`Card side ${idx}`}
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-4">
                                <Camera size={32} className="text-zinc-700 group-hover:text-primary transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                  {idx === 0 ? 'Frente' : 'Reverso (Opcional)'}
                                </span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                      
                      <input type="file" ref={cardInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleCardFileChange} />
                    </div>

                    <div className="mt-auto pt-8">
                      <button 
                        onClick={() => {
                          if (cardImages.length > 0) {
                            processCardImages();
                          }
                          setQuickAddStep('NOTES');
                        }}
                        className="w-full bg-primary text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-glow flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        Continuar <ArrowRight size={20} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: AUDIO NOTES */}
                {quickAddStep === 'NOTES' && (
                  <motion.div 
                    key="step-notes"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="flex-1 flex flex-col p-8 lg:p-12"
                  >
                    <div className="mb-12">
                      <h3 className="text-4xl lg:text-5xl font-black tracking-tighter text-white uppercase mb-2">Notas de Voz</h3>
                      <p className="text-xs text-primary font-black uppercase tracking-[0.3em] mono">Dictado Estratégico</p>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center gap-12">
                      <div className="relative">
                        {isRecording && (
                          <motion.div 
                            animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 bg-primary rounded-full"
                          />
                        )}
                        <button 
                          onMouseDown={startRecording}
                          onMouseUp={stopRecording}
                          onTouchStart={startRecording}
                          onTouchEnd={stopRecording}
                          className={`relative z-10 w-32 h-32 lg:w-40 lg:h-40 rounded-full flex items-center justify-center transition-all ${
                            isRecording ? 'bg-primary scale-110 shadow-glow' : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <Mic size={48} className={isRecording ? 'text-white' : 'text-zinc-400'} />
                        </button>
                      </div>
                      
                      <div className="w-full max-w-md text-center space-y-4">
                        <p className="text-sm font-bold text-zinc-400">
                          {isRecording ? 'Grabando...' : isTranscribing ? 'Procesando Inteligencia...' : 'Mantén pulsado para dictar notas sobre este contacto'}
                        </p>
                        
                        <textarea 
                          className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-white text-sm italic min-h-[120px] focus:outline-none focus:border-primary/30 transition-all no-scrollbar"
                          placeholder="Las notas transcritas aparecerán aquí..."
                          value={formData.personalGoal}
                          onChange={e => setFormData({...formData, personalGoal: e.target.value})}
                        />

                        <AnimatePresence>
                          {suggestedAction && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="flex justify-center"
                            >
                              <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-glow-sm">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Acción Detectada:</span>
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">{suggestedAction.label}</span>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    // Simulated acceptance: for now just visual feedback
                                    setFormData(prev => ({ ...prev, personalGoal: `${prev.personalGoal}\n[ACCIÓN: ${suggestedAction.label}]` }));
                                    setSuggestedAction(null);
                                  }}
                                  className="ml-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center hover:scale-110 transition-all"
                                >
                                  <Check size={12} />
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="mt-auto pt-8">
                      <button 
                        onClick={() => setQuickAddStep('CATEGORY')}
                        className="w-full bg-primary text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-glow flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
                      >
                        Categorizar <ArrowRight size={20} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: CATEGORY */}
                {quickAddStep === 'CATEGORY' && (
                  <motion.div 
                    key="step-category"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="flex-1 flex flex-col p-8 lg:p-12 overflow-y-auto no-scrollbar"
                  >
                    <div className="mb-12">
                      <h3 className="text-4xl lg:text-5xl font-black tracking-tighter text-white uppercase mb-2">Categoría</h3>
                      <p className="text-xs text-primary font-black uppercase tracking-[0.3em] mono">Segmentación Ejecutiva</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-12">
                      {CONTACT_CATEGORIES.map((cat) => (
                        <button 
                          key={cat.id}
                          onClick={() => setFormData({...formData, category: cat.label})}
                          className={`p-6 rounded-[2rem] border transition-all text-left group flex flex-col gap-2 ${
                            formData.category === cat.label 
                              ? 'bg-primary border-primary text-white shadow-glow' 
                              : 'bg-white/5 border-white/5 text-zinc-500 hover:border-primary/50 hover:text-white'
                          }`}
                        >
                          <span className={`text-[8px] font-black uppercase tracking-widest opacity-50 ${formData.category === cat.label ? 'text-white' : 'text-primary'}`}>
                            {cat.group}
                          </span>
                          <span className="text-xs lg:text-sm font-black uppercase tracking-tight leading-none">
                            {cat.label}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-auto pt-8">
                      <button 
                        onClick={(e) => {
                          handleSubmit(e as any);
                          setQuickAddStep('SUCCESS');
                        }}
                        className="w-full bg-primary text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-glow flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
                      >
                        Finalizar <ArrowRight size={20} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: SUCCESS */}
                {quickAddStep === 'SUCCESS' && (
                  <motion.div 
                    key="step-success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 text-center"
                  >
                    <div className="w-32 h-32 bg-success/20 rounded-full flex items-center justify-center text-success mb-8 animate-bounce shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                      <CheckCircle size={64} />
                    </div>
                    <h3 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter mb-4">¡Éxito!</h3>
                    <p className="text-zinc-400 font-medium mb-12 max-w-xs uppercase text-[10px] tracking-widest">
                      Inteligencia capturada. La IA está procesando los detalles en segundo plano.
                    </p>
                    <button 
                      onClick={onClose}
                      className="w-full max-w-xs bg-white text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] hover:scale-[1.05] transition-all"
                    >
                      Volver al Dashboard
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Background Process Indicator */}
              {(isScanning || isInvestigating) && quickAddStep !== 'SUCCESS' && (
                <div className="absolute bottom-10 left-10 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-glow" />
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary mono">AI Background Engine Active</span>
                </div>
              )}
            </div>
          ) : (
            /* Standard Edit Flow */
            <div className="flex-1 flex flex-col h-full">
              {/* Investigation Audit Overlay (Still useful for edits) */}
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
                <div>
                  <h3 className="text-3xl lg:text-4xl font-black tracking-tighter text-white uppercase">
                    {t('dashboard.editContact')}
                  </h3>
                  <p className="text-[10px] text-primary uppercase tracking-[0.4em] font-black mt-2 font-mono">
                    {isInvestigating ? 'AI Deep Search Active...' : 'Intelligence Unit v2.0'}
                  </p>
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
                      <span className="hidden sm:inline">{tab.label}</span>
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
                            <label className="label-executive">Página Web</label>
                            <input className="input-core" placeholder="https://thecore.com" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                          </div>
                          <div className="space-y-3">
                            <label className="label-executive">Email Corporativo</label>
                            <input required type="email" className="input-core" placeholder="alex@company.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                          </div>
                          <div className="col-span-1 md:col-span-2 space-y-3">
                            <label className="label-executive">Dirección / Ubicación</label>
                            <input className="input-core" placeholder="Ciudad, País" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                          </div>
                          <div className="col-span-1 md:col-span-2 space-y-3">
                            <label className="label-executive">Categoría</label>
                            <select 
                              className="input-core" 
                              value={formData.category} 
                              onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                              <option value="">Sin Categoría</option>
                              {CONTACT_CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.label}>{cat.group}: {cat.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {activeTab === 'intl' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                          <div className="space-y-3">
                            <label className="label-executive">Pareja / Cónyuge</label>
                            <input className="input-core" placeholder="Nombre" value={formData.spouseName} onChange={e => setFormData({...formData, spouseName: e.target.value})} />
                          </div>
                          <div className="col-span-1 md:col-span-2 space-y-3">
                            <label className="label-executive">Hijos (Separados por coma)</label>
                            <input className="input-core" placeholder="Ej. Mateo, Sofía" value={formData.children} onChange={e => setFormData({...formData, children: e.target.value})} />
                          </div>
                        </div>
                      )}

                      {activeTab === 'int' && (
                        <div className="space-y-8">
                          <div className="space-y-3">
                            <label className="label-executive">Pasiones</label>
                            <input className="input-core" placeholder="Ej. F1, Vinos, Golf" value={formData.hobbies} onChange={e => setFormData({...formData, hobbies: e.target.value})} />
                          </div>
                          <div className="space-y-3">
                            <label className="label-executive">Notas / Bio</label>
                            <textarea className="input-core h-32 resize-none" placeholder="Contexto personal..." value={formData.personalGoal} onChange={e => setFormData({...formData, personalGoal: e.target.value})} />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  <div className="pt-8 mt-auto flex justify-end gap-4">
                    <button type="submit" className="bg-primary text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest glow-red hover:scale-105 transition-all shadow-xl">
                      {t('dashboard.saveChanges')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};


function ContactsView({ 
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
}) {
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

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedContact, setExpandedContact] = useState<Contact | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [appContacts, setAppContacts] = useState<Contact[]>(contacts_fallback as Contact[]);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);
  const [externalSelectedContactId, setExternalSelectedContactId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persistence: Initial Load
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const data = await contactService.getAll();
        if (Array.isArray(data)) {
          setAppContacts(data.length > 0 ? data : contacts_fallback as Contact[]);
        }
      } catch (error) {
        console.error('Failed to load contacts from server:', error);
      }
    };
    loadContacts();
  }, []);

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
    <ErrorBoundary>
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
          onSave={async (contactData) => {
            try {
              if (contactToEdit) {
                const updated = await contactService.update(contactData.id, contactData);
                setAppContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
                setToastMessage('Perfil actualizado correctamente');
              } else {
                const created = await contactService.create(contactData);
                setAppContacts([created, ...appContacts]);
                setToastMessage('Contacto creado correctamente');
              }
            } catch (error) {
              console.error('Failed to save contact:', error);
              setToastMessage('Error al guardar contacto');
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
                  onDeleteContact={async (id) => {
                    try {
                      await contactService.delete(id);
                      setAppContacts(prev => prev.filter(c => c.id !== id));
                      setToastMessage('Contacto eliminado');
                    } catch (error) {
                      console.error('Failed to delete contact:', error);
                      setToastMessage('Error al eliminar contacto');
                    }
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
    </ErrorBoundary>
  );
}




