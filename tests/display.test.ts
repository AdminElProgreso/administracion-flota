import { describe, it, expect } from 'vitest';
import { DEFAULT_PREFS, vehicleDocs, type AlertPrefs } from '../supabase/functions/_shared/alerts';
import { displayPrefs } from '../lib/display';
import { T, vehicle } from './fixtures';

const ones: AlertPrefs = { ...DEFAULT_PREFS, thresholds: { Seguro: 1, VTV: 1, Patente: 1, appointments: 7 } };

describe('ventana fija de lo que se ve', () => {
  it('la ventana de la app es de 30 días para todos', () => {
    expect(displayPrefs(ones).thresholds).toEqual({ Seguro: 30, VTV: 30, Patente: 30, appointments: 7 });
    expect(displayPrefs(ones).enabled).toEqual(ones.enabled);
  });
  it('una VTV a 2 días se ve por vencer aunque el aviso sea de 1 día', () => {
    const v = vehicle('a', { vtv_expiration: '2026-11-05' });
    expect(vehicleDocs(v, ones, T)[1].state).toBe('ok');
    expect(vehicleDocs(v, displayPrefs(ones), T)[1].state).toBe('expiring');
  });
});
