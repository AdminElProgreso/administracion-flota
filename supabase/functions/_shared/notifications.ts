// Which push notifications go out each day, their exact copy, and how they are sent.
// The check-alerts Edge Function only adds the database queries and web-push on top of this.
import { prefsFromRow, vehicleDocs, type AlertPrefs, type DocType, type UserSettingsRow, type VehicleDates } from './alerts.ts';

export type NotificationKind = 'expiring' | 'expired' | 'appointment';

export interface FleetNotification {
  vehicleId: string;
  docType: DocType;
  kind: NotificationKind;
  // Days left for 'expiring' and 'appointment'; days since it expired (positive) for 'expired'
  days: number;
  title: string;
  body: string;
  url: string;
  tag: string;
}

const ARTICLE: Record<DocType, string> = { Seguro: 'El seguro', VTV: 'La VTV', Patente: 'La patente' };
const NAME: Record<DocType, string> = { Seguro: 'seguro', VTV: 'VTV', Patente: 'patente' };
const EXPIRED_TITLE: Record<DocType, string> = { Seguro: 'Seguro vencido', VTV: 'VTV vencida', Patente: 'Patente vencida' };

const vehicleLabel = (vehicle: VehicleDates) => {
  const plate = vehicle.patente?.trim();
  return `${vehicle.model} (${plate ? plate.toUpperCase() : 'sin patente'})`;
};

const inDays = (days: number) => (days === 0 ? 'hoy' : days === 1 ? 'mañana' : `en ${days} días`);

export function buildNotification(vehicle: VehicleDates, docType: DocType, kind: NotificationKind, days: number): FleetNotification {
  const subject = `${ARTICLE[docType]} del ${vehicleLabel(vehicle)}`;
  let title: string;
  let body: string;
  if (kind === 'expiring') {
    title = `Vencimiento de ${NAME[docType]}`;
    body = `${subject} vence ${inDays(days)}.`;
  } else if (kind === 'expired') {
    title = EXPIRED_TITLE[docType];
    body = `${subject} venció ${days === 1 ? 'ayer' : `hace ${days} días`}.`;
  } else {
    title = `Turno de ${NAME[docType]}`;
    body = `Turno de ${NAME[docType]} del ${vehicleLabel(vehicle)} ${inDays(days)}.`;
  }
  return { vehicleId: vehicle.id, docType, kind, days, title, body, url: `/#/fleet/${vehicle.id}`, tag: `${vehicle.id}-${docType}` };
}

export function selectNotifications(vehicles: VehicleDates[], prefs: AlertPrefs, today: string): FleetNotification[] {
  const notifications: FleetNotification[] = [];
  for (const vehicle of vehicles) {
    if (vehicle.status === 'Baja') continue;
    for (const doc of vehicleDocs(vehicle, prefs, today)) {
      const daysToAppointment = doc.daysToAppointment ?? 0;
      const daysToExpiration = doc.daysToExpiration ?? 0;
      // While an appointment is booked, only its reminder goes out
      if (doc.state === 'appointment') {
        if (prefs.enabled.appointments && daysToAppointment <= prefs.thresholds.appointments) {
          notifications.push(buildNotification(vehicle, doc.type, 'appointment', daysToAppointment));
        }
      } else if (doc.state === 'expiring' && prefs.enabled[doc.type]) {
        notifications.push(buildNotification(vehicle, doc.type, 'expiring', daysToExpiration));
      } else if (doc.state === 'expired' && prefs.enabled[doc.type]) {
        notifications.push(buildNotification(vehicle, doc.type, 'expired', -daysToExpiration));
      }
    }
  }
  return notifications;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  subscription: unknown;
}

export interface Delivery {
  subscriptionId: string;
  subscription: unknown;
  payload: string;
}

export function planDeliveries(
  vehicles: VehicleDates[],
  subscriptions: PushSubscriptionRow[],
  settingsRows: Partial<UserSettingsRow>[],
  today: string,
): Delivery[] {
  // If a user has several rows, the last one wins
  const rowsByUser = new Map<string, Partial<UserSettingsRow>>();
  for (const row of settingsRows) {
    if (row.user_id) rowsByUser.set(row.user_id, row);
  }

  const payloadsByUser = new Map<string, string[]>();
  const payloadsFor = (userId: string) => {
    let payloads = payloadsByUser.get(userId);
    if (!payloads) {
      payloads = selectNotifications(vehicles, prefsFromRow(rowsByUser.get(userId)), today)
        .map(({ title, body, url, tag }) => JSON.stringify({ title, body, url, tag }));
      payloadsByUser.set(userId, payloads);
    }
    return payloads;
  };

  return subscriptions.flatMap(sub =>
    payloadsFor(sub.user_id).map(payload => ({ subscriptionId: sub.id, subscription: sub.subscription, payload })));
}

// Push services answer 404/410 when a subscription no longer exists
const GONE_STATUS = [404, 410];

export async function sendAll(
  deliveries: Delivery[],
  send: (subscription: unknown, payload: string) => Promise<unknown>,
): Promise<{ sent: number; failed: number; expiredSubscriptionIds: string[] }> {
  const results = await Promise.allSettled(deliveries.map(d => send(d.subscription, d.payload)));
  const expired = new Set<string>();
  let sent = 0;
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      sent++;
      return;
    }
    const statusCode = (result.reason as { statusCode?: number } | null)?.statusCode;
    if (statusCode !== undefined && GONE_STATUS.includes(statusCode)) expired.add(deliveries[i].subscriptionId);
  });
  return { sent, failed: deliveries.length - sent, expiredSubscriptionIds: [...expired] };
}
