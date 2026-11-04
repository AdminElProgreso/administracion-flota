import { useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// The browser fires "beforeinstallprompt" once, when the page loads: keep it from the start,
// so the Settings screen can still offer to install even if it opens later
let deferred: BeforeInstallPromptEvent | null = null;
let installedNow = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installedNow = true;
    notify();
  });
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function useInstallPrompt(): { canInstall: boolean; install: () => Promise<void>; installed: boolean; ios: boolean } {
  const promptEvent = useSyncExternalStore(subscribe, () => deferred);
  const installed = useSyncExternalStore(subscribe, () => installedNow || isStandalone());
  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    if (outcome === 'accepted') installedNow = true;
    notify();
  };
  return { canInstall: Boolean(promptEvent) && !installed, install, installed, ios: /iphone|ipad|ipod/i.test(navigator.userAgent) };
}
