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
    <div className="animate-fade-in">
      <header className="sticky-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '896px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div>
            <span className="label-xs">AI Automation</span>
            <h1 style={{ fontSize: '1.25rem', margin: 0 }}>YouTube <em>SEO</em></h1>
          </div>
          <button className="btn btn-outline" onClick={() => setShowSettings(true)}>
            Settings
          </button>
        </div>
      </header>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      <section className="text-center mb-8" style={{ marginTop: '2rem' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
          YouTube <em>SEO</em> <br />Automator
        </h1>
        <p style={{ maxWidth: '600px', margin: '0 auto' }}>
          Generate high-converting metadata using AI transcription and advanced industrial-grade SEO models.
        </p>
      </section>

      <main>
        {step === 'upload' && (
          <div className="glass-panel">
            <div className="mb-8" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label>Transcription AI</label>
                <select
                  className="btn btn-outline w-full"
                  value={transcriptionProvider}
                  onChange={(e) => setTranscriptionProvider(e.target.value as 'whisper' | 'gemini')}
                  style={{ textTransform: 'none', fontWeight: 600 }}
                >
                  <option value="whisper">OpenAI Whisper</option>
                  <option value="gemini">Google Gemini Audio</option>
                </select>
              </div>
              <div>
                <label>AI Generator</label>
                <select
                  className="btn btn-outline w-full"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as Provider)}
                  style={{ textTransform: 'none', fontWeight: 600 }}
                >
                  <option value="openai">ChatGPT (OpenAI)</option>
                  <option value="anthropic">Claude (Anthropic)</option>
                  <option value="gemini">Google Gemini (2.5 Flash)</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-8" style={{ color: 'var(--secondary)', border: '1px solid var(--secondary)', padding: '1rem', borderRadius: 'var(--radius-lg)', background: 'rgba(220, 38, 38, 0.05)' }}>
                <span className="label-xs" style={{ color: 'var(--secondary)' }}>System Error</span>
                <p style={{ color: 'var(--text-primary)', margin: 0, fontSize: '0.875rem' }}>{errorMsg}</p>
              </div>
            )}

            <Dropzone onUpload={handleUpload} />
          </div>
        )}

        {step === 'processing' && (
          <div className="glass-panel text-center">
            <span className="label-xs">Processing Stream</span>
            <h2 className="mt-4 mb-2">Analyzing <em>Metadata</em></h2>
            <p>Deploying {provider} models to process your content...</p>
            <div className="spinner mt-8" style={{ margin: '2rem auto' }}></div>
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
