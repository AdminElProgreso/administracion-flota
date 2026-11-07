import { describe, it, expect } from 'vitest';
import { DEFAULT_PREFS, attentionList } from '../supabase/functions/_shared/alerts';
import { attentionSummary, missingDates, nextExpiryLabel, statusLink } from '../lib/home';
import { T, vehicle, vrow } from './fixtures';

describe('inicio', () => {
  it('todo al día', () => {
    expect(attentionSummary([])).toEqual({
      title: 'Toda la documentación está al día',
      detail: 'Te avisamos cuando algo se acerque a su vencimiento',
    });
  });
  it('cuenta vencidos, por vencer y turnos', () => {
    const items = attentionList([
      vehicle('a', { vtv_expiration: '2026-10-01', insurance_expiration: '2026-10-20' }),
      vehicle('b', { patente_expiration: '2026-11-05' }),
      vehicle('c', { vtv_expiration: '2026-10-01', vtv_appointment: '2026-11-10' }),
    ], DEFAULT_PREFS, T);
    expect(attentionSummary(items)).toEqual({ title: '4 documentos necesitan atención', detail: '2 vencidos · 1 por vencer · 1 con turno' });
    expect(attentionSummary(items.slice(0, 1))).toEqual({ title: '1 documento necesita atención', detail: '1 vencido' });
  });
  it('cuenta los documentos sin fecha, sin bajas ni generadores ni turnos', () => {
    const fleet = [vrow('a'), vrow('b', { status: 'Baja' }), vrow('c', { tipo: 'generator' }),
      vrow('d', { vtv_expiration: '2027-01-10', insurance_appointment: '2026-11-20' })];
    expect(missingDates(fleet, T)).toBe(4); // a: 3, d: patente
  });
  it('sin fechas no dice que todo está al día', () => {
    expect(attentionSummary([], 48)).toEqual({ title: '48 documentos sin fecha', detail: 'No generan avisos hasta que cargues la fecha' });
    expect(attentionSummary([], 1).title).toBe('1 documento sin fecha');
    expect(attentionSummary([], 0).title).toBe('Toda la documentación está al día');
  });
  it('suma los sin fecha al detalle', () => {
    const items = attentionList([
      vehicle('a', { vtv_expiration: '2026-10-01', insurance_expiration: '2026-10-20' }),
      vehicle('b', { patente_expiration: '2026-11-05' }),
      vehicle('c', { vtv_expiration: '2026-10-01', vtv_appointment: '2026-11-10' }),
    ], DEFAULT_PREFS, T);
    expect(attentionSummary(items, 3).detail).toBe('2 vencidos · 1 por vencer · 1 con turno · 3 sin fecha');
  });
  it('la tarjeta de estado lleva a lo que hay que hacer', () => {
    expect(statusLink(0, 48)).toBe('/fleet?filtro=sinfecha');
    expect(statusLink(2, 48)).toBe('/calendar');
    expect(statusLink(0, 0)).toBe('/calendar');
  });
  it('días hasta el próximo vencimiento', () => {
    expect(nextExpiryLabel(0)).toBe('Hoy');
    expect(nextExpiryLabel(1)).toBe('Mañana');
    expect(nextExpiryLabel(12)).toBe('12 días');
    expect(nextExpiryLabel(null)).toBe('—');
  });
});
