import { describe, it, expect } from 'vitest';
import { AR_TIME_ZONE, todayISO, daysBetween, formatDateShort, formatDateLong } from '../supabase/functions/_shared/dates';

describe('daysBetween', () => {
  it('cuenta días de calendario', () => {
    expect(daysBetween('2026-11-03', '2026-11-03')).toBe(0);
    expect(daysBetween('2026-11-03', '2026-11-13')).toBe(10);
    expect(daysBetween('2026-11-03', '2026-11-02')).toBe(-1);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
  });
});

describe('todayISO', () => {
  it('usa la fecha de Argentina aunque en UTC ya sea el día siguiente', () => {
    expect(todayISO(new Date('2026-11-04T00:30:00Z'), AR_TIME_ZONE)).toBe('2026-11-03'); // 21:30 en AR
    expect(todayISO(new Date('2026-11-04T02:59:00Z'), AR_TIME_ZONE)).toBe('2026-11-03'); // 23:59 en AR
    expect(todayISO(new Date('2026-11-04T03:00:00Z'), AR_TIME_ZONE)).toBe('2026-11-04'); // 00:00 en AR
  });
  it('sin zona usa la fecha local', () => {
    expect(todayISO(new Date(2026, 10, 3, 23, 59))).toBe('2026-11-03');
  });
});

describe('formatos', () => {
  it('dd/mm y dd/mm/aaaa', () => {
    expect(formatDateShort('2026-11-20')).toBe('20/11');
    expect(formatDateLong('2026-11-20')).toBe('20/11/2026');
  });
});
