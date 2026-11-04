import { describe, it, expect } from 'vitest';
import { monthlySpend, averageSpend, barPercent } from '../lib/spend';

describe('monthlySpend', () => {
  const works = [
    { date: '2026-11-02', cost: 385000 }, { date: '2026-11-01', cost: 98500 }, { date: '2026-11-01', cost: null },
    { date: '2026-10-30', cost: 45000 }, { date: '2026-06-12', cost: 190000 }, { date: '2026-05-30', cost: 999 },
  ];
  it('últimos 6 meses, del más viejo al actual', () => {
    const m = monthlySpend(works, '2026-11-03');
    expect(m.map(x => x.key)).toEqual(['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']);
    expect(m.map(x => x.label)).toEqual(['JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV']);
    expect(m.map(x => x.total)).toEqual([190000, 0, 0, 0, 45000, 483500]);
    expect(m.map(x => x.count)).toEqual([1, 0, 0, 0, 1, 3]);
    expect(averageSpend(m)).toBe(119750);
  });
  it('cruza el año', () => {
    expect(monthlySpend([], '2026-02-10', 3).map(x => x.key)).toEqual(['2025-12', '2026-01', '2026-02']);
  });
});

describe('barras del gasto', () => {
  it('alto proporcional al mes más caro, con un mínimo visible', () => {
    expect(barPercent(50, 100)).toBe(50);
    expect(barPercent(100, 100)).toBe(100);
    expect(barPercent(1, 1000)).toBe(4);
    expect(barPercent(0, 0)).toBe(4);
  });
});
