import { describe, it, expect } from 'vitest';
import { runtimeCaching } from '../pwa.config';
import { LOGO_URL } from '../components/ui';

// Workbox writes each urlPattern into sw.js as text, away from the variables of pwa.config.ts
const asInServiceWorker = (pattern: unknown) =>
  typeof pattern === 'function' ? new Function(`return (${pattern.toString()})`)() : pattern;

const matches = (pattern: unknown, href: string): boolean => {
  const p = asInServiceWorker(pattern);
  if (p instanceof RegExp) return p.test(href);
  return Boolean(p({ url: new URL(href), request: new Request(href), sameOrigin: false, event: {} }));
};

const cachesFor = (href: string) => runtimeCaching.filter(r => matches(r.urlPattern, href)).map(r => r.options?.cacheName);

describe('caché del service worker', () => {
  it('cada ruta funciona copiada al service worker', () => {
    for (const route of runtimeCaching) expect(() => matches(route.urlPattern, 'https://example.com/x')).not.toThrow();
  });
  it('guarda el logo y las fuentes, y nada de Supabase', () => {
    expect(cachesFor(LOGO_URL)).toEqual(['logo']);
    expect(cachesFor('https://fonts.googleapis.com/css2?family=Barlow')).toEqual(['google-fonts-css']);
    expect(cachesFor('https://fonts.gstatic.com/s/barlow/v12/x.woff2')).toEqual(['google-fonts-files']);
    expect(cachesFor('https://ggiowrgwagsyayudcojc.supabase.co/rest/v1/vehiculos?select=*')).toEqual([]);
  });
});
