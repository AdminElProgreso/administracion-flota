import { DEFAULT_PREFS, vehicleDocs, type AttentionItem } from '../supabase/functions/_shared/alerts';
import type { VehicleRow } from '../types';
import { DISPLAY_WINDOW_DAYS } from './display';
import { greeting, longDate, money } from './format';
import { hasMissingDate } from './vehicles';

// Texts of the Inicio screen (pages/Dashboard.tsx)

// Documents with no expiration date send no notices; the office has to see how many are still to load.
// Which units count is decided by hasMissingDate (lib/vehicles.ts), the same rule as the "Sin fecha" filter.
export function missingDates(vehicles: VehicleRow[], today: string): number {
  return vehicles
    .filter(v => hasMissingDate(v, today))
    .reduce((n, v) => n + vehicleDocs(v, DEFAULT_PREFS, today).filter(d => d.state === 'no-date').length, 0);
}

export const statusLink = (items: number, missing: number): string => (!items && missing ? '/fleet?filtro=sinfecha' : '/calendar');

export function attentionSummary(items: AttentionItem[], missing = 0): { title: string; detail: string } {
  if (!items.length && missing) {
    return { title: `${missing} ${missing === 1 ? 'documento sin fecha' : 'documentos sin fecha'}`, detail: 'No generan avisos hasta que cargues la fecha' };
  }
  if (!items.length) {
    return { title: 'Toda la documentación está al día', detail: 'Te avisamos cuando algo se acerque a su vencimiento' };
  }
  const count = (state: AttentionItem['doc']['state']) => items.filter(i => i.doc.state === state).length;
  const expired = count('expired');
  const expiring = count('expiring');
  const booked = count('appointment');
  const detail = [
    expired && `${expired} ${expired === 1 ? 'vencido' : 'vencidos'}`,
    expiring && `${expiring} por vencer`,
    booked && `${booked} con turno`,
    missing && `${missing} sin fecha`,
  ].filter(Boolean).join(' · ');
  const n = items.length;
  return { title: `${n} ${n === 1 ? 'documento necesita' : 'documentos necesitan'} atención`, detail };
}

// What the attention section says when it has nothing to list. Missing dates are already announced
// by the header, so here they only explain why there is nothing to show; never "Todo en orden" while dates are missing.
export function attentionEmpty(missing: number): { icon: string; title: string; text: string } {
  return missing
    ? { icon: 'event_available', title: 'Nada vencido ni por vencer', text: 'Cuando cargues las fechas, acá vas a ver lo que se acerca a su vencimiento.' }
    : { icon: 'check_circle', title: 'Todo en orden', text: 'No hay documentos vencidos, por vencer ni turnos.' };
}

export function nextExpiryLabel(days: number | null): string {
  if (days === null) return '—';
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  return `${days} días`;
}

// Greeting and date share one small line: "Buen día · martes 10 de noviembre"
export const greetingLine = (now: Date, today: string): string => `${greeting(now)} · ${longDate(today).toLowerCase()}`;

// The one button of the header; nothing to do means no button
export function statusAction(items: number, missing: number): { label: string; to: string } | null {
  if (!items && !missing) return null;
  return { label: !items ? 'Cargar fechas' : 'Ver la agenda', to: statusLink(items, missing) };
}

export type HomeKpi = { label: string; value: string; sub: string; to: string; words: boolean };

// An empty indicator says so in words instead of showing a zero or a dash
export function homeKpis(i: {
  operating: number; inFleet: number; inShop: string[]; monthName: string; monthTotal: number; monthCount: number;
  next: { days: number; type: string; model: string } | null;
}): HomeKpi[] {
  return [
    { label: 'Operativos', value: String(i.operating), sub: `de ${i.inFleet} en la flota`, to: '/fleet?filtro=activos', words: false },
    i.inShop.length
      ? { label: 'En taller', value: String(i.inShop.length), sub: i.inShop.join(', '), to: '/fleet?filtro=taller', words: false }
      : { label: 'En taller', value: 'Ninguno', sub: 'Toda la flota trabajando', to: '/fleet?filtro=taller', words: true },
    i.monthCount
      ? { label: `Gasto de ${i.monthName}`, value: money(i.monthTotal), sub: `${i.monthCount} ${i.monthCount === 1 ? 'trabajo' : 'trabajos'}`, to: '/maintenance', words: false }
      : { label: `Gasto de ${i.monthName}`, value: 'Sin gastos', sub: 'Ningún trabajo cargado', to: '/maintenance', words: true },
    i.next
      ? { label: 'Próximo vencimiento', value: nextExpiryLabel(i.next.days), sub: `${i.next.type} · ${i.next.model}`, to: '/calendar', words: false }
      : { label: 'Próximo vencimiento', value: 'Nada', sub: `en los próximos ${DISPLAY_WINDOW_DAYS} días`, to: '/calendar', words: true },
  ];
}
