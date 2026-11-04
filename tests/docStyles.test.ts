import { describe, it, expect } from 'vitest';
import { docStatus } from '../supabase/functions/_shared/alerts';
import { docLabel, docTitle } from '../lib/docStyles';
import { T } from './fixtures';

describe('docLabel', () => {
  it('vencimientos', () => {
    expect(docLabel(docStatus('VTV', '2026-12-04', null, 30, T))).toBe('Al día');
    expect(docLabel(docStatus('VTV', '2026-11-11', null, 30, T))).toBe('Vence en 8 días');
    expect(docLabel(docStatus('VTV', '2026-11-04', null, 30, T))).toBe('Vence mañana');
    expect(docLabel(docStatus('VTV', '2026-11-03', null, 30, T))).toBe('Vence hoy');
    expect(docLabel(docStatus('VTV', '2026-11-02', null, 30, T))).toBe('Venció ayer');
    expect(docLabel(docStatus('VTV', '2026-10-29', null, 30, T))).toBe('Venció hace 5 días');
    expect(docLabel(docStatus('VTV', null, null, 30, T))).toBe('Sin fecha');
  });
  it('turnos', () => {
    expect(docLabel(docStatus('VTV', '2026-10-29', '2026-11-03', 30, T))).toBe('Turno hoy');
    expect(docLabel(docStatus('VTV', '2026-10-29', '2026-11-04', 30, T))).toBe('Turno mañana');
    expect(docLabel(docStatus('VTV', '2026-10-29', '2026-11-20', 30, T))).toBe('Turno el 20/11');
  });
});

describe('docTitle', () => {
  it('con género y estado', () => {
    expect(docTitle(docStatus('Seguro', '2026-10-29', null, 15, T))).toBe('Seguro vencido');
    expect(docTitle(docStatus('VTV', '2026-10-29', null, 30, T))).toBe('VTV vencida');
    expect(docTitle(docStatus('Patente', '2026-10-29', null, 10, T))).toBe('Patente vencida');
    expect(docTitle(docStatus('VTV', '2026-11-10', null, 30, T))).toBe('VTV por vencer');
    expect(docTitle(docStatus('Patente', null, '2026-11-10', 10, T))).toBe('Turno de Patente');
    expect(docTitle(docStatus('Seguro', '2027-06-01', null, 15, T))).toBe('Seguro');
  });
});
