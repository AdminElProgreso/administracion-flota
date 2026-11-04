// Saves the latest value a moment after the last change. flush() saves what is pending right away
// (leaving the screen or closing the app), cancel() drops it (the value went back to what is stored).
export function createAutosave<T>(save: (value: T) => void, delay = 1000) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: { value: T } | null = null;

  const flush = () => {
    clearTimeout(timer);
    timer = undefined;
    if (!pending) return;
    const { value } = pending;
    pending = null;
    save(value);
  };

  return {
    schedule(value: T) {
      pending = { value };
      clearTimeout(timer);
      timer = setTimeout(flush, delay);
    },
    flush,
    cancel() {
      clearTimeout(timer);
      timer = undefined;
      pending = null;
    },
  };
}
