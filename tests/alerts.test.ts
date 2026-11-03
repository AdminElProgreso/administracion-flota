import { describe, it, expect } from 'vitest';
import { DEFAULT_PREFS, prefsFromRow, rowFromPrefs, docStatus, vehicleDocs, attentionList, appointmentAfterRenewal } from '../supabase/functions/_shared/alerts';
import { T, vehicle } from './fixtures';

describe('docStatus', () => {
  it('por vencer, vencido y al día según el umbral', () => {
    expect(docStatus('VTV', '2026-11-03', null, 30, T)).toMatchObject({ state: 'expiring', daysToExpiration: 0 });
    expect(docStatus('VTV', '2026-12-03', null, 30, T)).toMatchObject({ state: 'expiring', daysToExpiration: 30 });
    expect(docStatus('VTV', '2026-12-04', null, 30, T)).toMatchObject({ state: 'ok', daysToExpiration: 31 });
    expect(docStatus('VTV', '2026-11-02', null, 30, T)).toMatchObject({ state: 'expired', daysToExpiration: -1 });
  });
  it('sin fechas, o con texto vacío, queda sin fecha', () => {
    expect(docStatus('VTV', null, null, 30, T)).toMatchObject({ state: 'no-date', daysToExpiration: null, daysToAppointment: null });
    expect(docStatus('VTV', '', '', 30, T)).toMatchObject({ state: 'no-date', expiration: null, appointment: null });
  });
  it('el turno vigente gana aunque el documento esté vencido', () => {
    expect(docStatus('VTV', '2026-10-29', '2026-11-23', 30, T)).toMatchObject({ state: 'appointment', daysToAppointment: 20, pastAppointment: false });
    expect(docStatus('VTV', '2026-11-10', '2026-11-03', 30, T)).toMatchObject({ state: 'appointment', daysToAppointment: 0 });
    expect(docStatus('VTV', null, '2026-11-20', 30, T)).toMatchObject({ state: 'appointment' });
  });
  it('un turno pasado no cuenta; la nota aparece solo si está por vencer o vencido', () => {
    expect(docStatus('VTV', '2026-10-29', '2026-11-01', 30, T)).toMatchObject({ state: 'expired', pastAppointment: true });
    expect(docStatus('VTV', '2027-05-01', '2026-11-01', 30, T)).toMatchObject({ state: 'ok', pastAppointment: false });
  });
});

describe('preferencias', () => {
  it('sin fila usa los valores por defecto', () => {
    expect(prefsFromRow(null)).toEqual(DEFAULT_PREFS);
    expect(DEFAULT_PREFS).toEqual({
      thresholds: { Seguro: 15, VTV: 30, Patente: 10, appointments: 3 },
      enabled: { Seguro: true, VTV: true, Patente: true, appointments: true },
    });
  });
  it('completa los campos nulos con los valores por defecto', () => {
    const p = prefsFromRow({ vtv_threshold: 45, insurance_threshold: null, patente_alerts: false });
    expect(p.thresholds).toEqual({ Seguro: 15, VTV: 45, Patente: 10, appointments: 3 });
    expect(p.enabled).toEqual({ Seguro: true, VTV: true, Patente: false, appointments: true });
  });
  it('arma la fila de user_settings', () => {
    expect(rowFromPrefs('u1', DEFAULT_PREFS)).toEqual({
      user_id: 'u1', insurance_threshold: 15, vtv_threshold: 30, patente_threshold: 10, appointments_threshold: 3,
      insurance_alerts: true, vtv_alerts: true, patente_alerts: true, appointment_alerts: true,
    });
  });
});

describe('vehicleDocs', () => {
  it('usa el umbral de cada tipo', () => {
    const docs = vehicleDocs(vehicle('v1', { insurance_expiration: '2026-11-23', vtv_expiration: '2026-11-23' }), DEFAULT_PREFS, T);
    expect(docs.map(d => [d.type, d.state])).toEqual([['Seguro', 'ok'], ['VTV', 'expiring'], ['Patente', 'no-date']]);
  });
});

describe('attentionList', () => {
  it('vencidos, después por vencer, después turnos; sin unidades de baja', () => {
    const list = attentionList([
      vehicle('C', { patente_expiration: '2026-11-06' }),
      vehicle('E', { insurance_appointment: '2026-11-13' }),
      vehicle('B', { insurance_expiration: '2026-11-02' }),
      vehicle('G', { status: 'Baja', vtv_expiration: '2026-10-24' }),
      vehicle('F', { vtv_appointment: '2026-11-05' }),
      vehicle('D', { vtv_expiration: '2026-11-03' }),
      vehicle('A', { vtv_expiration: '2026-10-29' }),
    ], DEFAULT_PREFS, T);
    expect(list.map(i => `${i.vehicle.id}-${i.doc.type}`)).toEqual(['A-VTV', 'B-Seguro', 'D-VTV', 'C-Patente', 'F-VTV', 'E-Seguro']);
  });
});

describe('appointmentAfterRenewal', () => {
  it('borra el turno al cambiar el vencimiento si no se cargó uno nuevo', () => {
    expect(appointmentAfterRenewal('2026-11-10', '2027-11-10', '2026-11-05', '2026-11-05')).toBeNull();
    expect(appointmentAfterRenewal('2026-11-10', '2027-11-10', '2026-11-05', '2026-11-20')).toBe('2026-11-20');
    expect(appointmentAfterRenewal('2026-11-10', '2026-11-10', '', '2026-11-20')).toBe('2026-11-20');
    expect(appointmentAfterRenewal('2026-11-10', '2026-11-10', '2026-11-05', '2026-11-05')).toBe('2026-11-05');
    expect(appointmentAfterRenewal('2026-11-10', '2026-11-10', '2026-11-05', '')).toBeNull();
  });
});
