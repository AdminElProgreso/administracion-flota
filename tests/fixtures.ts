import type { VehicleDates } from '../supabase/functions/_shared/alerts';

export const T = '2026-11-03';

export const vehicle = (id: string, over: Partial<VehicleDates> = {}): VehicleDates => ({
  id,
  model: 'TOYOTA HILUX',
  patente: 'AA789XX',
  status: 'Activo',
  insurance_expiration: null,
  insurance_appointment: null,
  vtv_expiration: null,
  vtv_appointment: null,
  patente_expiration: null,
  patente_appointment: null,
  ...over,
});
