import { describe, it, expect } from 'vitest';
import { emptyWorkForm, formFromWork, parseCost, workFromForm } from '../lib/works';

describe('works', () => {
  it('costo con formato argentino', () => {
    expect(parseCost('$ 385.000')).toBe(385000);
    expect(parseCost('98500')).toBe(98500);
    expect(parseCost('1.234,50')).toBe(1235);
    expect(parseCost('')).toBeNull();
    expect(parseCost('abc')).toBeNull();
  });
  it('arma el trabajo y exige descripción', () => {
    expect(workFromForm({ vehicle_id: 'v1', type: 'Reparación', date: '2026-11-04', description: ' Cambio de embrague ', provider: '', cost: '' }))
      .toEqual({ vehicle_id: 'v1', type: 'Reparación', date: '2026-11-04', description: 'Cambio de embrague', provider: null, cost: 0, status: 'Completado' });
    expect(() => workFromForm({ vehicle_id: 'v1', type: 'Mantenimiento', date: '2026-11-04', description: '  ', provider: '', cost: '' })).toThrow('Contá qué se hizo');
  });
  it('exige vehículo y fecha', () => {
    const f = { ...emptyWorkForm('v1', '2026-11-04'), description: 'Cambio de aceite' };
    expect(() => workFromForm({ ...f, vehicle_id: '' })).toThrow('Elegí el vehículo');
    expect(() => workFromForm({ ...f, date: '' })).toThrow('Elegí la fecha');
  });
  it('arranca en mantenimiento con la fecha de hoy', () => {
    expect(emptyWorkForm('v2', '2026-11-04')).toEqual({ vehicle_id: 'v2', type: 'Mantenimiento', date: '2026-11-04', description: '', provider: '', cost: '' });
  });
  it('arma el formulario de un trabajo guardado', () => {
    expect(formFromWork({ id: 'w', vehicle_id: 'v1', type: 'Reparación', date: '2026-01-21', description: 'Bomba', provider: null, cost: 1000000, status: 'Completado' }))
      .toEqual({ vehicle_id: 'v1', type: 'Reparación', date: '2026-01-21', description: 'Bomba', provider: '', cost: '1.000.000' });
    expect(formFromWork({ id: 'w', vehicle_id: 'v1', type: 'Mantenimiento', date: '2026-01-21', description: null, provider: 'Taller', cost: 0, status: null }).cost).toBe('');
  });
});
