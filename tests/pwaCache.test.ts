import { existsSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { pwaOptions, runtimeCaching } from '../pwa.config';
import { LOGO_URL } from '../components/ui';
import { TYPE_INFO } from '../lib/vehicles';

// Workbox writes each urlPattern into sw.js as text, away from the variables of pwa.config.ts
const asInServiceWorker = (pattern: unknown) =>
  typeof pattern === 'function' ? new Function(`return (${pattern.toString()})`)() : pattern;

const matches = (pattern: unknown, href: string): boolean => {
  const p = asInServiceWorker(pattern);
  if (p instanceof RegExp) return p.test(href);
  return Boolean(p({ url: new URL(href), request: new Request(href), sameOrigin: false, event: {} }));
};

const cachesFor = (href: string) => runtimeCaching.filter(r => matches(r.urlPattern, href)).map(r => r.options?.cacheName);

type Icon = { src: string; sizes: string; purpose?: string };
const manifest = pwaOptions.manifest as { lang?: string; icons: Icon[] };

describe('service worker y app instalada', () => {
  it('cada ruta funciona copiada al service worker', () => {
    for (const route of runtimeCaching) expect(() => matches(route.urlPattern, 'https://example.com/x')).not.toThrow();
  });
  it('guarda las fuentes y nada de Supabase', () => {
    expect(cachesFor('https://fonts.googleapis.com/css2?family=Barlow')).toEqual(['google-fonts-css']);
    expect(cachesFor('https://fonts.gstatic.com/s/barlow/v12/x.woff2')).toEqual(['google-fonts-files']);
    expect(cachesFor('https://ggiowrgwagsyayudcojc.supabase.co/rest/v1/vehiculos?select=*')).toEqual([]);
  });
  it('el logo oficial viene con la app y queda guardado para usarla sin conexión', () => {
    expect(LOGO_URL).toBe('/logo.svg');
    expect(pwaOptions.includeAssets).toContain('logo.svg');
    expect(existsSync('public/logo.svg')).toBe(true);
  });
  it('las ilustraciones de cada tipo de vehículo vienen con la app', () => {
    for (const info of Object.values(TYPE_INFO)) expect(existsSync(`public${info.image}`)).toBe(true);
    expect(pwaOptions.includeAssets).toContain('vehiculos/*.svg');
  });
  it('íconos: los comunes y uno con margen para el recorte de Android', () => {
    expect(manifest.icons.filter(i => i.purpose === 'maskable').map(i => i.src)).toEqual(['/pwa-maskable-512x512.png']);
    expect(manifest.icons.filter(i => i.purpose !== 'maskable').map(i => i.sizes)).toEqual(['192x192', '512x512']);
    for (const icon of manifest.icons) expect(existsSync(`public${icon.src}`)).toBe(true);
  });
  it('el manifiesto está en castellano', () => {
    expect(manifest.lang).toBe('es-AR');
  });
});
