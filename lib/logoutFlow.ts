// Signing out, without Supabase or the browser (lib/session.ts wires them), so the order can be tested
export interface LogoutDeps {
  online: () => boolean;
  unsubscribe: () => Promise<void>;
  signOut: (scope: 'local') => Promise<{ error: unknown }>;
}

// Returns what to tell the person when it couldn't sign out, or null when it did
export async function logoutFlow(d: LogoutDeps): Promise<string | null> {
  // Offline Supabase keeps the session: stop before unsubscribing this phone from the alerts
  if (!d.online()) return 'Sin conexión no se puede cerrar la sesión. Probá cuando vuelva.';
  // This device stops receiving alerts, so they don't reach the next person who signs in here
  await d.unsubscribe().catch(error => console.error('Push unsubscribe on logout failed', error));
  // Only this device: with a shared account, the other phone stays signed in
  const { error } = await d.signOut('local');
  if (error) {
    console.error('Sign out failed', error);
    return 'No se pudo cerrar la sesión. Probá de nuevo.';
  }
  return null;
}
