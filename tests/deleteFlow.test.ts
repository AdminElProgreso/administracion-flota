import { describe, it, expect, vi } from 'vitest';
import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { deleteAndLeave } from '../lib/deleteFlow';

const deferredDelete = () => {
  // The request ends only when the test says so (react-query calls mutationFn a tick after mutate())
  let finish!: () => void;
  const request = new Promise<void>(resolve => { finish = resolve; });
  const observer = new MutationObserver<void, Error, string>(new QueryClient(), { mutationFn: () => request });
  const unsubscribe = observer.subscribe(() => undefined);
  return { observer, unsubscribe, finish: () => finish() };
};
const ui = () => ({ setLeaving: vi.fn(), toast: vi.fn(), leave: vi.fn() });

describe('eliminar una unidad', () => {
  it('react-query deja de avisar a una ficha que ya no está (por eso no alcanza con onSuccess)', async () => {
    const d = deferredDelete();
    const onSuccess = vi.fn();
    const done = d.observer.mutate('v1', { onSuccess });
    d.unsubscribe();
    d.finish();
    await done;
    expect(onSuccess).not.toHaveBeenCalled();
  });
  it('confirma y vuelve a la lista aunque la ficha se haya ido antes de terminar', async () => {
    const d = deferredDelete();
    const u = ui();
    const flow = deleteAndLeave(() => d.observer.mutate('v1'), u);
    d.unsubscribe(); // the ficha unmounts while the deletion is still running
    d.finish();
    await flow;
    expect(u.setLeaving).toHaveBeenCalledWith(true);
    expect(u.toast).toHaveBeenCalledWith('Unidad eliminada');
    expect(u.leave).toHaveBeenCalledTimes(1);
  });
  it('si falla, se queda en la ficha y lo dice', async () => {
    const u = ui();
    await deleteAndLeave(() => Promise.reject(new Error('No se pudo eliminar la unidad.')), u);
    expect(u.setLeaving).toHaveBeenLastCalledWith(false);
    expect(u.toast).toHaveBeenCalledWith('No se pudo eliminar la unidad.', 'error');
    expect(u.leave).not.toHaveBeenCalled();
  });
});
