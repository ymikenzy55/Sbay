import { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';
import { promptInstall, isIOSDevice, isPWA } from '../utils/pwa';
import './InstallPrompt.css';

const DISMISSED_KEY = 'sbay.install.dismissed';

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Don't show if already installed as PWA
    if (isPWA()) return;

    // Don't show if user dismissed it
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const ios = isIOSDevice();
    setIsIOS(ios);
    if (ios) {
      const t = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(t);
    }

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
          <h3>{isIOS ? 'Add sBay to iPhone' : 'Install sBay App'}</h3>
          {isIOS ? (
            <ol className="install-ios-steps">
              <li><Share size={14} /> Tap Share in Safari.</li>
              <li><PlusSquare size={14} /> Choose Add to Home Screen.</li>
            </ol>
          ) : (
            <p>Add sBay to your home screen for instant access — no browser needed.</p>
          )}
        </div>
      </div>
      <div className="install-actions">
        <button className="btn-install" onClick={isIOS ? handleDismiss : handleInstall}>
          <Download size={18} />
          <span>{isIOS ? 'Got it' : 'Install Now'}</span>
        </button>
        <button className="btn-dismiss" onClick={handleDismiss} aria-label="Dismiss">
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
