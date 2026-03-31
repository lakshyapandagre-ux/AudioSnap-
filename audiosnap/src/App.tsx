import { useEffect } from 'react';
import Home from './pages/Home';

export default function App() {
  useEffect(() => {
    document.body.style.opacity = '0';
    requestAnimationFrame(() => {
      document.body.style.transition = 'opacity 0.4s ease';
      document.body.style.opacity = '1';
    });
  }, []);

  return <Home />;
}
