import { useState, useRef, DragEvent } from 'react';
import './Dropzone.css';

interface DropzoneProps {
    onUpload: (data: File | string) => void;
}

export default function Dropzone({ onUpload }: DropzoneProps) {
    const [isDragActive, setIsDragActive] = useState(false);
    const [link, setLink] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragActive(true);
        } else if (e.type === 'dragleave') {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onUpload(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            onUpload(e.target.files[0]);
        }
    };

    const handleLinkSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (link.trim()) {
            onUpload(link);
        }
    };

    return (
        <div className="dropzone-container glass-panel">
            <div
                className={`dropzone-area ${isDragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dropzone-icon">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <h3>Drag & Drop video file here</h3>
                <p>or click to browse</p>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleChange}
                    accept="video/*"
                    className="hidden-input"
                />
            </div>

            <div className="divider">
                <span>OR</span>
            </div>

            <form onSubmit={handleLinkSubmit} className="link-form">
                <input
                    type="url"
                    placeholder="Paste YouTube or raw video link..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="link-input"
                />
                <button type="submit" className="btn btn-primary">Analyze Link</button>
            </form>
        </div>
    );
}
