interface Props {
  value: string;
  onChange: (url: string) => void;
  disabled: boolean;
}

export default function InstagramTab({ value, onChange, disabled }: Props) {
  return (
    <div className="converter__pane-inner">
      <div className="converter__url-input-wrap">
        {/* Reels / film icon */}
        <svg className="converter__url-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="2" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2 7h14M7 2v5M11 2v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M7.5 10.5v3l2.5-1.5-2.5-1.5z" fill="currentColor" opacity="0.5" />
        </svg>
        <input
          type="url"
          className="converter__url-input"
          placeholder="Paste Instagram reel link here…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
