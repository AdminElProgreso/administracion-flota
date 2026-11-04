import { createContext, useContext } from 'react';
import type { DocType } from '../../supabase/functions/_shared/alerts';
import type { VehicleRow, WorkRow } from '../../types';

export type SheetRequest =
  | { kind: 'quick' }
  | { kind: 'renew' | 'appointment'; vehicleId?: string; docType?: DocType }
  | { kind: 'work'; vehicleId?: string; work?: WorkRow }
  | { kind: 'vehicle'; vehicle?: VehicleRow };

export interface SheetsApi {
  open: (request: SheetRequest) => void;
  close: () => void;
}

export const SheetsContext = createContext<SheetsApi>({ open: () => undefined, close: () => undefined });

// Opens the forms (sheets) from any screen
export const useSheets = () => useContext(SheetsContext);
