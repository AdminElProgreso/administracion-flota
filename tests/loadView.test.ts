import { describe, it, expect } from 'vitest';
import { loadView } from '../lib/loadView';

describe('loadView', () => {
  it('distingue cargando, error y listo', () => {
    expect(loadView({ data: [], error: null })).toBe('ready');
    expect(loadView({ data: undefined, error: null })).toBe('loading');
    expect(loadView({ data: undefined, error: new Error('red') })).toBe('error');
    expect(loadView({ data: [1], error: new Error('refetch') })).toBe('ready');
    expect(loadView({ data: [], error: null }, { data: undefined, error: null })).toBe('loading');
    expect(loadView({ data: [], error: null }, { data: undefined, error: new Error('x') })).toBe('error');
  });
});
