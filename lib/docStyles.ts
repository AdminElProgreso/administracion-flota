import type { DocState, DocStatus, DocType } from '../supabase/functions/_shared/alerts';
import { formatDateLong, formatDateShort } from '../supabase/functions/_shared/dates';

// Same colors on every screen: turno azul, vencido rojo, por vencer amarillo, al día verde, sin fecha gris
export const DOC_CHIP_CLASSES: Record<DocState, string> = {
  appointment: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  expired: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  expiring: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  ok: 'bg-emerald-500/10 text-emerald-500/40 border-emerald-500/10',
  'no-date': 'bg-stone-800/30 text-stone-700 border-stone-800/50',
};

export const DOC_CARD_CLASSES: Record<DocState, { text: string; border: string; bg: string }> = {
  appointment: { text: 'text-blue-400', border: 'border-blue-400/50', bg: 'bg-blue-400/10' },
  expired: { text: 'text-rose-500', border: 'border-rose-500/50', bg: 'bg-rose-500/10' },
  expiring: { text: 'text-amber-500', border: 'border-amber-500/50', bg: 'bg-amber-500/10' },
  ok: { text: 'text-emerald-500', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
  'no-date': { text: 'text-stone-500', border: 'border-brand-border', bg: 'bg-stone-800/30' },
};

export const DOC_ICONS: Record<DocType, string> = { Seguro: 'security', VTV: 'verified', Patente: 'badge' };

export const DOC_HEADLINES: Record<DocState, string> = {
  appointment: 'Turno programado',
  expired: 'Vencido',
  expiring: 'Por vencer',
  ok: 'Al día',
  'no-date': 'Sin fecha',
};

const daysLeft = (days: number) => (days === 1 ? 'Falta 1 día' : `Faltan ${days} días`);

export function docLabel(doc: DocStatus, dateFormat: 'short' | 'long' = 'long'): string {
  switch (doc.state) {
    case 'appointment': {
      const date = doc.appointment ?? '';
      return dateFormat === 'short' ? `Turno ${formatDateShort(date)}` : `Turno: ${formatDateLong(date)}`;
    }
    case 'expired': {
      const days = -(doc.daysToExpiration ?? 0);
      return days === 1 ? 'Venció ayer' : `Venció hace ${days} días`;
    }
    case 'expiring':
      return doc.daysToExpiration === 0 ? 'Vence hoy' : daysLeft(doc.daysToExpiration ?? 0);
    case 'ok':
      return 'Al día';
    default:
      return 'Sin fecha';
  }
}

export type CalendarTone = 'red' | 'amber' | 'neutral';

export const CALENDAR_TONE_CLASSES: Record<CalendarTone, string> = {
  red: 'bg-red-500/20 text-red-400 border-red-500/20',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
  neutral: 'bg-brand-dark/50 text-stone-400 border-brand-border',
};

export function calendarExpirationLabel(daysToExpiration: number, threshold: number): { text: string; tone: CalendarTone } {
  if (daysToExpiration < 0) return { text: 'Vencido', tone: 'red' };
  if (daysToExpiration === 0) return { text: 'Vence hoy', tone: 'amber' };
  if (daysToExpiration <= threshold) return { text: daysLeft(daysToExpiration), tone: 'amber' };
  return { text: 'Próximo', tone: 'neutral' };
}

export function calendarAppointmentLabel(daysToAppointment: number): string {
  return daysToAppointment >= 0 ? 'Programado' : 'Turno pasado';
}
