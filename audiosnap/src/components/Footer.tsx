export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="footer__brand-name">AudioSnap</span>
        </div>
        <div className="footer__tagline">
          © {new Date().getFullYear()} AudioSnap — Free video to MP3 converter
        </div>
        <div className="footer__made-with">
          Made with 
          <svg className="footer__heart" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg> 
          by Lakshya
        </div>
      </div>
    </footer>
  );
}
