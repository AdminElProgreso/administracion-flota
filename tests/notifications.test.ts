import { describe, it, expect } from 'vitest';
import { DEFAULT_PREFS, type AlertPrefs, type VehicleDates } from '../supabase/functions/_shared/alerts';
import { buildNotification, selectNotifications, planDeliveries, sendAll } from '../supabase/functions/_shared/notifications';
import { T, vehicle } from './fixtures';

describe('buildNotification', () => {
  const v = vehicle('v1');
  it('por vencer', () => {
    expect(buildNotification(v, 'VTV', 'expiring', 10)).toEqual({
      vehicleId: 'v1', docType: 'VTV', kind: 'expiring', days: 10,
      title: 'Vencimiento de VTV', body: 'La VTV del TOYOTA HILUX (AA789XX) vence en 10 días.',
      url: '/#/fleet/v1', tag: 'v1-VTV',
    });
    expect(buildNotification(v, 'VTV', 'expiring', 1).body).toBe('La VTV del TOYOTA HILUX (AA789XX) vence mañana.');
    expect(buildNotification(v, 'VTV', 'expiring', 0).body).toBe('La VTV del TOYOTA HILUX (AA789XX) vence hoy.');
    expect(buildNotification(v, 'Patente', 'expiring', 3)).toMatchObject({ title: 'Vencimiento de patente', body: 'La patente del TOYOTA HILUX (AA789XX) vence en 3 días.' });
  });
  it('vencido', () => {
    expect(buildNotification(v, 'VTV', 'expired', 1)).toMatchObject({ title: 'VTV vencida', body: 'La VTV del TOYOTA HILUX (AA789XX) venció ayer.' });
    expect(buildNotification(v, 'VTV', 'expired', 5).body).toBe('La VTV del TOYOTA HILUX (AA789XX) venció hace 5 días.');
    expect(buildNotification(v, 'Seguro', 'expired', 2)).toMatchObject({ title: 'Seguro vencido', body: 'El seguro del TOYOTA HILUX (AA789XX) venció hace 2 días.' });
    expect(buildNotification(v, 'Patente', 'expired', 2).title).toBe('Patente vencida');
  });
  it('turno', () => {
    expect(buildNotification(v, 'VTV', 'appointment', 2)).toMatchObject({ title: 'Turno de VTV', body: 'Turno de VTV del TOYOTA HILUX (AA789XX) en 2 días.' });
    expect(buildNotification(v, 'VTV', 'appointment', 1).body).toBe('Turno de VTV del TOYOTA HILUX (AA789XX) mañana.');
    expect(buildNotification(v, 'VTV', 'appointment', 0).body).toBe('Turno de VTV del TOYOTA HILUX (AA789XX) hoy.');
    expect(buildNotification(v, 'Seguro', 'appointment', 2)).toMatchObject({ title: 'Turno de seguro', body: 'Turno de seguro del TOYOTA HILUX (AA789XX) en 2 días.' });
  });
  it('patente faltante o en minúsculas', () => {
    expect(buildNotification(vehicle('v2', { model: 'FORD F100', patente: null }), 'VTV', 'expiring', 3).body).toBe('La VTV del FORD F100 (sin patente) vence en 3 días.');
    expect(buildNotification(vehicle('v3', { patente: 'ab123cd' }), 'VTV', 'expiring', 3).body).toBe('La VTV del TOYOTA HILUX (AB123CD) vence en 3 días.');
  });
});

describe('selectNotifications', () => {
  const keys = (vs: VehicleDates[], prefs: AlertPrefs = DEFAULT_PREFS) =>
    selectNotifications(vs, prefs, T).map(n => `${n.vehicleId}-${n.docType}-${n.kind}-${n.days}`);
  it('por vencer dentro del umbral, y vencidos todos los días', () => {
    expect(keys([vehicle('a', { vtv_expiration: '2026-11-13' })])).toEqual(['a-VTV-expiring-10']);
    expect(keys([vehicle('a', { vtv_expiration: '2026-12-04' })])).toEqual([]);
    expect(keys([vehicle('a', { vtv_expiration: '2026-09-24' })])).toEqual(['a-VTV-expired-40']);
  });
  it('nada por unidades de baja ni documentos sin fecha', () => {
    expect(keys([vehicle('a', { status: 'Baja', vtv_expiration: '2026-10-01' }), vehicle('b')])).toEqual([]);
  });
  it('con turno vigente solo avisa el turno, dentro de su umbral', () => {
    expect(keys([vehicle('a', { vtv_expiration: '2026-10-29', vtv_appointment: '2026-11-13' })])).toEqual([]);
    expect(keys([vehicle('a', { vtv_expiration: '2026-10-29', vtv_appointment: '2026-11-06' })])).toEqual(['a-VTV-appointment-3']);
    expect(keys([vehicle('a', { vtv_expiration: '2026-10-29', vtv_appointment: '2026-11-03' })])).toEqual(['a-VTV-appointment-0']);
  });
  it('si el turno ya pasó, vuelve el aviso de vencido', () => {
    expect(keys([vehicle('a', { vtv_expiration: '2026-10-29', vtv_appointment: '2026-11-01' })])).toEqual(['a-VTV-expired-5']);
  });
  it('respeta los interruptores', () => {
    const sinVtv: AlertPrefs = { ...DEFAULT_PREFS, enabled: { ...DEFAULT_PREFS.enabled, VTV: false } };
    expect(keys([vehicle('a', { vtv_expiration: '2026-11-13' })], sinVtv)).toEqual([]);
    expect(keys([vehicle('a', { vtv_appointment: '2026-11-05' })], sinVtv)).toEqual(['a-VTV-appointment-2']);
    const sinTurnos: AlertPrefs = { ...DEFAULT_PREFS, enabled: { ...DEFAULT_PREFS.enabled, appointments: false } };
    expect(keys([vehicle('a', { vtv_expiration: '2026-10-29', vtv_appointment: '2026-11-05' })], sinTurnos)).toEqual([]);
  });
});

describe('planDeliveries', () => {
  it('usa las preferencias de cada usuario, o las de defecto si no tiene fila', () => {
    const subs = [
      { id: 's1', user_id: 'u1', subscription: { endpoint: 'e1' } },
      { id: 's2', user_id: 'u1', subscription: { endpoint: 'e2' } },
      { id: 's3', user_id: 'u2', subscription: { endpoint: 'e3' } },
    ];
    const deliveries = planDeliveries([vehicle('v1', { vtv_expiration: '2026-11-13' })], subs, [{ user_id: 'u2', vtv_alerts: false }], T);
    expect(deliveries.map(d => d.subscriptionId)).toEqual(['s1', 's2']);
    expect(deliveries[0].subscription).toEqual({ endpoint: 'e1' });
    expect(JSON.parse(deliveries[0].payload)).toEqual({
      title: 'Vencimiento de VTV', body: 'La VTV del TOYOTA HILUX (AA789XX) vence en 10 días.', url: '/#/fleet/v1', tag: 'v1-VTV',
    });
  });
  it('si un usuario tiene varias filas, gana la última', () => {
    const rows = [{ user_id: 'u1', vtv_alerts: false }, { user_id: 'u1', vtv_alerts: true }];
    const subs = [{ id: 's1', user_id: 'u1', subscription: {} }];
    expect(planDeliveries([vehicle('v1', { vtv_expiration: '2026-11-13' })], subs, rows, T)).toHaveLength(1);
  });
});

describe('sendAll', () => {
  it('manda todo, cuenta las fallas y marca las suscripciones muertas', async () => {
    const deliveries = [
      { subscriptionId: 's1', subscription: 'S1', payload: 'p1' },
      { subscriptionId: 's2', subscription: 'S2', payload: 'p2' },
      { subscriptionId: 's2', subscription: 'S2', payload: 'p3' },
      { subscriptionId: 's3', subscription: 'S3', payload: 'p4' },
    ];
    const send = async (sub: unknown) => {
      if (sub === 'S2') throw Object.assign(new Error('gone'), { statusCode: 410 });
      if (sub === 'S3') throw Object.assign(new Error('boom'), { statusCode: 500 });
    };
    expect(await sendAll(deliveries, send)).toEqual({ sent: 1, failed: 3, expiredSubscriptionIds: ['s2'] });
  });
});
