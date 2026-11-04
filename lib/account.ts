import type { PushSupport } from './push';

// Rules and texts of the Ajustes screen (pages/Settings.tsx)

export function passwordProblem(password: string, confirm: string): string | null {
  if (password.length < 6) return 'La contraseña tiene que tener al menos 6 caracteres';
  if (password !== confirm) return 'Las contraseñas no coinciden';
  return null;
}

// Supabase answers in English; the person sees Spanish (the detail stays in the console)
export function passwordUpdateMessage(error: { code?: string }): string {
  if (error.code === 'same_password') return 'La contraseña nueva tiene que ser distinta de la actual';
  if (error.code === 'weak_password') return 'Elegí una contraseña más segura';
  return 'No se pudo cambiar la contraseña. Probá de nuevo.';
}

// 'sistemas@…' → 'SI', 'nico.mendez@…' → 'NM'
export function initials(email: string | null | undefined): string {
  const local = (email ?? '').split('@')[0];
  const parts = local.split(/[._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : local.slice(0, 2);
  return letters.toUpperCase();
}

const PUSH_NOTES: Record<Exclude<PushSupport, 'ok'>, string> = {
  'ios-install': 'Instalá la app para recibir avisos en el iPhone.',
  blocked: 'Las notificaciones están bloqueadas en este navegador.',
  unsupported: 'Este navegador no permite notificaciones.',
};

export const pushSupportNote = (support: PushSupport): string | null => (support === 'ok' ? null : PUSH_NOTES[support]);
