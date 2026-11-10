import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';

// El naranja es solo para crear: el botón "+" (.fab) y "Nuevo registro" (.sb-new).
const dir = new URL('../styles/', import.meta.url);
const files = readdirSync(dir).filter(f => f.endsWith('.css'));

function rules(css: string): { selector: string; body: string }[] {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out: { selector: string; body: string }[] = [];
  for (const m of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    out.push({ selector: m[1].trim(), body: m[2] });
  }
  return out;
}

const allowed = /^(:root|\.fab|\.sb-new)(?![\w-])/;

describe('el naranja queda solo para crear', () => {
  it('lee los archivos de estilos', () => {
    expect(files.length).toBeGreaterThanOrEqual(4);
  });

  for (const f of files) {
    it(`${f}: solo :root, .fab y .sb-new usan --naranja-`, () => {
      const css = readFileSync(new URL(f, dir), 'utf8');
      const bad: string[] = [];
      for (const r of rules(css)) {
        if (!/--naranja-/.test(r.body)) continue;
        for (const sel of r.selector.split(',').map(s => s.trim())) {
          if (!allowed.test(sel)) bad.push(sel);
        }
      }
      expect(bad).toEqual([]);
    });
  }
});
