export type VehicleType = 'car' | 'truck' | 'generator' | 'tractor';
export type VehicleStatus = 'Activo' | 'En Taller' | 'Baja';

// Row of the "vehiculos" table
export interface VehicleRow {
  id: string;
  tipo: VehicleType;
  patente: string | null;
  model: string;
  year: number | null;
  section: string | null;
  status: VehicleStatus;
  odometer: number | null;
  manager: string | null;
  assigned_driver: string | null;

  // Dates (YYYY-MM-DD)
  vtv_expiration: string | null;
  vtv_appointment: string | null;
  insurance_expiration: string | null;
  insurance_appointment: string | null;
  patente_expiration: string | null;
  patente_appointment: string | null;
  created_at?: string;
}

export type WorkType = 'Mantenimiento' | 'Reparación';

// Row of the "mantenimientos" table
export interface WorkRow {
  id: string;
  date: string;
  vehicle_id: string;
  type: WorkType;
  description: string | null;
  provider: string | null;
  cost: number | null;
  status: string | null;
}
