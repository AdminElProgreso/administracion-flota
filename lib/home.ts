import { DEFAULT_PREFS, vehicleDocs, type AttentionItem } from '../supabase/functions/_shared/alerts';
import type { VehicleRow } from '../types';

// Texts of the Inicio screen (pages/Dashboard.tsx)

// Documents with no expiration date send no notices; the office has to see how many are still to load.
// The state does not depend on the threshold. Generators carry no documents and units de baja get no notices.
export function missingDates(vehicles: VehicleRow[], today: string): number {
  return vehicles
    .filter(v => v.tipo !== 'generator' && v.status !== 'Baja')
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

export function nextExpiryLabel(days: number | null): string {
  if (days === null) return '—';
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  return `${days} días`;
}
