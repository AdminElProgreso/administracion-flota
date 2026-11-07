import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

type Handler = (event: unknown) => void;
type Shown = { body: string; data: { url: string } };

// Loads the real service worker script with a fake worker scope and returns a helper that fires a push
function load() {
  const handlers: Record<string, Handler> = {};
  let shown: Shown | null = null;
  const self = {
    addEventListener: (type: string, fn: Handler) => { handlers[type] = fn; },
    location: { origin: 'https://flota.test' },
    registration: { showNotification: (_title: string, options: Shown) => { shown = options; return Promise.resolve(); } },
  };
  runInNewContext(readFileSync('public/sw-push.js', 'utf8'), { self, URL, clients: { matchAll: () => Promise.resolve([]) } });
  return (json: unknown): Shown => {
    shown = null;
    handlers.push({ data: json === null ? null : { json: () => json, text: () => '' }, waitUntil: () => {} });
    return shown as unknown as Shown;
  };
}

const push = load();

describe('service worker de avisos', () => {
  it('el aviso de un documento abre su tarjeta', () =>
    expect(push({ url: '/#/fleet/v1', tag: 'v1-VTV' }).data.url).toBe('https://flota.test/#/fleet/v1?doc=VTV'));
  it.each(['Seguro', 'Patente'])('también para %s', type =>
    expect(push({ url: '/#/fleet/v1', tag: `v1-${type}` }).data.url).toBe(`https://flota.test/#/fleet/v1?doc=${type}`));
  it('con otra etiqueta la dirección queda igual', () =>
    expect(push({ url: '/#/fleet', tag: 'fleet-alert' }).data.url).toBe('https://flota.test/#/fleet'));
  it('si la dirección ya tiene parámetros no agrega otro', () =>
    expect(push({ url: '/#/fleet/v1?x=1', tag: 'v1-VTV' }).data.url).toBe('https://flota.test/#/fleet/v1?x=1'));
  it('si no es una ficha no agrega nada', () =>
    expect(push({ url: '/#/agenda', tag: 'v1-VTV' }).data.url).toBe('https://flota.test/#/agenda'));
  it('el texto por defecto usa voseo', () =>
    expect(push(null).body).toBe('Tenés un aviso nuevo de la flota.'));
});
