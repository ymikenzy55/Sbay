import { useEffect, useRef, useState } from 'react';
import { WifiOff, AlertTriangle, Clock, X, RefreshCw } from 'lucide-react';
import './NetworkBanner.css';

const ERROR_TYPES = {
  offline:  { icon: WifiOff, msg: "You're offline. Check your internet connection.", cls: 'offline' },
  server:   { icon: AlertTriangle, msg: 'Server is temporarily unavailable. Please try again shortly.', cls: 'server' },
  timeout:  { icon: Clock, msg: 'Request timed out. The server is taking too long to respond.', cls: 'timeout' },
};

export default function NetworkBanner() {
  const [error, setError] = useState(null);
  const autoHideTimer = useRef(null);

  useEffect(() => {
    const clearAutoHide = () => {
      if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    };
    const showOffline = () => { setError('offline'); clearAutoHide(); };
    const hideOffline = () => { if (navigator.onLine) setError(null); };
    const showServer = () => {
      if (!navigator.onLine) { setError('offline'); return; }
      clearAutoHide();
      setError('server');
      autoHideTimer.current = setTimeout(() => setError(null), 8000);
    };
    const showTimeout = () => {
      if (!navigator.onLine) { setError('offline'); return; }
      clearAutoHide();
      setError('timeout');
      autoHideTimer.current = setTimeout(() => setError(null), 8000);
    };

    window.addEventListener('offline', showOffline);
    window.addEventListener('online', hideOffline);
    window.addEventListener('sbay:server-error', showServer);
    window.addEventListener('sbay:timeout-error', showTimeout);
    // Legacy event - map to server error
    window.addEventListener('sbay:network-error', showServer);

    if (!navigator.onLine) setError('offline');

    return () => {
      window.removeEventListener('offline', showOffline);
      window.removeEventListener('online', hideOffline);
      window.removeEventListener('sbay:server-error', showServer);
      window.removeEventListener('sbay:timeout-error', showTimeout);
      window.removeEventListener('sbay:network-error', showServer);
      clearAutoHide();
    };
  }, []);

  if (!error) return null;
  const { icon: Icon, msg, cls } = ERROR_TYPES[error] || ERROR_TYPES.server;

  return (
    <div className={`network-banner ${cls}`} role="status">
      <Icon size={18} />
      <span>{msg}</span>
      <div className="network-banner-actions">
        {error !== 'offline' && (
          <button type="button" onClick={() => window.location.reload()} aria-label="Retry" className="network-retry">
            <RefreshCw size={14} />
          </button>
        )}
        <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
