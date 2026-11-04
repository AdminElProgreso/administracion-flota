import { supabase } from '../supabase';

// Web push for this device: subscribe, unsubscribe and test (moved here from the old Settings page)
export type PushSupport = 'ok' | 'ios-install' | 'unsupported' | 'blocked';

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function pushSupport(): PushSupport {
  const capable = 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined';
  // iPhone only allows notifications once the app is installed on the home screen
  if (!capable) return isIos() && !isStandalone() ? 'ios-install' : 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  return 'ok';
}

async function currentSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  return (await registration?.pushManager.getSubscription()) ?? null;
}

export async function isDeviceSubscribed(): Promise<boolean> {
  return Boolean(await currentSubscription());
}

const removeRow = (subscription: PushSubscription) =>
  supabase.from('push_subscriptions').delete().filter('subscription', 'cs', JSON.stringify(subscription));

function vapidKey(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = window.atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

export async function subscribeDevice(userId: string): Promise<void> {
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!key) throw new Error('Falta la clave de notificaciones de la app.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Permiso denegado: habilitá las notificaciones en el navegador.');

  const registration = await navigator.serviceWorker.ready;
  // A fresh subscription makes sure the current VAPID key is used; the old one leaves no row behind
  const old = await registration.pushManager.getSubscription();
  if (old) {
    await removeRow(old);
    await old.unsubscribe();
  }
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidKey(key) });
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ user_id: userId, subscription: subscription.toJSON(), updated_at: new Date().toISOString() }, { onConflict: 'subscription' });
  if (error) {
    console.error('Push registration error', error);
    await subscription.unsubscribe().catch(() => undefined);
    throw new Error('No se pudo registrar este dispositivo. Probá de nuevo.');
  }
}

export async function unsubscribeDevice(): Promise<void> {
  const subscription = await currentSubscription();
  if (!subscription) return;
  await removeRow(subscription);
  await subscription.unsubscribe();
}

export async function showTestNotification(): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification('Prueba de notificación', {
    body: 'Así te van a llegar los avisos de la flota.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'prueba',
  });
}
