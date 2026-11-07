import { DOC_TYPES, type DocStatus, type DocType } from '../supabase/functions/_shared/alerts';
import { URGENCY } from './display';

// The document a notification or a row points at: ?doc=VTV. Anything else is ignored
export function docFromSearch(search: string): DocType | null {
  const value = new URLSearchParams(search).get('doc');
  return DOC_TYPES.find(t => t === value) ?? null;
}

// Most urgent first; Array.sort is stable, so ties keep the usual Seguro, VTV, Patente order
export const orderDocs = (docs: DocStatus[]): DocStatus[] => [...docs].sort((a, b) => URGENCY[a.state] - URGENCY[b.state]);

export const hasUrgentDoc = (docs: DocStatus[]): boolean => docs.some(d => d.state === 'expired' || d.state === 'expiring');
