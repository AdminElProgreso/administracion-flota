export interface Vehicle {
  id: string;
  type: 'car' | 'truck' | 'generator';
  patente?: string;
  model: string;
  year: number;
  section: 'Agronomía' | 'Cereales' | 'Logística' | 'Administración' | 'Veterinaria' | 'Hacienda' | 'Estación de Servicio';
  status: 'Activo' | 'En Taller' | 'Baja';
  odometer: number;
  manager: string;
  assignedDriver?: string;

  insuranceExpiration?: string;
  vtvExpiration?: string;
  patenteExpiration?: string;

  alerts: string[];
}

// Raw Database Row Interface
export interface VehicleRow {
  id: string;
  tipo: 'car' | 'truck' | 'generator' | 'tractor';
  patente: string | null;
  model: string;
  year: number;
  section: string;
  status: string;
  odometer: number;
  manager: string | null;
  assigned_driver: string | null;

  // Dates (YYYY-MM-DD)
  vtv_expiration: string | null;
  vtv_appointment: string | null;
  insurance_expiration: string | null;
  insurance_appointment: string | null;
  patente_expiration: string | null;
  patente_appointment: string | null;
}

export interface MaintenanceLog {
  id: string;
  date: string;
  vehicleId: string;
  vehicleName: string;
  type: 'Mantenimiento' | 'Reparación';
  description: string;
  provider: string;
  cost: number;
  status: 'Completado' | 'Pendiente';
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  status: 'active' | 'inactive';
}

export interface Alert {
  id: string;
  type: 'Vencimiento';
  subtype: string; // 'Seguro' | 'VTV' | 'Patente'
  vehicle: string;
  days: number;
  hasAppointment: boolean;
  status: 'appointment' | 'expired' | 'warning' | 'info';
}