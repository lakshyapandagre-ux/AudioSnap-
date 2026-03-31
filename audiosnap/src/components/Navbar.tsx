import { useState, useEffect } from 'react';

export default function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 300);
    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > 80) {
        setHidden(y > lastY + 3);
      } else {
        setHidden(false);
      }
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.max(0, y - 100), behavior: 'smooth' });
    }
  };

  return (
    <nav
      className="navbar"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateX(-50%) translateY(${hidden ? '-120%' : visible ? '0' : '-20px'})`,
        transition: 'opacity 0.5s ease-out, transform 0.5s ease-out'
      }}
    >
      <div className="navbar__inner">
        {/* Logo */}
        <a href="#" className="navbar__logo" aria-label="AudioSnap">
          <div className="navbar__logo-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="5" width="2" height="6" rx="1" fill="#fff" />
              <rect x="5" y="2" width="2" height="12" rx="1" fill="#fff" />
              <rect x="9" y="4" width="2" height="8" rx="1" fill="#fff" />
              <rect x="13" y="6" width="2" height="4" rx="1" fill="#fff" />
            </svg>
          </div>
          <span className="navbar__logo-text">AudioSnap</span>
        </a>

        {/* Links */}
        <ul className={`navbar__menu ${menuOpen ? 'open' : ''}`}>
          <li>
            <button className="navbar__link" onClick={() => scrollTo('converter')}>
              Convert
            </button>
          </li>
        </ul>

        {/* CTA */}
        <button className="navbar__cta" onClick={() => scrollTo('converter')}>
          <span>Try Free</span>
          <span className="navbar__cta-arrow">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 9L9 3M9 3H4M9 3V8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        {/* Mobile Toggle */}
        <button
          className={`navbar__toggle ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
}
