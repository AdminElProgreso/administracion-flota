import type { DocState, DocStatus, DocType } from '../supabase/functions/_shared/alerts';
import { formatDateShort } from '../supabase/functions/_shared/dates';

// CSS class of each document state (styles/components.css)
export const STATE_CLASS: Record<DocState, string> = {
  appointment: 'st-appt',
  expired: 'st-bad',
  expiring: 'st-warn',
  ok: 'st-ok',
  'no-date': 'st-none',
};

export const DOC_ICONS: Record<DocType, string> = { Seguro: 'shield', VTV: 'fact_check', Patente: 'receipt_long' };

const FEMININE: Record<DocType, boolean> = { Seguro: false, VTV: true, Patente: true };

export function docLabel(doc: DocStatus): string {
  const appt = doc.daysToAppointment ?? 0;
  const exp = doc.daysToExpiration ?? 0;
  switch (doc.state) {
    case 'appointment':
      return appt === 0 ? 'Turno hoy' : appt === 1 ? 'Turno mañana' : `Turno el ${formatDateShort(doc.appointment ?? '')}`;
    case 'expired':
      return exp === -1 ? 'Venció ayer' : `Venció hace ${-exp} días`;
    case 'expiring':
      return exp === 0 ? 'Vence hoy' : exp === 1 ? 'Vence mañana' : `Vence en ${exp} días`;
    case 'ok':
      return 'Al día';
    default:
      return 'Sin fecha';
  }
}

export function docTitle(doc: DocStatus): string {
  if (doc.state === 'expired') return `${doc.type} ${FEMININE[doc.type] ? 'vencida' : 'vencido'}`;
  if (doc.state === 'expiring') return `${doc.type} por vencer`;
  if (doc.state === 'appointment') return `Turno de ${doc.type}`;
  return doc.type;
}

/* ---------- Legacy: used by the screens not yet redesigned; removed in Task 14 of the redesign plan ---------- */
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
export const DOC_HEADLINES: Record<DocState, string> = {
  appointment: 'Turno programado', expired: 'Vencido', expiring: 'Por vencer', ok: 'Al día', 'no-date': 'Sin fecha',
};
export type CalendarTone = 'red' | 'amber' | 'neutral';
export const CALENDAR_TONE_CLASSES: Record<CalendarTone, string> = {
  red: 'bg-red-500/20 text-red-400 border-red-500/20',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
  neutral: 'bg-brand-dark/50 text-stone-400 border-brand-border',
};
export function calendarExpirationLabel(daysToExpiration: number, threshold: number): { text: string; tone: CalendarTone } {
  if (daysToExpiration < 0) return { text: 'Vencido', tone: 'red' };
  if (daysToExpiration === 0) return { text: 'Vence hoy', tone: 'amber' };
  if (daysToExpiration <= threshold) return { text: daysToExpiration === 1 ? 'Falta 1 día' : `Faltan ${daysToExpiration} días`, tone: 'amber' };
  return { text: 'Próximo', tone: 'neutral' };
}
export function calendarAppointmentLabel(daysToAppointment: number): string {
  return daysToAppointment >= 0 ? 'Programado' : 'Turno pasado';
}
