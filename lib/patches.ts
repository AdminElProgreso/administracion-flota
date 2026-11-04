import { DOC_COLUMNS, type DocType } from '../supabase/functions/_shared/alerts';

// Renewing a document clears its appointment
export function renewPatch(type: DocType, newExpiration: string): Record<string, string | null> {
  const columns = DOC_COLUMNS[type];
  return { [columns.expiration]: newExpiration, [columns.appointment]: null };
}

export function appointmentPatch(type: DocType, appointment: string | null): Record<string, string | null> {
  return { [DOC_COLUMNS[type].appointment]: appointment || null };
}
