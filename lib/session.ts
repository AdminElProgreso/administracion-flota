import { supabase } from '../supabase';
import { logoutFlow } from './logoutFlow';
import { unsubscribeDevice } from './push';

// Returns the message to show when it couldn't sign out (see lib/logoutFlow.ts)
export const logout = () => logoutFlow({
  online: () => navigator.onLine,
  unsubscribe: unsubscribeDevice,
  signOut: scope => supabase.auth.signOut({ scope }),
});
