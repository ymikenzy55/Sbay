/**
 * Register service worker for PWA functionality.
 * Checks for updates every 60s and auto-applies them so users
 * always get the latest version without manually refreshing.
 */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[PWA] Service Worker registered:', registration.scope);

      // Check for updates every 60 seconds
      setInterval(() => { registration.update().catch(() => {}); }, 60_000);

      // When a new SW is found installing, wait for it then activate
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version ready — tell it to take over immediately
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      // When the controlling SW changes, reload to get fresh assets
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  });
}

/**
 * Check if app is running as PWA
 */
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

export function isIOSDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent || '') ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
}

/**
 * Show install prompt when available
 */
let deferredPrompt = null;

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Save the event so it can be triggered later
    deferredPrompt = e;
    // Dispatch custom event to show install button
    window.dispatchEvent(new CustomEvent('pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    deferredPrompt = null;
  });
}

/**
 * Trigger install prompt
 */
export async function promptInstall() {
  if (!deferredPrompt) {
    return false;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`[PWA] User response: ${outcome}`);

  // Clear the deferred prompt
  deferredPrompt = null;

  return outcome === 'accepted';
}
