import { describe, it, expect } from 'vitest';
import { parseCost, workFromForm } from '../lib/works';

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
});
