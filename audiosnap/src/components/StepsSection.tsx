/**
 * StepsSection — "How It Works" section, lazy-loaded.
 */
export default function StepsSection() {
  return (
    <section className="steps" id="how-it-works">
      <p className="steps__title">How It Works</p>
      <div className="steps__inner">
        <div className="steps__item">
          <div className="steps__icon">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 4v10M7 8l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <span className="steps__number">Step 1</span>
          <span className="steps__label">Paste link or<br />upload file</span>
        </div>

        <div className="steps__connector" />

        <div className="steps__item">
          <div className="steps__icon">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8" />
              <path d="M11 6v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="steps__number">Step 2</span>
          <span className="steps__label">We extract<br />the audio</span>
        </div>

        <div className="steps__connector" />

        <div className="steps__item">
          <div className="steps__icon">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 14V4M7 10l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 18h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <span className="steps__number">Step 3</span>
          <span className="steps__label">Download<br />your MP3</span>
        </div>
      </div>
    </section>
  );
}
