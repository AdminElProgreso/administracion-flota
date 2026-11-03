import { describe, it, expect } from 'vitest';
import { requestAction } from '../supabase/functions/_shared/http';

describe('requestAction', () => {
  it('la consulta previa del navegador (OPTIONS) no ejecuta el envío', () => {
    expect(requestAction('OPTIONS')).toBe('preflight');
  });
  it('solo POST ejecuta el envío (es lo que manda la tarea diaria)', () => {
    expect(requestAction('POST')).toBe('run');
  });
  it('cualquier otro método se rechaza', () => {
    expect(requestAction('GET')).toBe('reject');
    expect(requestAction('HEAD')).toBe('reject');
    expect(requestAction('DELETE')).toBe('reject');
  });
});
