import type { VehicleDates } from '../supabase/functions/_shared/alerts';
import type { VehicleRow } from '../types';

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

export const vrow = (id: string, over: Partial<VehicleRow> = {}): VehicleRow => ({
  id,
  tipo: 'car',
  patente: 'AA789XX',
  model: 'TOYOTA HILUX',
  year: 2020,
  section: 'Cereales',
  status: 'Activo',
  odometer: 1000,
  manager: 'RAFA',
  assigned_driver: 'NICO',
  vtv_expiration: null,
  vtv_appointment: null,
  insurance_expiration: null,
  insurance_appointment: null,
  patente_expiration: null,
  patente_appointment: null,
  ...over,
});
