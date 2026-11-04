import { describe, it, expect } from 'vitest';
import { DEFAULT_PREFS } from '../supabase/functions/_shared/alerts';
import { agendaEvents, eventTitle, agendaWhen, groupByMonth, monthCells, eventDays, eventTone, type AgendaEvent } from '../lib/agenda';
import { T, vehicle } from './fixtures';

describe('agendaEvents', () => {
  const vs = [
    vehicle('A', { vtv_expiration: '2026-10-29' }),
    vehicle('B', { vtv_expiration: '2026-10-29', vtv_appointment: '2026-11-06' }),
    vehicle('C', { insurance_expiration: '2026-11-20' }),
    vehicle('D', { status: 'Baja', vtv_expiration: '2026-10-01' }),
    vehicle('E', { patente_expiration: '2026-11-05' }),
  ];
  const key = (e: AgendaEvent) => `${e.vehicle.id}-${e.doc.type}-${e.kind}`;
  it('separa vencidos y próximos, sin unidades de baja', () => {
    const { overdue, upcoming } = agendaEvents(vs, DEFAULT_PREFS, T);
    expect(overdue.map(key)).toEqual(['A-VTV-expiration']);
    expect(upcoming.map(key)).toEqual(['E-Patente-expiration', 'B-VTV-appointment', 'C-Seguro-expiration']);
    expect(upcoming.map(eventDays)).toEqual([2, 3, 17]);
  });
  it('títulos', () => {
    const { overdue, upcoming } = agendaEvents(vs, DEFAULT_PREFS, T);
    expect(eventTitle(overdue[0])).toBe('VTV vencida');
    expect(upcoming.map(eventTitle)).toEqual(['Vence la patente', 'Turno de VTV', 'Vence el seguro']);
  });
  it('color: el turno manda sobre el estado del documento', () => {
    const { overdue, upcoming } = agendaEvents(vs, DEFAULT_PREFS, T);
    expect(eventTone(overdue[0])).toBe('st-bad');
    expect(upcoming.map(eventTone)).toEqual(['st-warn', 'st-appt', 'st-ok']);
  });
});

describe('agenda: textos y meses', () => {
  it('cuándo', () => {
    expect([0, 1, 5, -1, -3].map(agendaWhen)).toEqual(['Hoy', 'Mañana', 'En 5 días', 'Ayer', 'Hace 3 días']);
  });
  it('agrupa por mes en orden', () => {
    const g = groupByMonth([{ date: '2026-11-05' }, { date: '2026-11-20' }, { date: '2026-12-01' }]);
    expect(g.map(x => [x.key, x.year, x.month, x.items.length])).toEqual([['2026-11', 2026, 11, 2], ['2026-12', 2026, 12, 1]]);
  });
  it('grilla del mes empezando el lunes', () => {
    const nov = monthCells(2026, 11);
    expect(nov.slice(0, 7)).toEqual([null, null, null, null, null, null, 1]);
    expect(nov.length).toBe(36);
    expect(monthCells(2026, 2).length).toBe(34);
  });
});
