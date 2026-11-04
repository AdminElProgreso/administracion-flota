import { supabase } from '../supabase';
import { unsubscribeDevice } from './push';

export async function logout(): Promise<void> {
  // This device stops receiving alerts, so they don't reach the next person who signs in here
  await unsubscribeDevice().catch(error => console.error('Push unsubscribe on logout failed', error));
  await supabase.auth.signOut();
}
