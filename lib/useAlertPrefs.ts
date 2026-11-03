import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { DEFAULT_PREFS, prefsFromRow, rowFromPrefs, type AlertPrefs } from '../supabase/functions/_shared/alerts';
import { prefsLoadState, type PrefsLoadState } from './prefsLoadState';

export const ALERT_PREFS_KEY = ['alertPrefs'] as const;

// Alert thresholds and switches of the logged-in user; user_settings is the source of truth
export function useAlertPrefs(): { prefs: AlertPrefs; userId: string | null; isLoading: boolean; error: Error | null; loadState: PrefsLoadState } {
  const { data, isLoading, error } = useQuery({
    queryKey: ALERT_PREFS_KEY,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? null;
      if (!userId) return { userId, prefs: DEFAULT_PREFS };

      // Newest row first, in case the table holds more than one per user
      const { data: row, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return { userId, prefs: prefsFromRow(row) };
    },
    staleTime: 5 * 60 * 1000,
  });

  return { prefs: data?.prefs ?? DEFAULT_PREFS, userId: data?.userId ?? null, isLoading, error, loadState: prefsLoadState({ data, error }) };
}

export async function saveAlertPrefs(userId: string, prefs: AlertPrefs): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert({ ...rowFromPrefs(userId, prefs), updated_at: new Date().toISOString() });
  if (error) throw error;
}
