import type { DocType } from '../supabase/functions/_shared/alerts';
import { formatDateLong } from '../supabase/functions/_shared/dates';
import { addYears } from './format';

// Rules of the sheet that renews a document or books its appointment (components/sheets/DocSheet.tsx)

// One year from the current expiration, or from today when it already passed
export function renewProposal(expiration: string | null, today: string): string {
  return addYears(expiration && expiration > today ? expiration : today, 1);
}

// The booked appointment while it is still ahead, otherwise today
export function appointmentProposal(appointment: string | null, today: string): string {
  return appointment && appointment >= today ? appointment : today;
}

export function renewedMessage(type: DocType, date: string): string {
  return `${type} ${type === 'Seguro' ? 'renovado' : 'renovada'} hasta el ${formatDateLong(date)}`;
}

export function dateError(kind: 'renew' | 'appointment', date: string, today: string): string | null {
  if (!date) return 'Elegí una fecha';
  // A past appointment would not count: the document would go back to its expiration notices
  if (kind === 'appointment' && date < today) return 'El turno tiene que ser de hoy en adelante';
  return null;
}

export function appointmentNote(days: number, enabled: boolean): string {
  const base = 'Mientras el turno esté cargado no llegan avisos de vencimiento';
  return enabled ? `${base}: te recordamos el turno ${days} ${days === 1 ? 'día' : 'días'} antes.` : `${base}.`;
}
