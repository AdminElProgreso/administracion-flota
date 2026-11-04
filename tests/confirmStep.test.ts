import { describe, it, expect } from 'vitest';
import { isDeliberate } from '../lib/useConfirmStep';

describe('confirmación en dos pasos', () => {
  it('un segundo toque inmediato es un doble toque, no una confirmación', () => {
    expect(isDeliberate(1_000, 1_250)).toBe(false);
    expect(isDeliberate(1_000, 1_599)).toBe(false);
    expect(isDeliberate(1_000, 1_600)).toBe(true);
    expect(isDeliberate(1_000, 4_000)).toBe(true);
  });
});
