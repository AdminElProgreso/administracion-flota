import { describe, it, expect, vi, afterEach } from 'vitest';
import { createAutosave } from '../lib/autosave';

describe('autoguardado de Ajustes', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('guarda una sola vez, un segundo después del último cambio', () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const autosave = createAutosave(save, 1000);
    autosave.schedule(1);
    vi.advanceTimersByTime(600);
    autosave.schedule(2);
    vi.advanceTimersByTime(999);
    expect(save).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(2);
  });
  it('al salir de la pantalla guarda en el momento lo que quedaba pendiente', () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const autosave = createAutosave(save, 1000);
    autosave.schedule(3);
    autosave.flush();
    expect(save).toHaveBeenCalledWith(3);
    vi.advanceTimersByTime(2000);
    expect(save).toHaveBeenCalledTimes(1);
  });
  it('sin cambios pendientes, salir no guarda nada', () => {
    const save = vi.fn();
    createAutosave(save, 1000).flush();
    expect(save).not.toHaveBeenCalled();
  });
  it('volver al valor guardado cancela lo pendiente', () => {
    vi.useFakeTimers();
    const save = vi.fn();
    const autosave = createAutosave(save, 1000);
    autosave.schedule(4);
    autosave.cancel();
    vi.advanceTimersByTime(2000);
    autosave.flush();
    expect(save).not.toHaveBeenCalled();
  });
});
