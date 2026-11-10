import { describe, it, expect } from 'vitest';
import {
  filterVehicles, countByFilter, sectionOptions, sortByUrgency, vehicleFromForm, formFromVehicle, emptyVehicleForm, vehicleEditPatch, vehicleFormError, isVehicleId, vehicleIdFromPath,
  type VehicleForm,
} from '../lib/vehicles';
import { DEFAULT_PREFS } from '../supabase/functions/_shared/alerts';
import { displayPrefs } from '../lib/display';
import { T, vrow } from './fixtures';

const list = [
  vrow('a', { status: 'Baja', model: 'FIAT 147', assigned_driver: null }),
  vrow('b', { model: 'RANGER', patente: 'AA236JS', section: 'Agronomía', assigned_driver: 'NICO' }),
  vrow('c', { status: 'En Taller', model: 'FORD F-4000', assigned_driver: 'JOSÉ' }),
];
const ids = (l: { id: string }[]) => l.map(v => v.id);

describe('filterVehicles', () => {
  it('por estado, con las bajas al final en Todos', () => {
    expect(ids(filterVehicles(list, 'todos', '', T))).toEqual(['b', 'c', 'a']);
    expect(ids(filterVehicles(list, 'activos', '', T))).toEqual(['b']);
    expect(ids(filterVehicles(list, 'taller', '', T))).toEqual(['c']);
    expect(ids(filterVehicles(list, 'baja', '', T))).toEqual(['a']);
  });
  it('filtro sin fecha: solo unidades activas o en taller con algún documento sin fecha', () => {
    const l = [vrow('a'), vrow('b', { status: 'Baja' }), vrow('c', { tipo: 'generator' }),
      vrow('d', { vtv_expiration: '2027-01-10', insurance_expiration: '2027-01-10', patente_expiration: '2027-01-10' })];
    expect(ids(filterVehicles(l, 'sinfecha', '', T))).toEqual(['a']);
    expect(countByFilter(l, T).sinfecha).toBe(1);
  });
  it('ordena por urgencia y deja las bajas al final', () => {
    const l = [vrow('ok', { vtv_expiration: '2027-06-01', insurance_expiration: '2027-06-01', patente_expiration: '2027-06-01' }),
      vrow('sin'), vrow('baja', { status: 'Baja', vtv_expiration: '2026-10-01' }), vrow('gen', { tipo: 'generator' }),
      vrow('vence', { vtv_expiration: '2026-11-20' }), vrow('vencida', { vtv_expiration: '2026-10-01' })];
    expect(ids(sortByUrgency(l, displayPrefs(DEFAULT_PREFS), T))).toEqual(['vencida', 'vence', 'sin', 'ok', 'gen', 'baja']);
  });
  it('en un empate de urgencia gana el evento más cercano', () => {
    const prefs = displayPrefs(DEFAULT_PREFS);
    const expiring = [vrow('lejos', { vtv_expiration: '2026-11-25' }), vrow('cerca', { vtv_expiration: '2026-11-08' })];
    expect(ids(sortByUrgency(expiring, prefs, T))).toEqual(['cerca', 'lejos']);
    // Overdue: fewer days left (more negative) means the oldest one first
    const expired = [vrow('vencio', { vtv_expiration: '2026-10-01' }), vrow('vencio-antes', { vtv_expiration: '2026-09-01' })];
    expect(ids(sortByUrgency(expired, prefs, T))).toEqual(['vencio-antes', 'vencio']);
  });
  it('una unidad con turno y sin vencimientos va antes que una que solo tiene fechas sin cargar', () => {
    const l = [vrow('sin'), vrow('turno', { vtv_appointment: '2026-11-20' })];
    expect(ids(sortByUrgency(l, displayPrefs(DEFAULT_PREFS), T))).toEqual(['turno', 'sin']);
  });
  it('búsqueda sin mayúsculas, espacios ni acentos', () => {
    expect(ids(filterVehicles(list, 'todos', 'aa 236', T))).toEqual(['b']);
    expect(ids(filterVehicles(list, 'todos', 'agronomia', T))).toEqual(['b']);
    expect(ids(filterVehicles(list, 'todos', 'nico', T))).toEqual(['b']);
    expect(ids(filterVehicles(list, 'todos', 'xyz', T))).toEqual([]);
  });
  it('cuenta por filtro', () => {
    expect(countByFilter(list, T)).toEqual({ todos: 3, activos: 1, taller: 1, sinfecha: 2, baja: 1 });
  });
});

describe('sectionOptions', () => {
  it('suma las secciones que ya existen, sin vacías ni repetidas', () => {
    const opts = sectionOptions([vrow('x', { section: 'Agronomia' }), vrow('y', { section: 'Logística' }), vrow('z', { section: null })]);
    expect(opts).toContain('Agronomia');
    expect(opts).toContain('Agronomía');
    expect(opts.filter(s => s === 'Logística')).toHaveLength(1);
    expect(opts).not.toContain('');
  });
});

describe('vehicleFromForm', () => {
  const base: VehicleForm = { tipo: 'car', patente: ' ab 123 cd ', model: ' hilux srv ', year: '', odometer: '12a', section: 'Cereales', manager: 'rafa', driver: '', status: 'Activo', insurance_expiration: '2027-01-10', vtv_expiration: '', patente_expiration: '' };
  it('normaliza textos y números', () => {
    expect(vehicleFromForm(base)).toEqual({
      tipo: 'car', patente: 'AB123CD', model: 'HILUX SRV', year: null, odometer: null, section: 'Cereales',
      manager: 'RAFA', assigned_driver: null, status: 'Activo',
      insurance_expiration: '2027-01-10', vtv_expiration: null, patente_expiration: null,
    });
  });
  it('un generador no lleva patente, chofer ni fechas', () => {
    const g = vehicleFromForm({ ...base, tipo: 'generator', year: '2006', odometer: '2300', driver: 'JUAN' });
    expect(g).toMatchObject({ tipo: 'generator', patente: null, assigned_driver: null, year: 2006, odometer: 2300, insurance_expiration: null });
  });
});

describe('editar un vehículo', () => {
  it('arma el formulario con los datos guardados', () => {
    expect(formFromVehicle(vrow('a', { year: null, odometer: 95100, assigned_driver: null }))).toEqual({
      tipo: 'car', patente: 'AA 789 XX', model: 'TOYOTA HILUX', year: '', odometer: '95.100', section: 'Cereales', manager: 'RAFA', driver: '',
      status: 'Activo', insurance_expiration: '', vtv_expiration: '', patente_expiration: '',
    });
  });
  it('el alta arranca vacía, como camioneta activa', () => {
    expect(emptyVehicleForm()).toMatchObject({ tipo: 'car', model: '', section: '', status: 'Activo' });
  });
  it('cambiar los datos no toca las fechas de los documentos', () => {
    const patch = vehicleEditPatch(formFromVehicle(vrow('a', { vtv_expiration: '2027-01-10' })));
    expect(patch).not.toHaveProperty('vtv_expiration');
    expect(patch).not.toHaveProperty('vtv_appointment');
    expect(patch).toMatchObject({ model: 'TOYOTA HILUX', patente: 'AA789XX', status: 'Activo' });
  });
  it('al pasar a generador se borran patente, chofer, vencimientos y turnos', () => {
    const patch = vehicleEditPatch({ ...formFromVehicle(vrow('a')), tipo: 'generator' });
    expect(patch).toMatchObject({
      patente: null, assigned_driver: null,
      insurance_expiration: null, vtv_expiration: null, patente_expiration: null,
      insurance_appointment: null, vtv_appointment: null, patente_appointment: null,
    });
  });
});

describe('vehicleFormError', () => {
  const fleet = [vrow('a', { patente: 'AA236JS' }), vrow('b', { patente: 'JRS506' })];
  const f: VehicleForm = { ...emptyVehicleForm(), model: 'RANGER', section: 'Cereales' };
  it('modelo y sección son obligatorios', () => {
    expect(vehicleFormError({ ...f, model: ' ' }, fleet)).toBe('Completá modelo y sección');
    expect(vehicleFormError({ ...f, section: '' }, fleet)).toBe('Completá modelo y sección');
    expect(vehicleFormError(f, fleet)).toBeNull();
  });
  it('no repite una patente', () => {
    expect(vehicleFormError({ ...f, patente: 'aa 236 js' }, fleet)).toBe('Ya hay un vehículo con la patente AA 236 JS');
    expect(vehicleFormError({ ...f, patente: 'AA236JS' }, fleet, fleet[0])).toBeNull();
    expect(vehicleFormError({ ...f, tipo: 'generator', patente: 'AA236JS' }, fleet)).toBeNull();
  });
  it('avisa si el año o el kilometraje no se entienden, en vez de guardarlos vacíos', () => {
    expect(vehicleFormError({ ...f, year: '20a4' }, fleet)).toBe('Revisá el año, por ejemplo 2016');
    expect(vehicleFormError({ ...f, year: '1850' }, fleet)).toBe('Revisá el año, por ejemplo 2016');
    expect(vehicleFormError({ ...f, odometer: '95,100' }, fleet)).toBe('Escribí el kilometraje sin coma, por ejemplo 95.100');
    expect(vehicleFormError({ ...f, tipo: 'tractor', odometer: '2.300,5' }, fleet)).toBe('Escribí las horas de uso sin coma, por ejemplo 2.300');
    expect(vehicleFormError({ ...f, year: '2016', odometer: '95.100' }, fleet)).toBeNull();
    expect(vehicleFormError({ ...f, year: '', odometer: '' }, fleet)).toBeNull();
  });
  it('editar una unidad que ya compartía patente no la traba', () => {
    const twins = [vrow('a', { patente: 'SP' }), vrow('b', { patente: 'SP' }), vrow('c', { patente: 'JRS506' })];
    expect(vehicleFormError({ ...f, patente: 'SP' }, twins, twins[0])).toBeNull();
    expect(vehicleFormError({ ...f, patente: 'JRS506' }, twins, twins[0])).toBe('Ya hay un vehículo con la patente JRS 506');
  });
});

describe('isVehicleId', () => {
  it('reconoce los ids de la base y descarta una dirección inventada', () => {
    expect(isVehicleId('1056c1c5-5a6e-4105-a3d6-6437e4daa377')).toBe(true);
    expect(isVehicleId('no-existe')).toBe(false);
    expect(isVehicleId(undefined)).toBe(false);
  });
});

describe('vehicleIdFromPath', () => {
  it('reconoce la ficha abierta', () => {
    const id = '3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
    expect(vehicleIdFromPath(`/fleet/${id}`)).toBe(id);
    expect(vehicleIdFromPath('/fleet')).toBeUndefined();
    expect(vehicleIdFromPath('/fleet/no-existe')).toBeUndefined();
    expect(vehicleIdFromPath('/')).toBeUndefined();
  });
});
