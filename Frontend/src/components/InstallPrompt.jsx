import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { promptInstall, isPWA } from '../utils/pwa';
import './InstallPrompt.css';

const DISMISSED_KEY = 'sbay.install.dismissed';

export default function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isPWA()) return;

    // Don't show if user dismissed it
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    // Listen for installable event
    const handleInstallable = () => {
      // Show prompt after 5 seconds delay
      setTimeout(() => setShow(true), 5000);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    return () => window.removeEventListener('pwa-installable', handleInstallable);
  }, []);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="install-prompt">
      <div className="install-content">
        <div className="install-icon">
          <Smartphone size={24} />
        </div>
        <div className="install-text">
          <h3>Install sBay App</h3>
          <p>Get the full app experience! Install sBay on your device for faster access and offline support.</p>
        </div>
      </div>
      <div className="install-actions">
        <button className="btn-install" onClick={handleInstall}>
          <Download size={18} />
          <span>Install Now</span>
        </button>
        <button className="btn-dismiss" onClick={handleDismiss} aria-label="Dismiss">
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
