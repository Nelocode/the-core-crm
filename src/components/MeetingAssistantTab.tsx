import React, { useState, useEffect, useRef } from 'react';
import { Mic, Upload, Sparkles, CheckCircle, AlertTriangle, Square, Loader2, ArrowRight, Activity, Calendar } from 'lucide-react';
import { contactService } from '../services/contactService';
import { useTranslation } from '../i18n';

interface MeetingAssistantTabProps {
  contact: any;
  onUpdateContact: (updatedContact: any) => void;
}

export default function MeetingAssistantTab({ contact, onUpdateContact }: MeetingAssistantTabProps) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'complete'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Results
  const [result, setResult] = useState<{
    transcript: string;
    analysis: {
      summary: string;
      sentiment: 'positive' | 'neutral' | 'negative';
      duration: number;
      actionItems: string;
      followUpDue: string | null;
      scoreChange: number;
    };
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up recording states and timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Format recording duration nicely as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    setErrorMessage('');
    setResult(null);
    setAudioBlob(null);
    chunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine browser-supported mimetype
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const collectedBlob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        setAudioBlob(collectedBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // chunk every 1s
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error('Failed to access microphone:', err);
      setErrorMessage(
        err.name === 'NotAllowedError' 
          ? t('meetingAssistant.micPermissionError')
          : t('meetingAssistant.micAccessError')
      );
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setErrorMessage('');
    setResult(null);
    setAudioBlob(file);
  };

  const processAudio = async () => {
    if (!audioBlob) return;
    
    setIsProcessing(true);
    setProcessingStep('uploading');
    setErrorMessage('');

    try {
      setTimeout(() => setProcessingStep('transcribing'), 1500);
      setTimeout(() => setProcessingStep('analyzing'), 3500);

      const serverResponse = await contactService.processMeetingAudio(contact.id, audioBlob);
      
      setProcessingStep('complete');
      setResult({
        transcript: serverResponse.transcript,
        analysis: serverResponse.analysis
      });

      if (serverResponse.contact) {
        onUpdateContact(serverResponse.contact);
      }
      
    } catch (err: any) {
      console.error('Error processing audio:', err);
      setErrorMessage(err.message || t('meetingAssistant.errorProcessing'));
      setProcessingStep('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Loader Overlay */}
      {isProcessing && (
        <div className="bg-white/2 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 py-12">
          <Loader2 className="animate-spin text-primary w-10 h-10" />
          <div className="space-y-1">
            <h4 className="text-md font-bold text-white uppercase tracking-wider">
              {processingStep === 'uploading' && t('meetingAssistant.uploading')}
              {processingStep === 'transcribing' && t('meetingAssistant.transcribing')}
              {processingStep === 'analyzing' && t('meetingAssistant.analyzing')}
            </h4>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              {processingStep === 'uploading' && t('meetingAssistant.uploadingDesc')}
              {processingStep === 'transcribing' && t('meetingAssistant.transcribingDesc')}
              {processingStep === 'analyzing' && t('meetingAssistant.analyzingDesc')}
            </p>
          </div>
        </div>
      )}

      {/* Main Recording Workspace */}
      {!isProcessing && !result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Live Recording Area */}
          <div className="border border-white/5 bg-zinc-950/40 rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[250px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full" />
            
            {isRecording ? (
              <div className="space-y-6 w-full">
                <div className="flex justify-center items-center gap-1.5 h-10">
                  <div className="w-1.5 h-4 bg-primary rounded-full animate-[pulse_0.8s_infinite]" />
                  <div className="w-1.5 h-8 bg-primary rounded-full animate-[pulse_1s_infinite_0.1s]" />
                  <div className="w-1.5 h-6 bg-primary rounded-full animate-[pulse_1.2s_infinite_0.2s]" />
                  <div className="w-1.5 h-10 bg-primary rounded-full animate-[pulse_0.9s_infinite_0.3s]" />
                  <div className="w-1.5 h-5 bg-primary rounded-full animate-[pulse_1.1s_infinite_0.4s]" />
                </div>

                <div className="space-y-1">
                  <p className="text-2xl font-black text-white mono tracking-tight">{formatTime(recordingTime)}</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{t('meetingAssistant.recordingMeeting')}</p>
                </div>

                <button 
                  onClick={stopRecording}
                  className="bg-primary hover:bg-red-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-glow-red mx-auto hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Square size={20} fill="white" />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-zinc-400 mx-auto">
                  <Mic size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-md font-bold text-white uppercase tracking-tight">{t('meetingAssistant.dictateVoice')}</h4>
                  <p className="text-xs text-zinc-500 max-w-[250px] mx-auto">{t('meetingAssistant.dictateVoiceDesc')}</p>
                </div>
                <button 
                  onClick={startRecording}
                  className="bg-white/5 border border-white/10 hover:border-primary/50 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  {t('meetingAssistant.startRecording')}
                </button>
              </div>
            )}
          </div>

          {/* Upload Audio File Area */}
          <div className="border border-white/5 bg-zinc-950/40 rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[250px] relative overflow-hidden">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="audio/*" 
              className="hidden" 
            />
            
            <div className="space-y-6">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-zinc-400 mx-auto">
                <Upload size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-md font-bold text-white uppercase tracking-tight">{t('meetingAssistant.uploadAudio')}</h4>
                <p className="text-xs text-zinc-500 max-w-[250px] mx-auto">{t('meetingAssistant.uploadAudioDesc')}</p>
              </div>
              
              {audioBlob && !isRecording && (
                <div className="bg-white/5 border border-white/5 rounded-2xl px-4 py-2 text-xs text-copper-light font-bold truncate max-w-[220px] mx-auto">
                  ✓ {audioBlob instanceof File ? audioBlob.name : t('meetingAssistant.audioSelected')}
                </div>
              )}

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/5 border border-white/10 hover:border-white/20 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {audioBlob ? t('meetingAssistant.changeFile') : t('meetingAssistant.selectFile')}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="md:col-span-2 bg-primary/10 border border-primary/20 text-red-400 px-4 py-3 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="shrink-0 mt-0.5" size={16} />
              <p className="text-xs font-semibold leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {audioBlob && !isRecording && (
            <div className="md:col-span-2 pt-4 flex justify-center">
              <button 
                onClick={processAudio}
                className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 glow-red hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {t('meetingAssistant.processMinuta')}
                <ArrowRight size={14} strokeWidth={3} />
              </button>
            </div>
          )}

        </div>
      )}

      {/* Processed Results Panel */}
      {result && (
        <div className="space-y-6">
          <div className="bg-success/10 border border-success/20 rounded-3xl p-5 flex items-center gap-3 text-success">
            <CheckCircle size={20} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">{t('meetingAssistant.analysisComplete')}</p>
              <p className="text-[10px] text-success/70 font-semibold mt-0.5">{t('meetingAssistant.analysisCompleteDesc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">{t('meetingAssistant.sentiment')}</span>
              <span className={`text-md font-black uppercase mt-1 inline-block ${
                result.analysis.sentiment === 'positive' ? 'text-success' : result.analysis.sentiment === 'negative' ? 'text-primary' : 'text-copper-light'
              }`}>
                {result.analysis.sentiment === 'positive' 
                  ? t('meetingAssistant.sentimentLabels.positive') 
                  : result.analysis.sentiment === 'negative' 
                    ? t('meetingAssistant.sentimentLabels.negative') 
                    : t('meetingAssistant.sentimentLabels.neutral')}
              </span>
            </div>

            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">{t('meetingAssistant.scoreDelta')}</span>
              <span className={`text-md font-black mt-1 inline-block ${result.analysis.scoreChange >= 0 ? 'text-success' : 'text-primary'}`}>
                {result.analysis.scoreChange >= 0 ? `+${result.analysis.scoreChange}%` : `${result.analysis.scoreChange}%`}
                <span className="text-[10px] text-zinc-500 font-bold ml-1 uppercase tracking-wider">{t('meetingAssistant.scoreDelta')}</span>
              </span>
            </div>

            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">{t('meetingAssistant.upcomingContact')}</span>
              <span className="text-sm font-black text-white mt-1.5 flex items-center gap-1.5">
                <Calendar size={13} className="text-zinc-500" />
                {result.analysis.followUpDue ? result.analysis.followUpDue : t('meetingAssistant.notScheduled')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="premium-card p-6 border border-white/5 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <Sparkles size={13} className="text-primary" />
                {t('meetingAssistant.meetingSummary')}
              </h4>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium bg-white/[0.01] p-4 rounded-xl border border-white/2">
                {result.analysis.summary}
              </p>
            </div>

            <div className="premium-card p-6 border border-white/5 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <Activity size={13} className="text-copper-light" />
                {t('meetingAssistant.agreedCommitments')}
              </h4>
              <div className="text-xs text-zinc-300 leading-relaxed font-medium bg-white/[0.01] p-4 rounded-xl border border-white/2 min-h-[100px]">
                {result.analysis.actionItems ? (
                  <p className="whitespace-pre-line">{result.analysis.actionItems}</p>
                ) : (
                  <p className="text-zinc-500 italic">{t('meetingAssistant.noCommitments')}</p>
                )}
              </div>
            </div>
          </div>

          <details className="group border border-white/5 bg-white/2 rounded-2xl p-4">
            <summary className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-open:text-white cursor-pointer select-none">
              {t('meetingAssistant.viewTranscript')}
            </summary>
            <p className="text-xs text-zinc-400 mt-4 leading-relaxed font-mono whitespace-pre-line bg-zinc-950 p-4 rounded-xl border border-white/5">
              {result.transcript}
            </p>
          </details>

          <button 
            onClick={() => setResult(null)}
            className="w-full bg-white/5 border border-white/10 hover:border-white/20 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
          >
            {t('meetingAssistant.processNew')}
          </button>
        </div>
      )}
    </div>
  );
}
