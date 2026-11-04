import { describe, it, expect } from 'vitest';
import { DEFAULT_PREFS, docStatus, type AlertPrefs } from '../supabase/functions/_shared/alerts';
import { docCardText } from '../lib/docCard';
import { T } from './fixtures';

// DEFAULT_PREFS: Seguro 15, VTV 30, Patente 10 y turnos 3 días
const prefs = DEFAULT_PREFS;
const vtv = (exp: string | null, appt: string | null = null) => docStatus('VTV', exp, appt, 30, T);

describe('tarjeta de documento en la ficha', () => {
  it('al día, con el umbral del usuario', () => {
    expect(docCardText(vtv('2027-01-23'), prefs)).toEqual({ lead: 'Vence el', strong: '23/01/2027', hint: 'Te empezamos a avisar 30 días antes' });
    const one: AlertPrefs = { ...prefs, thresholds: { ...prefs.thresholds, VTV: 1 } };
    expect(docCardText(docStatus('VTV', '2027-01-23', null, 1, T), one).hint).toBe('Te empezamos a avisar 1 día antes');
  });
  it('por vencer, con el artículo de cada documento', () => {
    expect(docCardText(docStatus('Seguro', '2026-11-10', null, 15, T), prefs).hint).toBe('Te avisamos todos los días hasta que lo renueves');
    expect(docCardText(vtv('2026-11-10'), prefs).hint).toBe('Te avisamos todos los días hasta que la renueves');
  });
  it('vencido', () => {
    expect(docCardText(docStatus('Patente', '2026-10-01', null, 10, T), prefs))
      .toEqual({ lead: 'Venció el', strong: '01/10/2026', hint: 'Aviso diario hasta que se renueve o cargues un turno' });
  });
  it('con turno', () => {
    expect(docCardText(vtv('2026-10-01', T), prefs)).toEqual({ lead: 'Turno', strong: 'hoy', hint: 'Venció el 01/10/2026 · te recordamos el turno 3 días antes' });
    expect(docCardText(vtv(null, '2026-11-04'), prefs)).toEqual({ lead: 'Turno', strong: 'mañana', hint: 'Te recordamos el turno 3 días antes' });
    expect(docCardText(vtv(null, '2026-11-20'), prefs)).toEqual({ lead: 'Turno el', strong: '20/11/2026', hint: 'Te recordamos el turno 3 días antes' });
  });
  it('turno que ya pasó sin renovar', () => {
    expect(docCardText(vtv('2026-10-01', '2026-10-20'), prefs).hint).toBe('El turno del 20/10/2026 ya pasó: registrá la renovación o cargá otro turno');
  });
  it('sin fecha', () => {
    expect(docCardText(docStatus('Seguro', null, null, 15, T), prefs))
      .toEqual({ lead: 'Sin fecha cargada', strong: null, hint: 'Cargá la fecha de vencimiento para recibir avisos.' });
  });
  it('avisos apagados en Ajustes', () => {
    const off: AlertPrefs = { ...prefs, enabled: { ...prefs.enabled, VTV: false, appointments: false } };
    expect(docCardText(vtv('2026-11-10'), off).hint).toBe('Los avisos de VTV están apagados en Ajustes');
    expect(docCardText(vtv(null, '2026-11-20'), off).hint).toBe('Los recordatorios de turnos están apagados en Ajustes');
  });
});
