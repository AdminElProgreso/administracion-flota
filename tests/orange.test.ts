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

// Only :root (the token definition) or the element being styled being .fab / .sb-new.
// Their own states and pseudo-classes are fine; combinators and other elements are not.
const allowed = /^(:root|(\.fab|\.sb-new)(::?[\w-]+(\([^)]*\))?)*)$/;

function offenders(css: string): string[] {
  const bad: string[] = [];
  for (const r of rules(css)) {
    if (!/--naranja-/.test(r.body)) continue;
    for (const sel of r.selector.split(',').map(s => s.trim())) {
      if (!allowed.test(sel)) bad.push(sel);
    }
  }
  return bad;
}

describe('el naranja queda solo para crear', () => {
  it('lee los archivos de estilos', () => {
    expect(files.length).toBeGreaterThanOrEqual(4);
  });

  it('la guarda rechaza lo que no es .fab ni .sb-new', () => {
    const css = `:root{--naranja-600:#E85122}
.fab:active{background:var(--naranja-600)}
.sb-new:hover:not(:disabled){background:var(--naranja-600)}
:root .chip{color:var(--naranja-600)}
.fab ~ .chip{color:var(--naranja-600)}
.fab .x, .chip{color:var(--naranja-600)}
.fabulous{color:var(--naranja-600)}`;
    expect(offenders(css)).toEqual([':root .chip', '.fab ~ .chip', '.fab .x', '.chip', '.fabulous']);
  });

  for (const f of files) {
    it(`${f}: solo :root, .fab y .sb-new usan --naranja-`, () => {
      const css = readFileSync(new URL(f, dir), 'utf8');
      expect(offenders(css)).toEqual([]);
    });
  }
});
