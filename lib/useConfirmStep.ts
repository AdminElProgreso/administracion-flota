import { useCallback, useRef, useState } from 'react';

const DOUBLE_TAP_MS = 600;

// A second tap this soon after the first is a double tap, not a confirmation
export const isDeliberate = (armedAt: number, now: number) => now - armedAt >= DOUBLE_TAP_MS;

// Two-step confirmations (borrar un trabajo, dar de baja): arm() shows the confirm button,
// confirmed() is true only for a tap that came after a real pause
export function useConfirmStep() {
  const [armed, setArmed] = useState(false);
  const armedAt = useRef(0);
  const arm = useCallback(() => { armedAt.current = Date.now(); setArmed(true); }, []);
  const disarm = useCallback(() => setArmed(false), []);
  const confirmed = useCallback(() => isDeliberate(armedAt.current, Date.now()), []);
  return { armed, arm, disarm, confirmed };
}
