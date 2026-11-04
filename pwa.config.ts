import type { VitePWAOptions } from 'vite-plugin-pwa';

type RuntimeCaching = NonNullable<NonNullable<VitePWAOptions['workbox']>['runtimeCaching']>[number];

// Fonts and logo come from other origins: cache them so the installed app starts styled offline.
// Workbox copies each urlPattern into the generated sw.js as text, so a function there can't read anything
// from this file (one that compared against a LOGO_URL constant threw on every request): regular expressions only.
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
  {
    // The cooperative's logo: the same URL as LOGO_URL in components/ui.tsx (the test checks both match)
    urlPattern: /^https:\/\/elprogresocoop\.com\.ar\/public\/img\/logo_nav\.png$/,
    handler: 'StaleWhileRevalidate',
    options: { cacheName: 'logo', cacheableResponse: { statuses: [0, 200] } },
  },
];
