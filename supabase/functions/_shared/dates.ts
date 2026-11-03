// Date helpers shared by the app (Vite) and the check-alerts Edge Function (Deno).
// Dates travel as 'YYYY-MM-DD' text; day differences use calendar arithmetic, without hours.

export const AR_TIME_ZONE = 'America/Argentina/Buenos_Aires';

const MS_PER_DAY = 86_400_000;

const pad = (n: number) => String(n).padStart(2, '0');

const parseISO = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month, day };
};

export function todayISO(now: Date = new Date(), timeZone?: string): string {
  if (timeZone) {
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  }
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function daysBetween(fromISO: string, toISO: string): number {
  const from = parseISO(fromISO);
  const to = parseISO(toISO);
  return (Date.UTC(to.year, to.month - 1, to.day) - Date.UTC(from.year, from.month - 1, from.day)) / MS_PER_DAY;
}

export function formatDateShort(iso: string): string {
  const { month, day } = parseISO(iso);
  return `${pad(day)}/${pad(month)}`;
}

export function formatDateLong(iso: string): string {
  const { year, month, day } = parseISO(iso);
  return `${pad(day)}/${pad(month)}/${year}`;
}
