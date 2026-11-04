import type { WorkRow, WorkType } from '../types';
import { num } from './format';

export interface WorkForm {
  vehicle_id: string;
  type: WorkType;
  date: string;
  description: string;
  provider: string;
  cost: string;
}

// "$ 385.000" → 385000 and "1.234,50" → 1235 (whole pesos)
export function parseCost(text: string): number | null {
  const cleaned = text.replace(/[^\d.,]/g, '');
  if (!/\d/.test(cleaned)) return null;
  const value = Number(cleaned.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(value) ? Math.round(value) : null;
}

export function emptyWorkForm(vehicleId: string, today: string): WorkForm {
  return { vehicle_id: vehicleId, type: 'Mantenimiento', date: today, description: '', provider: '', cost: '' };
}

export function formFromWork(w: WorkRow): WorkForm {
  return {
    vehicle_id: w.vehicle_id,
    type: w.type,
    date: w.date,
    description: w.description ?? '',
    provider: w.provider ?? '',
    cost: w.cost ? num(w.cost) : '',
  };
}

export function workFromForm(f: WorkForm): Omit<WorkRow, 'id'> {
  if (!f.vehicle_id) throw new Error('Elegí el vehículo');
  if (!f.date) throw new Error('Elegí la fecha');
  const description = f.description.trim();
  if (!description) throw new Error('Contá qué se hizo');
  return {
    vehicle_id: f.vehicle_id,
    type: f.type,
    date: f.date,
    description,
    provider: f.provider.trim() || null,
    cost: parseCost(f.cost) ?? 0,
    status: 'Completado',
  };
}
