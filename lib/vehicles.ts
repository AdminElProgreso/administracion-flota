import { num, plateText } from './format';
import { DEFAULT_PREFS, vehicleDocs, type AlertPrefs, type DocStatus } from '../supabase/functions/_shared/alerts';
import { URGENCY } from './display';
import type { VehicleRow, VehicleStatus, VehicleType } from '../types';

// image: the cooperative's own illustration of each kind (public/vehiculos, drawn with the logo's colors)
export const TYPE_INFO: Record<VehicleType, { label: string; image: string; unit: 'km' | 'h' }> = {
  car: { label: 'Camioneta / auto', image: '/vehiculos/camioneta.svg', unit: 'km' },
  truck: { label: 'Camión', image: '/vehiculos/camion.svg', unit: 'km' },
  tractor: { label: 'Tractor', image: '/vehiculos/tractor.svg', unit: 'h' },
  generator: { label: 'Generador', image: '/vehiculos/generador.svg', unit: 'h' },
};

// The database keeps 'En Taller'; the screens say "En taller"
export const STATUS_INFO: Record<VehicleStatus, { label: string; cls: string }> = {
  'Activo': { label: 'Activo', cls: 's-active' },
  'En Taller': { label: 'En taller', cls: 's-shop' },
  'Baja': { label: 'De baja', cls: 's-off' },
};

export type VehicleFilter = 'todos' | 'activos' | 'taller' | 'sinfecha' | 'baja';

// A unit with a document still without date; the state does not depend on the threshold
const missingDate = (v: VehicleRow, today: string) =>
  v.tipo !== 'generator' && v.status !== 'Baja' && vehicleDocs(v, DEFAULT_PREFS, today).some(d => d.state === 'no-date');

const MATCH: Record<VehicleFilter, (v: VehicleRow, today: string) => boolean> = {
  todos: () => true,
  activos: v => v.status === 'Activo',
  taller: v => v.status === 'En Taller',
  sinfecha: missingDate,
  baja: v => v.status === 'Baja',
};

// Search ignores case, spaces and accents ("agronomia" finds "Agronomía", "aa 236" finds "AA236JS")
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '');

export function filterVehicles<T extends VehicleRow>(list: T[], filter: VehicleFilter, query: string, today: string): T[] {
  const q = fold(query);
  const found = list
    .filter(v => MATCH[filter](v, today))
    .filter(v => !q || [v.model, v.patente, v.assigned_driver, v.manager, v.section].some(x => x && fold(x).includes(q)));
  // With everything shown, units in Baja go last
  return filter === 'todos' ? [...found.filter(v => v.status !== 'Baja'), ...found.filter(v => v.status === 'Baja')] : found;
}

export function countByFilter(list: VehicleRow[], today: string): Record<VehicleFilter, number> {
  return {
    todos: list.length,
    activos: list.filter(v => MATCH.activos(v, today)).length,
    taller: list.filter(v => MATCH.taller(v, today)).length,
    sinfecha: list.filter(v => MATCH.sinfecha(v, today)).length,
    baja: list.filter(v => MATCH.baja(v, today)).length,
  };
}

const eventDays = (d: DocStatus) => (d.state === 'appointment' ? d.daysToAppointment : d.daysToExpiration) ?? Infinity;

// Most urgent first. Generators carry no documents, so they follow every unit that has them; units de baja go last.
// Ties go to the nearest event; the sort is stable, so the rest keeps its order.
export function sortByUrgency<T extends VehicleRow>(list: T[], prefs: AlertPrefs, today: string): T[] {
  const key = (v: T) => {
    const group = v.status === 'Baja' ? 2 : v.tipo === 'generator' ? 1 : 0;
    if (group) return { group, urgency: 0, days: 0 };
    const docs = vehicleDocs(v, prefs, today);
    const urgency = Math.min(...docs.map(d => URGENCY[d.state]));
    const days = Math.min(...docs.filter(d => URGENCY[d.state] === urgency).map(eventDays));
    return { group, urgency, days };
  };
  return list
    .map(v => ({ v, k: key(v) }))
    .sort((a, b) => a.k.group - b.k.group || a.k.urgency - b.k.urgency || (a.k.days === b.k.days ? 0 : a.k.days < b.k.days ? -1 : 1))
    .map(x => x.v);
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

export function emptyVehicleForm(): VehicleForm {
  return {
    tipo: 'car', patente: '', model: '', year: '', odometer: '', section: '', manager: '', driver: '',
    status: 'Activo', insurance_expiration: '', vtv_expiration: '', patente_expiration: '',
  };
}

// The edit form carries no dates: documents are renewed from the ficha
export function formFromVehicle(v: VehicleRow): VehicleForm {
  return {
    ...emptyVehicleForm(),
    tipo: v.tipo,
    patente: plateText(v.patente) ?? '',
    model: v.model,
    year: v.year === null ? '' : String(v.year),
    odometer: v.odometer === null ? '' : num(v.odometer),
    section: v.section ?? '',
    manager: v.manager ?? '',
    driver: v.assigned_driver ?? '',
    status: v.status,
  };
}

const NO_DOCUMENTS = {
  insurance_expiration: null, vtv_expiration: null, patente_expiration: null,
  insurance_appointment: null, vtv_appointment: null, patente_appointment: null,
};

// Editing the data leaves the document dates alone, except that a generator carries none:
// stale dates would keep sending notices for it
export function vehicleEditPatch(f: VehicleForm): Partial<VehicleRow> {
  const { insurance_expiration, vtv_expiration, patente_expiration, ...data } = vehicleFromForm(f);
  return f.tipo === 'generator' ? { ...data, ...NO_DOCUMENTS } : data;
}

const plateKey = (p: string | null | undefined) => (p ?? '').toUpperCase().replace(/\s+/g, '');

export function vehicleFormError(f: VehicleForm, vehicles: VehicleRow[], editing?: Pick<VehicleRow, 'id' | 'patente'>): string | null {
  if (!f.model.trim() || !f.section.trim()) return 'Completá modelo y sección';
  // A number that doesn't parse would be saved empty without a word: ask for it again instead
  const year = int(f.year);
  if (f.year.trim() && (year === null || year < 1900 || year > new Date().getFullYear() + 1)) return 'Revisá el año, por ejemplo 2016';
  if (f.odometer.trim() && int(f.odometer) === null) {
    return TYPE_INFO[f.tipo].unit === 'km' ? 'Escribí el kilometraje sin coma, por ejemplo 95.100' : 'Escribí las horas de uso sin coma, por ejemplo 2.300';
  }
  const plate = f.tipo === 'generator' ? '' : plateKey(f.patente);
  // Editing keeps the plate a unit already had, even when another one shares it (placeholders like "S/P")
  if (!plate || (editing && plate === plateKey(editing.patente))) return null;
  const twin = vehicles.find(v => v.id !== editing?.id && plateKey(v.patente) === plate);
  return twin ? `Ya hay un vehículo con la patente ${plateText(plate)}` : null;
}

// Vehicle ids are UUIDs; an address like /#/fleet/no-existe is not worth asking the database about
export const isVehicleId = (id: string | undefined): id is string =>
  Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
