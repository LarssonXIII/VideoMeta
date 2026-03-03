import { useState, useEffect } from 'react';
import './SettingsModal.css';

interface SettingsModalProps {
    onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
    const [openaiKey, setOpenaiKey] = useState('');
    const [anthropicKey, setAnthropicKey] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');

    const [status, setStatus] = useState({ openai: false, anthropic: false, gemini: false });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                setStatus({ openai: data.hasOpenAI, anthropic: data.hasAnthropic, gemini: data.hasGemini });
                if (data.ollamaUrl) setOllamaUrl(data.ollamaUrl);
            })
            .catch(err => console.error("Could not fetch settings", err));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        // Only send keys that are not empty to avoid overwriting with blank
        const payload: any = { ollamaUrl };
        if (openaiKey) payload.openaiKey = openaiKey;
        if (anthropicKey) payload.anthropicKey = anthropicKey;
        if (geminiKey) payload.geminiKey = geminiKey;

        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            onClose();
        } catch (err) {
            console.error("Failed to save", err);
            alert("Failed to save settings. Make sure backend is running.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
                <h2>AI Provider Settings</h2>
                <p className="text-muted mb-8">Configure your AI providers. Keys are saved securely to your local .env file.</p>

                <form onSubmit={handleSave} className="settings-form">
                    <div className="form-group">
                        <label>OpenAI API Key</label>
                        <input
                            type="password"
                            placeholder={status.openai ? '•••••••••••••••• (Set)' : 'sk-...'}
                            value={openaiKey}
                            onChange={e => setOpenaiKey(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Anthropic API Key</label>
                        <input
                            type="password"
                            placeholder={status.anthropic ? '•••••••••••••••• (Set)' : 'sk-ant-...'}
                            value={anthropicKey}
                            onChange={e => setAnthropicKey(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Google Gemini API Key</label>
                        <input
                            type="password"
                            placeholder={status.gemini ? '•••••••••••••••• (Set)' : 'AIzaSy...'}
                            value={geminiKey}
                            onChange={e => setGeminiKey(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Local Ollama URL</label>
                        <input
                            type="text"
                            value={ollamaUrl}
                            onChange={e => setOllamaUrl(e.target.value)}
                        />
                    </div>

                    <div className="form-actions mt-8">
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
