export interface Vehicle {
  id: string;
  type: 'car' | 'truck' | 'generator'; // Added type distinction
  patente?: string; // Optional because Generators don't have it
  model: string;
  year: number;
  section: 'Agronomía' | 'Cereales' | 'Logística' | 'Administración' | 'Veterinaria' | 'Hacienda' | 'Estación de Servicio';
  status: 'Activo' | 'En Taller' | 'Baja';
  odometer: number; // Can be KM or Hours
  manager: string; 
  assignedDriver?: string; 
  
  // Compliance / Documentación (Optional for Generators)
  insuranceExpiration?: string; 
  vtvExpiration?: string; 
  patenteExpiration?: string; 
  
  alerts: string[];
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