import { useState } from 'react';
import './TagCloud.css';

interface TagCloudProps {
    initialTags: string[];
}

export default function TagCloud({ initialTags }: TagCloudProps) {
    const [tags, setTags] = useState(initialTags);
    const [copiedList, setCopiedList] = useState(false);
    const [copiedHash, setCopiedHash] = useState(false);

    const removeTag = (indexToRemove: number) => {
        setTags(tags.filter((_, index) => index !== indexToRemove));
    };

    const copyAsList = () => {
        navigator.clipboard.writeText(tags.join(', '));
        setCopiedList(true);
        setTimeout(() => setCopiedList(false), 2000);
    };

    const copyAsHashtags = () => {
        const hashTags = tags.map(tag => {
            // Remove special chars and spaces for a clean hashtag
            const clean = tag.replace(/[^a-zA-Z0-9åäöÅÄÖ]/g, '');
            return `#${clean.toLowerCase()}`;
        }).join(' ');

        navigator.clipboard.writeText(hashTags);
        setCopiedHash(true);
        setTimeout(() => setCopiedHash(false), 2000);
    };

    return (
        <div className="tag-cloud-wrapper">
            <div className="tag-layout">
                {tags.map((tag, index) => (
                    <span key={`${tag}-${index}`} className="tag-chip animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                        {tag}
                        <button className="tag-remove" onClick={() => removeTag(index)} aria-label="Remove tag">
                            &times;
                        </button>
                    </span>
                ))}
                {tags.length === 0 && <p className="text-muted">No tags remaining.</p>}
            </div>

            {tags.length > 0 && (
                <div className="tag-actions mt-4" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={copyAsList}>
                        {copiedList ? 'List Copied!' : 'Copy as List'}
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={copyAsHashtags}>
                        {copiedHash ? 'Hashtags Copied!' : 'Copy as Hashtags'}
                    </button>
                </div>
            )}
        </div>
    );
}
