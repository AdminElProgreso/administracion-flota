import type { VehicleRow, VehicleStatus, VehicleType } from '../types';

export const TYPE_INFO: Record<VehicleType, { label: string; icon: string; unit: 'km' | 'h' }> = {
  car: { label: 'Camioneta / auto', icon: 'directions_car', unit: 'km' },
  truck: { label: 'Camión', icon: 'local_shipping', unit: 'km' },
  tractor: { label: 'Tractor', icon: 'agriculture', unit: 'h' },
  generator: { label: 'Generador', icon: 'bolt', unit: 'h' },
};

// The database keeps 'En Taller'; the screens say "En taller"
export const STATUS_INFO: Record<VehicleStatus, { label: string; cls: string }> = {
  'Activo': { label: 'Activo', cls: 's-active' },
  'En Taller': { label: 'En taller', cls: 's-shop' },
  'Baja': { label: 'De baja', cls: 's-off' },
};

export type VehicleFilter = 'todos' | 'activos' | 'taller' | 'baja';

const MATCH: Record<VehicleFilter, (v: VehicleRow) => boolean> = {
  todos: () => true,
  activos: v => v.status === 'Activo',
  taller: v => v.status === 'En Taller',
  baja: v => v.status === 'Baja',
};

// Search ignores case, spaces and accents ("agronomia" finds "Agronomía", "aa 236" finds "AA236JS")
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '');

export function filterVehicles<T extends VehicleRow>(list: T[], filter: VehicleFilter, query: string): T[] {
  const q = fold(query);
  const found = list
    .filter(MATCH[filter])
    .filter(v => !q || [v.model, v.patente, v.assigned_driver, v.manager, v.section].some(x => x && fold(x).includes(q)));
  // With everything shown, units in Baja go last
  return filter === 'todos' ? [...found.filter(v => v.status !== 'Baja'), ...found.filter(v => v.status === 'Baja')] : found;
}

export function countByFilter(list: VehicleRow[]): Record<VehicleFilter, number> {
  return {
    todos: list.length,
    activos: list.filter(MATCH.activos).length,
    taller: list.filter(MATCH.taller).length,
    baja: list.filter(MATCH.baja).length,
  };
}

export const DEFAULT_SECTIONS = ['Administración', 'Agronomía', 'Balanceado', 'Cereales', 'Estación de Servicio', 'Ferreteria', 'Hacienda', 'Logística', 'Miel', 'Supermercado', 'Veterinaria'];

// Sections already stored are kept as they are, so editing a unit never changes its section silently
export function sectionOptions(vehicles: VehicleRow[]): string[] {
  const sections = new Set(DEFAULT_SECTIONS);
  for (const v of vehicles) {
    const s = v.section?.trim();
    if (s) sections.add(s);
  }
  return [...sections].sort((a, b) => a.localeCompare(b, 'es'));
}

export interface VehicleForm {
  tipo: VehicleType;
  patente: string;
  model: string;
  year: string;
  odometer: string;
  section: string;
  manager: string;
  driver: string;
  status: VehicleStatus;
  insurance_expiration: string;
  vtv_expiration: string;
  patente_expiration: string;
}

const text = (s: string) => s.trim() || null;
const upper = (s: string) => text(s)?.toUpperCase() ?? null;
// Whole numbers, accepting Argentine thousands separators ("95.100")
const int = (s: string) => {
  const t = s.trim().replace(/\./g, '');
  return /^\d+$/.test(t) ? Number(t) : null;
};

export function vehicleFromForm(f: VehicleForm): Omit<VehicleRow, 'id' | 'created_at' | 'vtv_appointment' | 'insurance_appointment' | 'patente_appointment'> {
  const generator = f.tipo === 'generator';
  const date = (s: string) => (generator ? null : text(s));
  return {
    tipo: f.tipo,
    patente: generator ? null : upper(f.patente)?.replace(/\s+/g, '') ?? null,
    model: upper(f.model) ?? '',
    year: int(f.year),
    odometer: int(f.odometer),
    section: text(f.section),
    manager: upper(f.manager),
    assigned_driver: generator ? null : upper(f.driver),
    status: f.status,
    insurance_expiration: date(f.insurance_expiration),
    vtv_expiration: date(f.vtv_expiration),
    patente_expiration: date(f.patente_expiration),
  };
}
