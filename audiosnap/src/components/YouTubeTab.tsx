import { useMemo } from 'react';

interface Props {
  value: string;
  onChange: (url: string) => void;
  disabled: boolean;
}

export default function YouTubeTab({ value, onChange, disabled }: Props) {
  const videoId = useMemo(() => extractId(value), [value]);
  const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

  return (
    <div className="converter__pane-inner">
      <div className="converter__url-input-wrap">
        {/* YouTube icon */}
        <svg className="converter__url-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="1.5" y="3.5" width="15" height="11" rx="3" stroke="currentColor" strokeWidth="1.3" />
          <path d="M7.5 6.5v5l4-2.5-4-2.5z" fill="currentColor" opacity="0.5" />
        </svg>
        <input
          type="url"
          className="converter__url-input"
          placeholder="Paste YouTube link here…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </div>

      {thumbUrl && (
        <div className="converter__thumb">
          <img className="converter__thumb-img" src={thumbUrl} alt="Video thumbnail" />
        </div>
      )}
    </div>
  );
}

function extractId(url: string): string | null {
  const pats = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of pats) { const m = url.match(p); if (m) return m[1]; }
  return null;
}
