import { describe, it, expect } from 'vitest';
import { initials, passwordProblem, passwordUpdateMessage, pushSupportNote } from '../lib/account';

describe('ajustes de la cuenta', () => {
  it('contraseña: mínimo 6 caracteres y que coincidan', () => {
    expect(passwordProblem('12345', '12345')).toBe('La contraseña tiene que tener al menos 6 caracteres');
    expect(passwordProblem('123456', '123457')).toBe('Las contraseñas no coinciden');
    expect(passwordProblem('123456', '123456')).toBeNull();
  });
  it('errores de Supabase en castellano', () => {
    expect(passwordUpdateMessage({ code: 'same_password' })).toBe('La contraseña nueva tiene que ser distinta de la actual');
    expect(passwordUpdateMessage({ code: 'weak_password' })).toBe('Elegí una contraseña más segura');
    expect(passwordUpdateMessage({ code: 'otro' })).toBe('No se pudo cambiar la contraseña. Probá de nuevo.');
    expect(passwordUpdateMessage({})).toBe('No se pudo cambiar la contraseña. Probá de nuevo.');
  });
  it('iniciales del email', () => {
    expect(initials('sistemas@elprogresocoop.com.ar')).toBe('SI');
    expect(initials('nico.mendez@x.com')).toBe('NM');
    expect(initials(null)).toBe('');
  });
  it('qué permite este celular', () => {
    expect(pushSupportNote('ios-install')).toBe('Instalá la app para recibir avisos en el iPhone.');
    expect(pushSupportNote('blocked')).toBe('Las notificaciones están bloqueadas en este navegador.');
    expect(pushSupportNote('unsupported')).toBe('Este navegador no permite notificaciones.');
    expect(pushSupportNote('ok')).toBeNull();
  });
});
