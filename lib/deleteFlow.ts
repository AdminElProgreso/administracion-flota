// Deleting a unit removes it from the list refetch before the request finishes, so its ficha unmounts and
// react-query drops the callbacks given to mutate(). Awaiting the request keeps the confirmation and the exit.
export async function deleteAndLeave(
  run: () => Promise<unknown>,
  ui: { setLeaving: (on: boolean) => void; toast: (message: string, kind?: 'ok' | 'error') => void; leave: () => void },
): Promise<void> {
  ui.setLeaving(true);
  try {
    await run();
    ui.toast('Unidad eliminada');
    ui.leave();
  } catch (e) {
    ui.setLeaving(false);
    ui.toast(e instanceof Error ? e.message : 'No se pudo eliminar la unidad.', 'error');
  }
}
