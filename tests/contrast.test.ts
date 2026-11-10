import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../styles/base.css', import.meta.url), 'utf8');
const root = css.slice(css.indexOf(':root'), css.indexOf('}', css.indexOf(':root')));
const tokens: Record<string, string> = {};
for (const m of root.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) tokens[m[1]] = m[2];

const channel = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
function lum(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => channel(c / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const color = (v: string) => (v.startsWith('#') ? v : tokens[v]);

const pairs: [string, string][] = [
  ['tinta-4', 'blanco'], ['tinta-4', 'papel'], ['tinta-4', 'none-bg'], ['tinta-4', 'linea-2'],
  ['ok', 'ok-bg'], ['none', 'none-bg'], ['warn', 'warn-bg'], ['bad', 'bad-bg'], ['appt', 'appt-bg'],
  ['naranja-700', 'naranja-100'], ['#FFFFFF', 'naranja-700'],
  ['none', 'blanco'], ['tinta-2', 'linea-2'],
];

describe('contraste legible al sol (WCAG AA, 4,5:1)', () => {
  it.each(pairs)('%s sobre %s', (fg, bg) => {
    const f = color(fg), b = color(bg);
    expect(f, fg).toBeTruthy();
    expect(b, bg).toBeTruthy();
    expect(contrast(f, b)).toBeGreaterThanOrEqual(4.5);
  });

  it('borde punteado de "Sin fecha" (tinta-4 sobre blanco, 3:1)', () => {
    expect(contrast(tokens['tinta-4'], tokens['blanco'])).toBeGreaterThanOrEqual(3);
  });

  it('anillo de foco blanco sobre el encabezado de Inicio (3:1)', () => {
    expect(contrast('#FFFFFF', tokens['verde-800'])).toBeGreaterThanOrEqual(3);
  });
});
