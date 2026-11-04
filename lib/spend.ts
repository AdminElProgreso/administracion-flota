import { MONTHS_SHORT } from './format';

export interface MonthSpend {
  key: string;
  label: string;
  total: number;
  count: number;
}

// Spending per month, oldest first and the current month last
export function monthlySpend(works: { date: string; cost: number | null }[], today: string, months = 6): MonthSpend[] {
  const [y, m] = today.split('-').map(Number);
  const result: MonthSpend[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const inMonth = works.filter(w => w.date.startsWith(key));
    result.push({ key, label: MONTHS_SHORT[d.getUTCMonth()], total: inMonth.reduce((a, w) => a + (w.cost ?? 0), 0), count: inMonth.length });
  }
  return result;
}

export const averageSpend = (m: MonthSpend[]): number => (m.length ? m.reduce((a, x) => a + x.total, 0) / m.length : 0);

// Height of a month's bar as a percentage of the most expensive month; never below 4 so an empty month still shows
export const barPercent = (total: number, max: number): number => Math.max(4, Math.round((total / Math.max(max, 1)) * 100));
