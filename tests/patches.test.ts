import { describe, it, expect } from 'vitest';
import { renewPatch, appointmentPatch } from '../lib/patches';

describe('patches', () => {
  it('renovar borra el turno', () => {
    expect(renewPatch('VTV', '2027-11-04')).toEqual({ vtv_expiration: '2027-11-04', vtv_appointment: null });
    expect(renewPatch('Seguro', '2027-01-10')).toEqual({ insurance_expiration: '2027-01-10', insurance_appointment: null });
  });
  it('cargar o quitar turno', () => {
    expect(appointmentPatch('Patente', '2026-11-20')).toEqual({ patente_appointment: '2026-11-20' });
    expect(appointmentPatch('Patente', '')).toEqual({ patente_appointment: null });
  });
});
