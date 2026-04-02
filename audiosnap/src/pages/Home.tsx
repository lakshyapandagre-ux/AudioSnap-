import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import StatusChip from '../components/StatusChip';
import ConverterSection from '../components/ConverterSection';
import Footer from '../components/Footer';
import TextType from '../components/TextType';

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260228_065522_522e2295-ba22-457e-8fdb-fbcd68109c73.mp4';

export default function Home() {
  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setHeroVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const ambientVideoRef = useRef<HTMLVideoElement>(null);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const [ambientVideoReady, setAmbientVideoReady] = useState(false);

  return (
    <>
      {/* Ambient background — fixed video + orbs (parallax effect) */}
      <div className="ambient-bg" aria-hidden="true">
        <video
          ref={ambientVideoRef}
          className={`ambient-bg__video ${ambientVideoReady ? 'ambient-bg__video--visible' : ''}`}
          autoPlay muted loop playsInline preload="metadata"
          onCanPlay={() => setAmbientVideoReady(true)}
          src={VIDEO_SRC}
        />
        <div className="ambient-bg__orb" />
        <div className="ambient-bg__orb" />
        <div className="ambient-bg__orb" />
      </div>

      <Navbar />

      {/* ═══ HERO — Split grid: left headline, right converter ═══ */}
      <section className="hero" id="hero">
        <video
          ref={heroVideoRef}
          className={`hero__video ${heroVideoReady ? 'hero__video--visible' : ''}`}
          autoPlay muted loop playsInline preload="metadata"
          onCanPlay={() => setHeroVideoReady(true)}
          src={VIDEO_SRC}
        />
        <div className="hero__overlay" aria-hidden="true" />

        <div className="hero__content">
          <div className="hero__left">
            <h1 className="hero__headline">
              <span className={`hero__line hero__line--sans ${heroVisible ? 'visible' : ''}`}>
              <TextType
                text="Convert any video 
                into clean "
                typingSpeed={60}
                pauseDuration={2000}
                showCursor
              />
            </span>
              <span className={`hero__line hero__line--serif ${heroVisible ? 'visible' : ''}`}>
                MP3 audio instantly
              </span>
            </h1>

            <p className={`hero__subtext ${heroVisible ? 'visible' : ''}`}>
              Free &nbsp;•&nbsp; Fast &nbsp;•&nbsp; Up to 320kbps
            </p>
          </div>

          <div className="hero__right">
            <ConverterSection />
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <Footer />
    </>
  );
}
