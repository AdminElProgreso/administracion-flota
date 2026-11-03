export type PrefsLoadState = 'ready' | 'error' | 'waiting';

// react-query v5 reports isLoading=false while a query is paused offline, with no data and no error,
// so only data that actually arrived counts as loaded. Settings must not save before 'ready'.
export function prefsLoadState(query: { data: unknown; error: unknown }): PrefsLoadState {
  if (query.data !== undefined) return 'ready';
  return query.error ? 'error' : 'waiting';
}
