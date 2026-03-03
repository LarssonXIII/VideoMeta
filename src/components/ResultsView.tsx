import { useState } from 'react';
import type { AIResults } from '../App';
import TagCloud from './TagCloud';
import './ResultsView.css';

interface ResultsViewProps {
    results: AIResults;
    onReset: () => void;
}

export default function ResultsView({ results, onReset }: ResultsViewProps) {
    const [activeTab, setActiveTab] = useState<'option_1' | 'option_2' | 'option_3'>('option_1');
    const [copied, setCopied] = useState(false);

    const getTitle = (key: string) => {
        switch (key) {
            case 'option_1': return 'Storytelling';
            case 'option_2': return 'How-To / Info';
            case 'option_3': return 'SEO-Max';
            default: return '';
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(results[activeTab]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="results-container glass-panel animate-fade-in">
            <div className="results-header">
                <h2>Generated Metadata</h2>
                <button className="btn btn-outline" onClick={onReset}>Start Over</button>
            </div>

            <div className="tabs">
                {(['option_1', 'option_2', 'option_3'] as const).map(tab => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {getTitle(tab)}
                    </button>
                ))}
            </div>

            <div className="tab-content">
                <textarea
                    readOnly
                    value={results[activeTab]}
                    className="result-textarea"
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button className="btn btn-primary" onClick={handleCopy}>
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                </div>
            </div>

            <div className="tags-section mt-8">
                <h3>Optimized Tags</h3>
                <TagCloud initialTags={results.tags} />
            </div>
        </div>
    );
}
