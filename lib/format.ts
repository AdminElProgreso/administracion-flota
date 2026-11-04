// Display formats shared by the screens (Argentine Spanish)
export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const MONTHS_SHORT = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const numberFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const num = (n: number) => numberFormat.format(Math.round(n));
export const money = (n: number) => `$ ${num(n)}`;

// Empty data shows as a dash, never as null, undefined or NaN
export function orDash(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '—';
  return v.trim() ? v : '—';
}

// Mercosur plates as 'AA 236 JS', old ones as 'JRS 506'
export function plateText(p: string | null | undefined): string | null {
  const s = (p ?? '').toUpperCase().replace(/\s+/g, '');
  if (!s) return null;
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(s)) return `${s.slice(0, 2)} ${s.slice(2, 5)} ${s.slice(5)}`;
  if (/^[A-Z]{3}\d{3}$/.test(s)) return `${s.slice(0, 3)} ${s.slice(3)}`;
  return s;
}

export function greeting(d: Date): string {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'Buen día';
  if (h >= 12 && h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

// Same day n years later; a 29 February lands on the 28th
export function addYears(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const year = y + n;
  const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${year}-${pad(m)}-${pad(Math.min(d, lastDay))}`;
}

// '22/01' within the current year, '30/12/2025' for another one
export function shortDate(iso: string, today: string): string {
  const [y, m, d] = iso.split('-');
  return y === today.slice(0, 4) ? `${d}/${m}` : `${d}/${m}/${y}`;
}

// 'Miércoles 4 de noviembre'
export function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${cap(weekday)} ${d} de ${MONTHS[m - 1]}`;
}
