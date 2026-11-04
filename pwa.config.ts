import type { VitePWAOptions } from 'vite-plugin-pwa';

type RuntimeCaching = NonNullable<NonNullable<VitePWAOptions['workbox']>['runtimeCaching']>[number];

// Fonts come from Google: cache them so the installed app starts styled offline.
// Workbox copies each urlPattern into the generated sw.js as text, so a function there can't read anything
// from this file (one that compared against a constant threw on every request): regular expressions only.
export const runtimeCaching: RuntimeCaching[] = [
  {
    urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
    handler: 'StaleWhileRevalidate',
    options: { cacheName: 'google-fonts-css' },
  },
  {
    urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts-files',
      expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
];

// The installed app (tested in tests/pwaCache.test.ts). Logo and icons come from the cooperative's official
// logo: public/logo.svg is the full logo, favicon.svg the symbol, and the PNG icons carry margins
export const pwaOptions: Partial<VitePWAOptions> = {
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'logo.svg'],
  manifest: {
    name: 'El Progreso - Gestión de Flota',
    short_name: 'El Progreso',
    description: 'Sistema de gestión de flota y mantenimiento',
    lang: 'es-AR',
    theme_color: '#0F7A37',
    background_color: '#F6F5F1',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    start_url: '/',
    icons: [
      { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      // Android cuts it to a circle or squircle: white background, the symbol inside the safe zone
      { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    importScripts: ['/sw-push.js'],
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    runtimeCaching,
  },
};
