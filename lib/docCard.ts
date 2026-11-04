import type { AlertPrefs, DocStatus } from '../supabase/functions/_shared/alerts';
import { formatDateLong } from '../supabase/functions/_shared/dates';
import { cap } from './format';

// Texts of a document card in the ficha: "Vence el **23/01/2027**" plus a hint about its notices
export interface DocCardText {
  lead: string;
  strong: string | null;
  hint: string;
}

const days = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`;

export function docCardText(doc: DocStatus, prefs: AlertPrefs): DocCardText {
  const expiry = doc.expiration && `${(doc.daysToExpiration ?? 0) < 0 ? 'Venció' : 'Vence'} el`;

  if (doc.state === 'appointment' && doc.appointment) {
    const n = doc.daysToAppointment ?? 0;
    const reminder = prefs.enabled.appointments
      ? `te recordamos el turno ${days(prefs.thresholds.appointments)} antes`
      : 'los recordatorios de turnos están apagados en Ajustes';
    const hint = doc.expiration ? `${expiry} ${formatDateLong(doc.expiration)} · ${reminder}` : cap(reminder);
    if (n === 0) return { lead: 'Turno', strong: 'hoy', hint };
    if (n === 1) return { lead: 'Turno', strong: 'mañana', hint };
    return { lead: 'Turno el', strong: formatDateLong(doc.appointment), hint };
  }

  if (!doc.expiration || !expiry) {
    return { lead: 'Sin fecha cargada', strong: null, hint: 'Cargá la fecha de vencimiento para recibir avisos.' };
  }

  let hint: string;
  if (!prefs.enabled[doc.type]) hint = `Los avisos de ${doc.type} están apagados en Ajustes`;
  else if (doc.pastAppointment && doc.appointment) {
    hint = `El turno del ${formatDateLong(doc.appointment)} ya pasó: registrá la renovación o cargá otro turno`;
  } else if (doc.state === 'ok') hint = `Te empezamos a avisar ${days(prefs.thresholds[doc.type])} antes`;
  else if (doc.state === 'expiring') hint = `Te avisamos todos los días hasta que ${doc.type === 'Seguro' ? 'lo' : 'la'} renueves`;
  else hint = 'Aviso diario hasta que se renueve o cargues un turno';

  return { lead: expiry, strong: formatDateLong(doc.expiration), hint };
}
