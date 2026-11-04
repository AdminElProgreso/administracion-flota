import { describe, it, expect } from 'vitest';
import { DEFAULT_PREFS, attentionList } from '../supabase/functions/_shared/alerts';
import { attentionSummary, nextExpiryLabel } from '../lib/home';
import { T, vehicle } from './fixtures';

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
  it('días hasta el próximo vencimiento', () => {
    expect(nextExpiryLabel(0)).toBe('Hoy');
    expect(nextExpiryLabel(1)).toBe('Mañana');
    expect(nextExpiryLabel(12)).toBe('12 días');
    expect(nextExpiryLabel(null)).toBe('—');
  });
});
