import { describe, it, expect, vi } from 'vitest';
import { logoutFlow, type LogoutDeps } from '../lib/logoutFlow';

const deps = (over: Partial<LogoutDeps> = {}): LogoutDeps => ({
  online: () => true,
  unsubscribe: vi.fn(async () => undefined),
  signOut: vi.fn(async () => ({ error: null })),
  ...over,
});

describe('cerrar sesión', () => {
  it('sin conexión no toca nada y lo dice', async () => {
    const d = deps({ online: () => false });
    expect(await logoutFlow(d)).toBe('Sin conexión no se puede cerrar la sesión. Probá cuando vuelva.');
    expect(d.unsubscribe).not.toHaveBeenCalled();
    expect(d.signOut).not.toHaveBeenCalled();
  });
  it('desuscribe el celular y cierra solo la sesión de este equipo', async () => {
    const steps: string[] = [];
    const d = deps({
      unsubscribe: vi.fn(async () => { steps.push('desuscribir'); }),
      signOut: vi.fn(async (scope: 'local') => { steps.push(`cerrar:${scope}`); return { error: null }; }),
    });
    expect(await logoutFlow(d)).toBeNull();
    expect(steps).toEqual(['desuscribir', 'cerrar:local']);
  });
  it('si falla la desuscripción, igual cierra la sesión', async () => {
    const d = deps({ unsubscribe: vi.fn(async () => { throw new Error('sin permiso'); }) });
    expect(await logoutFlow(d)).toBeNull();
    expect(d.signOut).toHaveBeenCalledWith('local');
  });
  it('si Supabase no cierra la sesión, lo dice', async () => {
    const d = deps({ signOut: vi.fn(async () => ({ error: new Error('network') })) });
    expect(await logoutFlow(d)).toBe('No se pudo cerrar la sesión. Probá de nuevo.');
  });
});
