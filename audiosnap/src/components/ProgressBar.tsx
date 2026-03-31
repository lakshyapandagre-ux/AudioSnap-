import type { ConversionPhase } from '../hooks/useConversion';

interface Props {
  phase: ConversionPhase;
  progress: number;
  statusText: string;
}

export default function ProgressBar({ phase, progress, statusText }: Props) {
  const isActive = phase !== 'idle' && phase !== 'completed' && phase !== 'failed';
  const showSpinner = phase === 'converting' || phase === 'finalizing';

  if (!isActive) return null;

  return (
    <div className="converter__state">
      {/* Percentage display */}
      <span className="converter__progress-pct">{progress}%</span>

      {/* Bar or Spinner */}
      {!showSpinner ? (
        <div className="converter__progress-wrap">
          <div
            className="converter__progress-bar"
            style={{
              width: `${progress}%`,
              transition: 'width 0.5s cubic-bezier(.16,1,.3,1)',
            }}
          />
        </div>
      ) : (
        <div className="converter__spinner" />
      )}

      {/* Status text */}
      <p className="converter__state-text">{statusText}</p>
    </div>
  );
}
