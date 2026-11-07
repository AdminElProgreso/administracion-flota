import type { AlertPrefs, DocState } from '../supabase/functions/_shared/alerts';

// What the app shows uses one window for everyone; each person's days only decide when their push arrives
export const DISPLAY_WINDOW_DAYS = 30;

export const displayPrefs = (prefs: AlertPrefs): AlertPrefs => ({
  ...prefs,
  thresholds: { ...prefs.thresholds, Seguro: DISPLAY_WINDOW_DAYS, VTV: DISPLAY_WINDOW_DAYS, Patente: DISPLAY_WINDOW_DAYS },
});

// Lower is more urgent
export const URGENCY: Record<DocState, number> = { expired: 0, expiring: 1, appointment: 2, 'no-date': 3, ok: 4 };
