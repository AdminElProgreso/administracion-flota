import { describe, it, expect } from 'vitest';
import { QueryClient, QueryObserver, onlineManager } from '@tanstack/react-query';
import { prefsLoadState } from '../lib/prefsLoadState';

describe('prefsLoadState', () => {
  it('sin datos ni error (cargando o en pausa) no cuenta como cargado', () => {
    expect(prefsLoadState({ data: undefined, error: null })).toBe('waiting');
  });
  it('con datos está listo; sin datos y con error, error', () => {
    expect(prefsLoadState({ data: { userId: 'u1' }, error: null })).toBe('ready');
    expect(prefsLoadState({ data: undefined, error: new Error('falló') })).toBe('error');
  });
  it('una consulta en pausa por falta de conexión no cuenta como cargada, aunque isLoading sea false', () => {
    onlineManager.setOnline(false);
    try {
      const client = new QueryClient();
      const observer = new QueryObserver(client, { queryKey: ['alertPrefs-test'], queryFn: async () => ({ userId: 'u1' }) });
      const unsubscribe = observer.subscribe(() => {});
      const result = observer.getCurrentResult();
      // react-query v5: paused offline → isLoading false, no data, no error (the old check took this as loaded)
      expect(result.isLoading).toBe(false);
      expect(prefsLoadState(result)).toBe('waiting');
      unsubscribe();
    } finally {
      onlineManager.setOnline(true);
    }
  });
});
