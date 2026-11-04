import { vehicleDocs, type AlertPrefs, type DocStatus, type VehicleDates } from '../supabase/functions/_shared/alerts';
import { STATE_CLASS, docTitle } from './docStyles';

export interface AgendaEvent {
  date: string;
  vehicle: VehicleDates;
  doc: DocStatus;
  kind: 'expiration' | 'appointment';
}

const byDate = (a: AgendaEvent, b: AgendaEvent) => a.date.localeCompare(b.date);

// Overdue documents, then what comes next; a booked appointment replaces its document's expiration
export function agendaEvents(vehicles: VehicleDates[], prefs: AlertPrefs, today: string): { overdue: AgendaEvent[]; upcoming: AgendaEvent[] } {
  const overdue: AgendaEvent[] = [];
  const upcoming: AgendaEvent[] = [];
  for (const vehicle of vehicles) {
    if (vehicle.status === 'Baja') continue;
    for (const doc of vehicleDocs(vehicle, prefs, today)) {
      if (doc.state === 'appointment' && doc.appointment) upcoming.push({ date: doc.appointment, vehicle, doc, kind: 'appointment' });
      else if (doc.state === 'expired' && doc.expiration) overdue.push({ date: doc.expiration, vehicle, doc, kind: 'expiration' });
      else if ((doc.state === 'expiring' || doc.state === 'ok') && doc.expiration) upcoming.push({ date: doc.expiration, vehicle, doc, kind: 'expiration' });
    }
  }
  return { overdue: overdue.sort(byDate), upcoming: upcoming.sort(byDate) };
}

export const eventDays = (e: AgendaEvent): number =>
  (e.kind === 'appointment' ? e.doc.daysToAppointment : e.doc.daysToExpiration) ?? 0;

// Color of an event (row date, month dots): an appointment is blue even over an expired document
export const eventTone = (e: AgendaEvent): string =>
  e.kind === 'appointment' ? STATE_CLASS.appointment : STATE_CLASS[e.doc.state];

const UPCOMING_TITLE = { Seguro: 'Vence el seguro', VTV: 'Vence la VTV', Patente: 'Vence la patente' } as const;

export function eventTitle(e: AgendaEvent): string {
  if (e.kind === 'appointment') return `Turno de ${e.doc.type}`;
  if (e.doc.state === 'expired') return docTitle(e.doc);
  return UPCOMING_TITLE[e.doc.type];
}

export function agendaWhen(days: number): string {
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  if (days === -1) return 'Ayer';
  return days > 0 ? `En ${days} días` : `Hace ${-days} días`;
}

export function groupByMonth<T extends { date: string }>(items: T[]): { key: string; year: number; month: number; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = item.date.slice(0, 7);
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }
  return [...groups].map(([key, list]) => {
    const [year, month] = key.split('-').map(Number);
    return { key, year, month, items: list };
  });
}

// Month grid starting on Monday: leading empty cells, then the days
export function monthCells(year: number, month: number): (number | null)[] {
  const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return [...Array<null>(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
}

export function eventsByDay(events: AgendaEvent[], year: number, month: number): Map<number, AgendaEvent[]> {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;
  const days = new Map<number, AgendaEvent[]>();
  for (const e of events) {
    if (!e.date.startsWith(prefix)) continue;
    const day = Number(e.date.slice(8, 10));
    const list = days.get(day);
    if (list) list.push(e);
    else days.set(day, [e]);
  }
  return days;
}
