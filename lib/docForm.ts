import type { DocType } from '../supabase/functions/_shared/alerts';
import { formatDateLong } from '../supabase/functions/_shared/dates';
import { addYears } from './format';

// Rules of the sheet that renews a document or books its appointment (components/sheets/DocSheet.tsx)

// One year from the current expiration, or from today when it already passed
export function renewProposal(expiration: string | null, today: string): string {
  return addYears(expiration && expiration > today ? expiration : today, 1);
}

// What the document said before renewing, so the date typed next to it can be checked at a glance
export function currentExpiryNote(expiration: string | null, today: string): string | null {
  if (!expiration) return null;
  return `${expiration >= today ? 'Vence' : 'Venció'} el ${formatDateLong(expiration)}`;
}

// The booked appointment while it is still ahead, otherwise today
export function appointmentProposal(appointment: string | null, today: string): string {
  return appointment && appointment >= today ? appointment : today;
}

// "del seguro", "de la VTV": for titles like "Vencimiento de la VTV"
export const DOC_OF: Record<DocType, string> = { Seguro: 'del seguro', VTV: 'de la VTV', Patente: 'de la patente' };

// A document without a previous date gets its first expiration, not a renewal
export function renewedMessage(type: DocType, date: string, hadDate = true): string {
  if (!hadDate) return `Vencimiento ${DOC_OF[type]} cargado: ${formatDateLong(date)}`;
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
