// Single rule for the state of each vehicle document, shared by the app screens and the
// check-alerts Edge Function. No Deno or Node APIs and no packages, so both runtimes can import it.
import { daysBetween } from './dates.ts';

export type DocType = 'Seguro' | 'VTV' | 'Patente';
export const DOC_TYPES: DocType[] = ['Seguro', 'VTV', 'Patente'];

// Shown in the UI as Turno, Vencido, Por vencer, Al día and Sin fecha
export type DocState = 'appointment' | 'expired' | 'expiring' | 'ok' | 'no-date';

export interface AlertPrefs {
  thresholds: Record<DocType, number> & { appointments: number };
  enabled: Record<DocType, boolean> & { appointments: boolean };
}

export const DEFAULT_PREFS: AlertPrefs = {
  thresholds: { Seguro: 15, VTV: 30, Patente: 10, appointments: 3 },
  enabled: { Seguro: true, VTV: true, Patente: true, appointments: true },
};

export interface UserSettingsRow {
  user_id: string;
  insurance_threshold: number | null;
  vtv_threshold: number | null;
  patente_threshold: number | null;
  appointments_threshold: number | null;
  insurance_alerts: boolean | null;
  vtv_alerts: boolean | null;
  patente_alerts: boolean | null;
  appointment_alerts: boolean | null;
}

export function prefsFromRow(row: Partial<UserSettingsRow> | null | undefined): AlertPrefs {
  const { thresholds, enabled } = DEFAULT_PREFS;
  return {
    thresholds: {
      Seguro: row?.insurance_threshold ?? thresholds.Seguro,
      VTV: row?.vtv_threshold ?? thresholds.VTV,
      Patente: row?.patente_threshold ?? thresholds.Patente,
      appointments: row?.appointments_threshold ?? thresholds.appointments,
    },
    enabled: {
      Seguro: row?.insurance_alerts ?? enabled.Seguro,
      VTV: row?.vtv_alerts ?? enabled.VTV,
      Patente: row?.patente_alerts ?? enabled.Patente,
      appointments: row?.appointment_alerts ?? enabled.appointments,
    },
  };
}

export function rowFromPrefs(userId: string, prefs: AlertPrefs): UserSettingsRow {
  return {
    user_id: userId,
    insurance_threshold: prefs.thresholds.Seguro,
    vtv_threshold: prefs.thresholds.VTV,
    patente_threshold: prefs.thresholds.Patente,
    appointments_threshold: prefs.thresholds.appointments,
    insurance_alerts: prefs.enabled.Seguro,
    vtv_alerts: prefs.enabled.VTV,
    patente_alerts: prefs.enabled.Patente,
    appointment_alerts: prefs.enabled.appointments,
  };
}

export interface VehicleDates {
  id: string;
  model: string;
  patente: string | null;
  status: string;
  insurance_expiration: string | null;
  insurance_appointment: string | null;
  vtv_expiration: string | null;
  vtv_appointment: string | null;
  patente_expiration: string | null;
  patente_appointment: string | null;
}

export const DOC_COLUMNS: Record<DocType, { expiration: keyof VehicleDates; appointment: keyof VehicleDates }> = {
  Seguro: { expiration: 'insurance_expiration', appointment: 'insurance_appointment' },
  VTV: { expiration: 'vtv_expiration', appointment: 'vtv_appointment' },
  Patente: { expiration: 'patente_expiration', appointment: 'patente_appointment' },
};

export interface DocStatus {
  type: DocType;
  state: DocState;
  expiration: string | null;
  appointment: string | null;
  daysToExpiration: number | null;
  daysToAppointment: number | null;
  pastAppointment: boolean;
}

export function docStatus(type: DocType, expiration: string | null, appointment: string | null, threshold: number, today: string): DocStatus {
  // The ficha's modal saves '' when a date is cleared
  const exp = expiration || null;
  const appt = appointment || null;
  const daysToExpiration = exp ? daysBetween(today, exp) : null;
  const daysToAppointment = appt ? daysBetween(today, appt) : null;

  // An appointment from today on always wins, even over an expired document
  let state: DocState;
  if (daysToAppointment !== null && daysToAppointment >= 0) state = 'appointment';
  else if (daysToExpiration === null) state = 'no-date';
  else if (daysToExpiration < 0) state = 'expired';
  else if (daysToExpiration <= threshold) state = 'expiring';
  else state = 'ok';

  const pastAppointment = daysToAppointment !== null && daysToAppointment < 0 && (state === 'expiring' || state === 'expired');
  return { type, state, expiration: exp, appointment: appt, daysToExpiration, daysToAppointment, pastAppointment };
}

export function vehicleDocs(vehicle: VehicleDates, prefs: AlertPrefs, today: string): DocStatus[] {
  return DOC_TYPES.map(type => {
    const columns = DOC_COLUMNS[type];
    return docStatus(type, vehicle[columns.expiration], vehicle[columns.appointment], prefs.thresholds[type], today);
  });
}

export interface AttentionItem {
  vehicle: VehicleDates;
  doc: DocStatus;
}

const ATTENTION_ORDER: DocState[] = ['expired', 'expiring', 'appointment'];

const attentionDays = (doc: DocStatus) => (doc.state === 'appointment' ? doc.daysToAppointment : doc.daysToExpiration) ?? 0;

export function attentionList(vehicles: VehicleDates[], prefs: AlertPrefs, today: string): AttentionItem[] {
  return vehicles
    .filter(vehicle => vehicle.status !== 'Baja')
    .flatMap(vehicle => vehicleDocs(vehicle, prefs, today).map(doc => ({ vehicle, doc })))
    .filter(({ doc }) => ATTENTION_ORDER.includes(doc.state))
    .sort((a, b) =>
      ATTENTION_ORDER.indexOf(a.doc.state) - ATTENTION_ORDER.indexOf(b.doc.state) || attentionDays(a.doc) - attentionDays(b.doc));
}

export function appointmentAfterRenewal(prevExpiration: string, newExpiration: string, prevAppointment: string, newAppointment: string): string | null {
  // Renewing without loading a new appointment clears the old one
  if (newExpiration !== prevExpiration && newAppointment === prevAppointment) return null;
  return newAppointment || null;
}
