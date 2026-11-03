import { describe, it, expect } from 'vitest';
import { docStatus } from '../supabase/functions/_shared/alerts';
import { docLabel, calendarExpirationLabel, calendarAppointmentLabel } from '../lib/docStyles';
import { T } from './fixtures';

describe('docLabel', () => {
  it('etiqueta por estado', () => {
    expect(docLabel(docStatus('VTV', '2026-12-04', null, 30, T))).toBe('Al día');
    expect(docLabel(docStatus('VTV', '2026-11-11', null, 30, T))).toBe('Faltan 8 días');
    expect(docLabel(docStatus('VTV', '2026-11-04', null, 30, T))).toBe('Falta 1 día');
    expect(docLabel(docStatus('VTV', '2026-11-03', null, 30, T))).toBe('Vence hoy');
    expect(docLabel(docStatus('VTV', '2026-11-02', null, 30, T))).toBe('Venció ayer');
    expect(docLabel(docStatus('VTV', '2026-10-29', null, 30, T))).toBe('Venció hace 5 días');
    expect(docLabel(docStatus('VTV', null, null, 30, T))).toBe('Sin fecha');
  });
  it('turno en formato largo y corto', () => {
    const doc = docStatus('VTV', '2026-10-29', '2026-11-20', 30, T);
    expect(docLabel(doc)).toBe('Turno: 20/11/2026');
    expect(docLabel(doc, 'short')).toBe('Turno 20/11');
  });
});

describe('calendario', () => {
  it('vencimientos con el umbral del usuario', () => {
    expect(calendarExpirationLabel(-1, 30)).toEqual({ text: 'Vencido', tone: 'red' });
    expect(calendarExpirationLabel(0, 30)).toEqual({ text: 'Vence hoy', tone: 'amber' });
    expect(calendarExpirationLabel(1, 30)).toEqual({ text: 'Falta 1 día', tone: 'amber' });
    expect(calendarExpirationLabel(30, 30)).toEqual({ text: 'Faltan 30 días', tone: 'amber' });
    expect(calendarExpirationLabel(31, 30)).toEqual({ text: 'Próximo', tone: 'neutral' });
  });
  it('turnos', () => {
    expect(calendarAppointmentLabel(0)).toBe('Programado');
    expect(calendarAppointmentLabel(5)).toBe('Programado');
    expect(calendarAppointmentLabel(-1)).toBe('Turno pasado');
  });
});
