import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { CheckCircle, X, FileVideo } from 'lucide-react';

interface Props {
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
  disabled: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function UploadTab({ onFileSelect, onFileClear, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFile = useCallback(
    (f: File) => { 
      setFile(f); 
      setUploadSuccess(true);
      onFileSelect(f); 
      // Reset success animation after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
    },
    [onFileSelect],
  );

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setUploadSuccess(false);
    onFileClear();
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFile(e.target.files[0]);
  };

  const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

  return (
    <div
      className={`converter__dropzone ${dragging ? 'dragover' : ''} ${file ? 'has-file' : ''} ${uploadSuccess ? 'upload-success' : ''}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      style={{ pointerEvents: disabled ? 'none' : 'auto' }}
    >
      {file ? (
        <div className="upload-success-state">
          {/* Success Icon */}
          <div className="upload-success-icon">
            <CheckCircle size={40} strokeWidth={2} />
          </div>
          
          {/* Success Message */}
          <div className="upload-success-message">
            Video uploaded successfully
          </div>
          
          {/* File Info Card */}
          <div className="upload-file-info">
            <div className="upload-file-icon">
              <FileVideo size={20} />
            </div>
            <div className="upload-file-details">
              <div className="upload-file-name">{trunc(file.name, 35)}</div>
              <div className="upload-file-meta">
                <span className="upload-file-size">{formatSize(file.size)}</span>
                <span className="upload-status-badge">Ready to convert</span>
              </div>
            </div>
            <button 
              className="upload-file-remove" 
              onClick={clearFile} 
              title="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Cloud upload icon */}
          <div className="converter__dropzone-icon">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M10 24a7 7 0 01-.5-13.97A9.5 9.5 0 0128 13a6 6 0 01-2 11.65" stroke="rgba(255,255,255,0.2)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 17v10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M14 21l4-4 4 4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <p className="converter__dropzone-text">
            Drop your video here or <span className="converter__dropzone-link">browse</span>
          </p>
          <p className="converter__dropzone-hint">MP4, MOV, AVI, WEBM — up to 500 MB</p>
        </>
      )}

      <input ref={inputRef} type="file" accept="video/*" hidden onChange={onChange} />
    </div>
  );
}
