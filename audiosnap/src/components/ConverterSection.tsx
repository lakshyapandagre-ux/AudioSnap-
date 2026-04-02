import { useState, useCallback, useRef, useEffect } from 'react';
import { Download, RotateCcw, Loader2, CheckCircle2 } from 'lucide-react';
import UploadTab from './UploadTab';
import YouTubeTab from './YouTubeTab';
import InstagramTab from './InstagramTab';
import ProgressBar from './ProgressBar';
import MiniSteps from './MiniSteps';
import { useConversion } from '../hooks/useConversion';
import { getDownloadUrl, triggerDownload } from '../services/api';

type TabId = 'upload' | 'youtube' | 'reels';

const QUALITY_OPTIONS = [
  { label: '128 kbps', value: '128' },
  { label: '192 kbps', value: '192' },
  { label: '320 kbps', value: '320' },
];

const TAB_CONFIG: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: 'upload', label: 'Upload',
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4.5 10.5a3 3 0 01-.21-5.99A4.07 4.07 0 0112 6a2.57 2.57 0 01-.86 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 8v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><path d="M6 10l2-2 2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  },
  {
    id: 'youtube', label: 'YouTube',
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3.5" width="13" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.3" /><path d="M6.5 6v4l3.5-2-3.5-2z" fill="currentColor" opacity="0.6" /></svg>,
  },
  {
    id: 'reels', label: 'Reels',
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.3" /><path d="M2 6h12M6 2v4M10 2v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><path d="M6.5 9v3l2.5-1.5L6.5 9z" fill="currentColor" opacity="0.5" /></svg>,
  },
];

export default function ConverterSection() {
  const [activeTab, setActiveTab] = useState<TabId>('upload');
  const [quality, setQuality] = useState('192');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [reelsUrl, setReelsUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conv = useConversion();
  const isProcessing = conv.phase !== 'idle' && conv.phase !== 'completed' && conv.phase !== 'failed';

  useEffect(() => { if (conv.error) showError(conv.error); }, [conv.error]);

  function showError(msg: string) {
    setErrorMsg(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setErrorMsg(null), 6000);
  }
  function hideError() {
    setErrorMsg(null);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
  }

  const handleReelsChange = useCallback((url: string) => {
    setReelsUrl(url); hideError();
    if (/youtu\.?be/i.test(url)) { setActiveTab('youtube'); setYoutubeUrl(url); }
  }, []);

  const handleYoutubeSwitch = useCallback((url: string) => {
    setYoutubeUrl(url); hideError();
    if (/instagram\.com/i.test(url)) { setActiveTab('reels'); setReelsUrl(url); }
  }, []);

  const switchTab = (tab: TabId) => {
    setActiveTab(tab); hideError();
    if (conv.phase === 'completed' || conv.phase === 'failed') conv.reset();
  };

  const handleConvert = async () => {
    hideError();
    if (activeTab === 'upload') {
      if (!selectedFile) { showError('Please upload a video file first'); return; }
      if (selectedFile.size > 500 * 1024 * 1024) { showError('File too large. Maximum 500 MB.'); return; }
      conv.submitFile(selectedFile, quality);
    }
    if (activeTab === 'youtube') {
      const url = youtubeUrl.trim();
      if (!url) { showError('Please paste a YouTube link'); return; }
      if (/instagram\.com/i.test(url)) { showError('Instagram support is currently unavailable'); return; }
      if (!/youtu\.?be/i.test(url)) { showError('Invalid YouTube URL'); return; }
      conv.submitYouTube(url, quality);
    }
    if (activeTab === 'reels') {
      showError('Instagram support is currently unavailable');
      return;
    }
  };

  const handleReset = () => {
    conv.reset(); setSelectedFile(null); setYoutubeUrl(''); setReelsUrl(''); hideError();
  };

  return (
    <div className="converter__card" id="converter">
      {!isProcessing && conv.phase !== 'completed' && (
        <div className="converter__tabs">
          {TAB_CONFIG.map((tab) => (
            <button key={tab.id} className={`converter__tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => switchTab(tab.id)}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      )}

      {!isProcessing && conv.phase !== 'completed' && (
        <div className="converter__content">
          <div className="converter__pane active" key={activeTab}>
            {activeTab === 'upload' && <UploadTab onFileSelect={setSelectedFile} onFileClear={() => setSelectedFile(null)} disabled={isProcessing} />}
            {activeTab === 'youtube' && <YouTubeTab value={youtubeUrl} onChange={handleYoutubeSwitch} disabled={isProcessing} />}
            {activeTab === 'reels' && <InstagramTab value={reelsUrl} onChange={handleReelsChange} disabled={isProcessing} />}
          </div>
        </div>
      )}

      {!isProcessing && conv.phase !== 'completed' && (
        <div className="converter__settings">
          <span className="converter__settings-label">Quality</span>
          <div className="converter__pills">
            {QUALITY_OPTIONS.map((q) => (
              <button key={q.value} className={`converter__pill ${quality === q.value ? 'active' : ''}`} onClick={() => setQuality(q.value)}>{q.label}</button>
            ))}
          </div>
        </div>
      )}

      {!isProcessing && conv.phase !== 'completed' && (
        <button 
          className={`converter__action ${isProcessing ? 'converting' : ''}`} 
          onClick={handleConvert}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Converting...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5a5 5 0 1010 0 5 5 0 00-10 0z" stroke="currentColor" strokeWidth="1.4" /><path d="M6.5 6.5v4l3.5-2-3.5-2z" fill="currentColor" /></svg>
              Convert to MP3
            </>
          )}
        </button>
      )}

      {errorMsg && (
        <div className="converter__error">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" /><path d="M7 4.5v3M7 9.5v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          <span>{errorMsg}</span>
        </div>
      )}

      <ProgressBar phase={conv.phase} progress={conv.progress} statusText={conv.statusText} />

      {conv.phase === 'completed' && conv.jobId && (
        <div className="converter__state conversion-success">
          {/* Success Header */}
          <div className="conversion-success-header">
            <div className="success-icon-pulse">
              <CheckCircle2 size={48} strokeWidth={2} />
            </div>
            <div className="success-title">Your MP3 is ready!</div>
            <div className="success-subtitle">High quality • Instant download</div>
          </div>
          
          <div className="converter__player-wrap">
            <audio className="converter__audio-player" controls src={getDownloadUrl(conv.jobId)} />
          </div>
          
          <button className="converter__download download-primary" onClick={() => triggerDownload(conv.jobId!)}>
            <Download size={20} strokeWidth={2.5} />
            <span>Download MP3</span>
          </button>
          
          <button className="converter__action converter__action--reset" onClick={handleReset}>
            <RotateCcw size={16} />
            Convert Another
          </button>
        </div>
      )}

      {conv.phase === 'failed' && (
        <button className="converter__action converter__action--reset" onClick={handleReset} style={{ marginTop: 16 }}>Try Again</button>
      )}

      {!isProcessing && conv.phase !== 'completed' && conv.phase !== 'failed' && <MiniSteps />}
    </div>
  );
}
