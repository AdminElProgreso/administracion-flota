import type { AttentionItem } from '../supabase/functions/_shared/alerts';

// Texts of the Inicio screen (pages/Dashboard.tsx)

export function attentionSummary(items: AttentionItem[]): { title: string; detail: string } {
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
