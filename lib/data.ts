import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { VehicleRow, WorkRow } from '../types';
import { isVehicleId } from './vehicles';

export const VEHICLES_KEY = ['vehicles'] as const;
export const WORKS_KEY = ['works'] as const;

// The database detail goes to the console; the person sees a short message in Spanish
function fail(error: unknown, message: string): never {
  console.error(message, error);
  throw new Error(message);
}

export function useVehicles() {
  return useQuery<VehicleRow[], Error>({
    queryKey: VEHICLES_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('vehiculos').select('*').order('created_at', { ascending: false });
      if (error) fail(error, 'No se pudieron cargar los vehículos.');
      return (data ?? []) as VehicleRow[];
    },
  });
}

export function useWorks() {
  return useQuery<WorkRow[], Error>({
    queryKey: WORKS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('mantenimientos').select('*').order('date', { ascending: false }).limit(1000);
      if (error) fail(error, 'No se pudieron cargar los trabajos.');
      return (data ?? []) as WorkRow[];
    },
  });
}

// One unit's whole history (the general list stops at the latest 1000 works). Its key starts with WORKS_KEY,
// so every save or delete of a work refreshes it too
export function useVehicleWorks(vehicleId: string | undefined) {
  return useQuery<WorkRow[], Error>({
    queryKey: [...WORKS_KEY, 'vehicle', vehicleId],
    enabled: Boolean(vehicleId),
    queryFn: async () => {
      // A made-up id would make Postgres fail on the uuid column: no unit, no history
      if (!isVehicleId(vehicleId)) return [];
      const { data, error } = await supabase.from('mantenimientos').select('*').eq('vehicle_id', vehicleId).order('date', { ascending: false });
      if (error) fail(error, 'No se pudo cargar el historial de la unidad.');
      return (data ?? []) as WorkRow[];
    },
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return (...keys: (typeof VEHICLES_KEY | typeof WORKS_KEY)[]) =>
    Promise.all(keys.map(queryKey => queryClient.invalidateQueries({ queryKey })));
}

export function useUpdateVehicle() {
  const invalidate = useInvalidate();
  return useMutation<void, Error, { id: string; patch: Record<string, unknown> }>({
    mutationFn: async ({ id, patch }) => {
      const { data, error } = await supabase.from('vehiculos').update(patch).eq('id', id).select('id');
      if (error) fail(error, 'No se pudo guardar el cambio.');
      // RLS can reject an update without an error: no rows back means nothing was saved
      if (!data?.length) fail(null, 'No se pudo guardar el cambio.');
    },
    onSuccess: () => invalidate(VEHICLES_KEY),
  });
}

export function useCreateVehicle() {
  const invalidate = useInvalidate();
  return useMutation<VehicleRow, Error, Partial<VehicleRow>>({
    mutationFn: async vehicle => {
      const { data, error } = await supabase.from('vehiculos').insert(vehicle).select().single();
      if (error || !data) fail(error, 'No se pudo agregar el vehículo.');
      return data as VehicleRow;
    },
    onSuccess: () => invalidate(VEHICLES_KEY),
  });
}

export function useDeleteVehicle() {
  const invalidate = useInvalidate();
  return useMutation<void, Error, string>({
    mutationFn: async id => {
      const works = await supabase.from('mantenimientos').delete().eq('vehicle_id', id);
      if (works.error) fail(works.error, 'No se pudo eliminar el historial de la unidad.');
      const { data, error } = await supabase.from('vehiculos').delete().eq('id', id).select('id');
      // The history is already gone here: saying so lets the person retry knowing what happened
      if (error || !data?.length) fail(error, 'Se borró el historial pero no la unidad. Probá de nuevo.');
    },
    // Also after a failure halfway: the screens must stop showing works that no longer exist
    onSettled: () => invalidate(VEHICLES_KEY, WORKS_KEY),
  });
}

export function useSaveWork() {
  const invalidate = useInvalidate();
  return useMutation<void, Error, { id?: string; values: Omit<WorkRow, 'id'> }>({
    mutationFn: async ({ id, values }) => {
      const table = supabase.from('mantenimientos');
      const { data, error } = await (id ? table.update(values).eq('id', id).select('id') : table.insert(values).select('id'));
      if (error) fail(error, 'No se pudo guardar el trabajo.');
      if (!data?.length) fail(null, 'No se pudo guardar el trabajo.');
    },
    onSuccess: () => invalidate(WORKS_KEY),
  });
}

export function useDeleteWork() {
  const invalidate = useInvalidate();
  return useMutation<void, Error, string>({
    mutationFn: async id => {
      const { data, error } = await supabase.from('mantenimientos').delete().eq('id', id).select('id');
      if (error) fail(error, 'No se pudo borrar el trabajo.');
      if (!data?.length) fail(null, 'No se pudo borrar el trabajo.');
    },
    onSuccess: () => invalidate(WORKS_KEY),
  });
}
