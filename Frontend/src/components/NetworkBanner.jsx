import { useEffect, useState } from 'react';
import { WifiOff, X } from 'lucide-react';
import './NetworkBanner.css';

export default function NetworkBanner() {
  const [visible, setVisible] = useState(!navigator.onLine);

  useEffect(() => {
    const show = () => setVisible(true);
    const hide = () => setVisible(false);
    window.addEventListener('offline', show);
    window.addEventListener('online', hide);
    window.addEventListener('sbay:network-error', show);
    return () => {
      window.removeEventListener('offline', show);
      window.removeEventListener('online', hide);
      window.removeEventListener('sbay:network-error', show);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="network-banner" role="status">
      <WifiOff size={18} />
      <span>Network error. Check your internet connection and try again.</span>
      <button type="button" onClick={() => setVisible(false)} aria-label="Dismiss network message">
        <X size={16} />
      </button>
    </div>
  );
}
