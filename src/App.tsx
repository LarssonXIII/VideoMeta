import { useState } from 'react';
import Dropzone from './components/Dropzone';
import ResultsView from './components/ResultsView';
import SettingsModal from './components/SettingsModal';
import './App.css'; // Assuming we have some app specific styles here if needed

export type AIResults = {
  option_1: string;
  option_2: string;
  option_3: string;
  tags: string[];
};

export type Provider = 'openai' | 'anthropic' | 'gemini' | 'ollama';

function App() {
  const [step, setStep] = useState<'upload' | 'processing' | 'results'>('upload');
  const [results, setResults] = useState<AIResults | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProvider] = useState<Provider>('openai');
  const [transcriptionProvider, setTranscriptionProvider] = useState<'whisper' | 'gemini'>('whisper');
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpload = async (fileOrLink: File | string) => {
    setStep('processing');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('provider', provider);
      formData.append('transcriptionProvider', transcriptionProvider);

      if (typeof fileOrLink === 'string') {
        formData.append('link', fileOrLink);
      } else {
        formData.append('file', fileOrLink);
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Unknown error occurred during analysis');
      }

      setResults(json.data as AIResults);
      setStep('results');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
      setStep('upload');
    }
  };

  const handleReset = () => {
    setResults(null);
    setStep('upload');
    setErrorMsg('');
  };

  return (
    <div className="animate-fade-in relative min-h-screen">
      <button
        className="btn btn-outline absolute-top-right settings-btn"
        onClick={() => setShowSettings(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        Settings
      </button>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      <header className="text-center mb-8 pt-8">
        <h1 className="stagger-1">YouTube SEO Automator</h1>
        <p className="stagger-2">AI-driven metadata generation for your videos</p>
      </header>

      <main className="stagger-3">
        {step === 'upload' && (
          <div className="upload-section">
            <div className="provider-selector mb-8 text-center glass-panel" style={{ maxWidth: '400px', margin: '0 auto 2rem auto', padding: '1rem' }}>
              <label className="mr-4" style={{ marginRight: '1rem' }}>Select AI Provider: </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as Provider)}
                style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  border: '1px solid var(--surface-border)'
                }}
              >
                <option value="openai">OpenAI (GPT-4o-mini)</option>
                <option value="anthropic">Anthropic (Claude-3 Haiku)</option>
                <option value="gemini">Google Gemini (2.5 Flash)</option>
                <option value="ollama">Ollama (Local Llama3)</option>
              </select>
            </div>

            <div className="provider-selector mb-8 text-center glass-panel" style={{ maxWidth: '400px', margin: '0 auto 2rem auto', padding: '1rem' }}>
              <label className="mr-4" style={{ marginRight: '1rem' }}>Transcription AI: </label>
              <select
                value={transcriptionProvider}
                onChange={(e) => setTranscriptionProvider(e.target.value as 'whisper' | 'gemini')}
                style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  border: '1px solid var(--surface-border)'
                }}
              >
                <option value="whisper">OpenAI Whisper</option>
                <option value="gemini">Google Gemini Audio</option>
              </select>
            </div>

            {errorMsg && (
              <div className="error-banner text-center mb-4" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', maxWidth: '800px', margin: '0 auto 2rem auto' }}>
                <strong>Error:</strong> {errorMsg}
                <br /><small className="text-muted mt-2 block">Make sure your API key is configured in Settings.</small>
              </div>
            )}

            <Dropzone onUpload={handleUpload} />
          </div>
        )}

        {step === 'processing' && (
          <div className="glass-panel text-center pulse-animation" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="spinner"></div>
            <h2 className="mt-4">Analyzing Content...</h2>
            <p>Processing via {provider === 'openai' ? 'OpenAI' : provider === 'anthropic' ? 'Anthropic' : provider === 'gemini' ? 'Google Gemini' : 'Ollama local model'}...</p>
          </div>
        )}

        {step === 'results' && results && (
          <ResultsView results={results} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}

export default App;
