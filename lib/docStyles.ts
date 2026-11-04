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
