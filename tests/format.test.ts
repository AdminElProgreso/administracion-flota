import { describe, it, expect } from 'vitest';
import { plateText, orDash, money, num, greeting, longDate, addYears, shortDate } from '../lib/format';

describe('format', () => {
  it('patente Mercosur, vieja o vacía', () => {
    expect(plateText('AA236JS')).toBe('AA 236 JS');
    expect(plateText(' ab 123 cd ')).toBe('AB 123 CD');
    expect(plateText('JRS506')).toBe('JRS 506');
    expect(plateText('JRS 506')).toBe('JRS 506');
    expect(plateText('X1')).toBe('X1');
    expect(plateText('')).toBeNull();
    expect(plateText(null)).toBeNull();
  });
  it('dato vacío como guion', () => {
    expect(orDash(null)).toBe('—');
    expect(orDash(undefined)).toBe('—');
    expect(orDash('  ')).toBe('—');
    expect(orDash(Number.NaN)).toBe('—');
    expect(orDash(2019)).toBe('2019');
    expect(orDash('RAFA')).toBe('RAFA');
  });
  it('plata y números en formato argentino', () => {
    expect(money(483500)).toBe('$ 483.500');
    expect(money(98500.4)).toBe('$ 98.500');
    expect(money(0)).toBe('$ 0');
    expect(num(210400)).toBe('210.400');
  });
  it('saludo según la hora', () => {
    expect(greeting(new Date(2026, 10, 4, 4, 59))).toBe('Buenas noches');
    expect(greeting(new Date(2026, 10, 4, 5, 0))).toBe('Buen día');
    expect(greeting(new Date(2026, 10, 4, 12, 0))).toBe('Buenas tardes');
    expect(greeting(new Date(2026, 10, 4, 20, 0))).toBe('Buenas noches');
  });
  it('sumar años, sin pasarse de mes en un 29 de febrero', () => {
    expect(addYears('2026-11-04', 1)).toBe('2027-11-04');
    expect(addYears('2028-02-29', 1)).toBe('2029-02-28');
  });
  it('fecha corta, con el año cuando no es el actual', () => {
    expect(shortDate('2026-01-22', '2026-11-04')).toBe('22/01');
    expect(shortDate('2025-12-30', '2026-11-04')).toBe('30/12/2025');
  });
  it('fecha larga', () => {
    expect(longDate('2026-11-04')).toBe('Miércoles 4 de noviembre');
    expect(longDate('2026-11-01')).toBe('Domingo 1 de noviembre');
  });
});
