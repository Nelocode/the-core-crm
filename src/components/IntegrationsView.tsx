import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Link, Save, CheckCircle, AlertTriangle, Loader2, Send, Bell } from 'lucide-react';
import { useTranslation } from '../i18n';

export default function IntegrationsView() {
  const { t } = useTranslation();
  const [integrations, setIntegrations] = useState<Record<string, { value: string; isEnabled: boolean }>>({
    webhook_url: { value: '', isEnabled: false },
    mailchimp_key: { value: '', isEnabled: false },
    mailchimp_audience: { value: '', isEnabled: false },
    mailchimp_enabled: { value: 'false', isEnabled: false },
    
    // Briefing integrations
    briefing_enabled: { value: 'false', isEnabled: false },
    briefing_provider: { value: 'telegram', isEnabled: true },
    briefing_time: { value: '07:30', isEnabled: true },
    telegram_bot_token: { value: '', isEnabled: true },
    telegram_chat_id: { value: '', isEnabled: true },
    whatsapp_twilio_sid: { value: '', isEnabled: true },
    whatsapp_twilio_token: { value: '', isEnabled: true },
    whatsapp_recipient_number: { value: '', isEnabled: true }
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingBriefing, setIsTestingBriefing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const API_BASE = import.meta.env.VITE_CORE_ENGINE_URL || 'http://localhost:3001';

  // Fetch integration configurations
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/integrations`);
        if (response.ok) {
          const data = await response.json();
          const mapped: Record<string, { value: string; isEnabled: boolean }> = {
            webhook_url: { value: '', isEnabled: false },
            mailchimp_key: { value: '', isEnabled: false },
            mailchimp_audience: { value: '', isEnabled: false },
            mailchimp_enabled: { value: 'false', isEnabled: false },
            
            // Briefing integrations
            briefing_enabled: { value: 'false', isEnabled: false },
            briefing_provider: { value: 'telegram', isEnabled: true },
            briefing_time: { value: '07:30', isEnabled: true },
            telegram_bot_token: { value: '', isEnabled: true },
            telegram_chat_id: { value: '', isEnabled: true },
            whatsapp_twilio_sid: { value: '', isEnabled: true },
            whatsapp_twilio_token: { value: '', isEnabled: true },
            whatsapp_recipient_number: { value: '', isEnabled: true }
          };
          
          data.forEach((item: any) => {
            mapped[item.key] = { value: item.value, isEnabled: item.isEnabled };
          });
          
          setIntegrations(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch integrations config:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIntegrations();
  }, [API_BASE]);

  const handleInputChange = (key: string, value: string) => {
    setIntegrations(prev => ({
      ...prev,
      [key]: { ...prev[key], value }
    }));
  };

  const handleToggle = async (key: string) => {
    const current = integrations[key];
    const newState = !current.isEnabled;
    
    setIntegrations(prev => ({
      ...prev,
      [key]: { ...prev[key], isEnabled: newState }
    }));

    await handleSave(key, current.value, newState);
  };

  const handleSave = async (key: string, value: string, isEnabled: boolean) => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const response = await fetch(`${API_BASE}/api/integrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, isEnabled })
      });
      
      if (!response.ok) throw new Error(t('integrations.saveError'));
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || t('integrations.saveError'));
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBriefingConfig = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const keysToSave = [
        'briefing_time',
        'briefing_provider',
        'telegram_bot_token',
        'telegram_chat_id',
        'whatsapp_twilio_sid',
        'whatsapp_twilio_token',
        'whatsapp_recipient_number'
      ];

      for (const key of keysToSave) {
        await fetch(`${API_BASE}/api/integrations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            value: integrations[key].value,
            isEnabled: true
          })
        });
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || t('integrations.saveError'));
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestBriefing = async () => {
    setIsTestingBriefing(true);
    setTestStatus('idle');
    try {
      const response = await fetch(`${API_BASE}/api/briefings/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('integrations.connectError'));
      }

      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || t('integrations.testError'));
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 5000);
    } finally {
      setIsTestingBriefing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-6 md:px-10 lg:px-12 py-6 md:py-8 lg:py-10 h-full flex flex-col items-center justify-center space-y-3">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{t('integrations.loadingCenter')}</p>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-10 lg:px-12 pt-[calc(1.5rem+env(safe-area-inset-top))] md:pt-8 lg:pt-10 pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-10 h-full flex flex-col space-y-6 lg:space-y-10 overflow-y-auto no-scrollbar">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 flex-shrink-0">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-black tracking-tighter mb-2 uppercase">{t('sidebar.integrations')}</h2>
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full inline-block">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mono">
              {t('integrations.subtitle')}
            </p>
          </div>
        </div>
      </header>

      {saveStatus === 'success' && (
        <div className="bg-success/15 border border-success/35 text-success px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold max-w-5xl">
          <CheckCircle size={16} />
          {t('integrations.saveSuccess')}
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="bg-primary/10 border border-primary/20 text-red-400 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold max-w-5xl">
          <AlertTriangle size={16} />
          {errorMsg || t('integrations.saveError')}
        </div>
      )}

      {testStatus === 'success' && (
        <div className="bg-success/15 border border-success/35 text-success px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold max-w-5xl">
          <CheckCircle size={16} />
          {t('integrations.testSuccess')}
        </div>
      )}

      {testStatus === 'error' && (
        <div className="bg-primary/10 border border-primary/20 text-red-400 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold max-w-5xl">
          <AlertTriangle size={16} />
          {t('integrations.testError')}: {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
        
        {/* Executive Daily Briefing Card */}
        <div className="premium-card p-8 flex flex-col justify-between border border-white/5 bg-zinc-950/40 rounded-3xl relative overflow-hidden lg:col-span-2">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
          
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-primary animate-pulse">
                  <Bell size={22} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    {t('integrations.morningBriefing')}
                    <span className="bg-primary/10 border border-primary/20 text-primary text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Premium AI</span>
                  </h4>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Push Notifications (WhatsApp / Telegram)</p>
                </div>
              </div>
              <div className="relative">
                <input 
                  type="checkbox"
                  id="briefing-toggle"
                  checked={integrations.briefing_enabled.value === 'true' && integrations.briefing_enabled.isEnabled}
                  onChange={async () => {
                    const currentVal = integrations.briefing_enabled.value === 'true';
                    const newVal = !currentVal;
                    setIntegrations(prev => ({
                      ...prev,
                      briefing_enabled: { value: newVal ? 'true' : 'false', isEnabled: true }
                    }));
                    await handleSave('briefing_enabled', newVal ? 'true' : 'false', true);
                  }}
                  className="sr-only peer"
                />
                <label 
                  htmlFor="briefing-toggle"
                  className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-white cursor-pointer block"
                />
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              {t('integrations.briefingDesc')}
            </p>

            {integrations.briefing_enabled.value === 'true' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-6 pt-6 border-t border-white/5"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5 block">
                      {t('integrations.sendTime')}
                    </label>
                    <input 
                      type="time"
                      value={integrations.briefing_time.value}
                      onChange={e => handleInputChange('briefing_time', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5 block">
                      {t('integrations.channel')}
                    </label>
                    <select
                      value={integrations.briefing_provider.value}
                      onChange={e => handleInputChange('briefing_provider', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-2xl px-4 py-3.5 text-xs text-white focus:outline-none transition-all"
                    >
                      <option value="telegram" className="bg-zinc-950 text-white">
                        {t('integrations.telegramOption')}
                      </option>
                      <option value="whatsapp" className="bg-zinc-950 text-white">
                        {t('integrations.whatsappOption')}
                      </option>
                    </select>
                  </div>
                </div>

                {integrations.briefing_provider.value === 'telegram' ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2"
                  >
                    <div>
                      <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5 block">
                        {t('integrations.telegramToken')}
                      </label>
                      <input 
                        type="password"
                        placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQ..."
                        value={integrations.telegram_bot_token.value}
                        onChange={e => handleInputChange('telegram_bot_token', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5 block">
                        {t('integrations.telegramChatId')}
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. 987654321"
                        value={integrations.telegram_chat_id.value}
                        onChange={e => handleInputChange('telegram_chat_id', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none transition-all"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4 pt-2"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5 block">
                          Twilio Account SID
                        </label>
                        <input 
                          type="text"
                          placeholder="e.g. ACxxxxxxxxxxxxx"
                          value={integrations.whatsapp_twilio_sid.value}
                          onChange={e => handleInputChange('whatsapp_twilio_sid', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5 block">
                          Twilio Auth Token
                        </label>
                        <input 
                          type="password"
                          placeholder={t('integrations.twilioAuthTokenPlaceholder')}
                          value={integrations.whatsapp_twilio_token.value}
                          onChange={e => handleInputChange('whatsapp_twilio_token', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5 block">
                          {t('integrations.recipientNumberLabel')}
                        </label>
                        <input 
                          type="tel"
                          placeholder="e.g. +573001234567"
                          value={integrations.whatsapp_recipient_number.value}
                          onChange={e => handleInputChange('whatsapp_recipient_number', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    onClick={handleSaveBriefingConfig}
                    disabled={isSaving || isTestingBriefing}
                    className="bg-primary text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all flex-1 glow-red disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                    {t('integrations.saveConfig')}
                  </button>
                  <button
                    onClick={handleTestBriefing}
                    disabled={isSaving || isTestingBriefing}
                    className="bg-white/5 border border-white/10 hover:border-white/20 text-white px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all hover:bg-white/10 disabled:opacity-50"
                  >
                    {isTestingBriefing ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                    {t('integrations.testConnection')}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Webhooks Card */}
        <div className="premium-card p-8 flex flex-col justify-between border border-white/5 bg-zinc-950/40 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full pointer-events-none" />
          
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-primary">
                  <Link size={22} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">Zapier / n8n / Webhooks</h4>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                    {t('integrations.realtimeTriggers')}
                  </p>
                </div>
              </div>
              <div className="relative">
                <input 
                  type="checkbox"
                  id="webhook-toggle"
                  checked={integrations.webhook_url.isEnabled}
                  onChange={() => handleToggle('webhook_url')}
                  className="sr-only peer"
                />
                <label 
                  htmlFor="webhook-toggle"
                  className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-white cursor-pointer block"
                />
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              {t('integrations.webhookDesc')}
            </p>

            {integrations.webhook_url.isEnabled && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-4 border-t border-white/5"
              >
                <div>
                  <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5 block">
                    {t('integrations.webhookUrlLabel')}
                  </label>
                  <input 
                    type="url"
                    placeholder={t('integrations.webhookUrlPlaceholder')}
                    value={integrations.webhook_url.value}
                    onChange={e => handleInputChange('webhook_url', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none transition-all"
                  />
                </div>
                <button
                  onClick={() => handleSave('webhook_url', integrations.webhook_url.value, true)}
                  disabled={isSaving}
                  className="bg-white/5 border border-white/10 hover:border-white/20 text-white px-5 py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all w-full"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                  {t('dashboard.saveChanges')}
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Mailchimp Card */}
        <div className="premium-card p-8 flex flex-col justify-between border border-white/5 bg-zinc-950/40 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-copper-light/5 blur-3xl rounded-full pointer-events-none" />
          
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 text-copper-light">
                  <Key size={22} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight">Mailchimp Sync</h4>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                    {t('integrations.mailchimpSubtitle')}
                  </p>
                </div>
              </div>
              <div className="relative">
                <input 
                  type="checkbox"
                  id="mailchimp-toggle"
                  checked={integrations.mailchimp_enabled.value === 'true' && integrations.mailchimp_enabled.isEnabled}
                  onChange={async () => {
                    const currentVal = integrations.mailchimp_enabled.value === 'true';
                    const newVal = !currentVal;
                    setIntegrations(prev => ({
                      ...prev,
                      mailchimp_enabled: { value: newVal ? 'true' : 'false', isEnabled: true }
                    }));
                    await handleSave('mailchimp_enabled', newVal ? 'true' : 'false', true);
                  }}
                  className="sr-only peer"
                />
                <label 
                  htmlFor="mailchimp-toggle"
                  className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-copper-light peer-checked:after:bg-white cursor-pointer block"
                />
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              {t('integrations.mailchimpDesc')}
            </p>

            {integrations.mailchimp_enabled.value === 'true' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pt-4 border-t border-white/5"
              >
                <div>
                  <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5 block">
                    {t('integrations.mailchimpApiKey')}
                  </label>
                  <input 
                    type="password"
                    placeholder="xxxxxxxxx-usX"
                    value={integrations.mailchimp_key.value}
                    onChange={e => handleInputChange('mailchimp_key', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-copper/50 focus:bg-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1.5 block">
                    {t('integrations.mailchimpListId')}
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. 5a4b7f8c92"
                    value={integrations.mailchimp_audience.value}
                    onChange={e => handleInputChange('mailchimp_audience', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-copper/50 focus:bg-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none transition-all"
                  />
                </div>
                <button
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      await fetch(`${API_BASE}/api/integrations`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key: 'mailchimp_key', value: integrations.mailchimp_key.value, isEnabled: true })
                      });
                      await fetch(`${API_BASE}/api/integrations`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key: 'mailchimp_audience', value: integrations.mailchimp_audience.value, isEnabled: true })
                      });
                      setSaveStatus('success');
                      setTimeout(() => setSaveStatus('idle'), 3000);
                    } catch (err: any) {
                      setErrorMsg(err.message || t('integrations.saveCredentialsError'));
                      setSaveStatus('error');
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                  className="bg-white/5 border border-white/10 hover:border-white/20 text-white px-5 py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all w-full"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={12} /> : <Save size={12} />}
                  {t('integrations.saveCredentialsBtn')}
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
