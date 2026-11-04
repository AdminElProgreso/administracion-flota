import type { WorkRow, WorkType } from '../types';

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

export function workFromForm(f: WorkForm): Omit<WorkRow, 'id'> {
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
