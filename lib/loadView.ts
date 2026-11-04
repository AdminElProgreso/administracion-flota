export type LoadView = 'loading' | 'error' | 'ready';

// A screen is ready only when every query has data; a failed load shows an error, never an empty list
export function loadView(...queries: { data: unknown; error: unknown }[]): LoadView {
  if (queries.every(q => q.data !== undefined)) return 'ready';
  if (queries.some(q => q.data === undefined && q.error)) return 'error';
  return 'loading';
}
