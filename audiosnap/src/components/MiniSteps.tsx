import React from 'react';

const steps = [
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 9V3M4.5 5.5L7 3l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.5 11h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
    label: 'Paste or drop',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M1 7h2l1.5-3 2 6 2-6L10 7h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: 'We convert',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 3v6M4.5 6.5L7 9l2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.5 11h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
    label: 'Get MP3',
  },
];

export default function MiniSteps() {
  return (
    <>
      <div className="mini-steps__divider" />
      <div className="mini-steps">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div className="mini-steps__step">
              <span className="mini-steps__icon">{step.icon}</span>
              <span className="mini-steps__label">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="mini-steps__connector">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M3.5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}
