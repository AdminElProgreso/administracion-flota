import { describe, it, expect } from 'vitest';
import {
  filterVehicles, countByFilter, sectionOptions, vehicleFromForm, formFromVehicle, emptyVehicleForm, vehicleEditPatch, vehicleFormError, type VehicleForm,
} from '../lib/vehicles';
import { vrow } from './fixtures';

const list = [
  vrow('a', { status: 'Baja', model: 'FIAT 147', assigned_driver: null }),
  vrow('b', { model: 'RANGER', patente: 'AA236JS', section: 'Agronomía', assigned_driver: 'NICO' }),
  vrow('c', { status: 'En Taller', model: 'FORD F-4000', assigned_driver: 'JOSÉ' }),
];
const ids = (l: { id: string }[]) => l.map(v => v.id);

describe('filterVehicles', () => {
  it('por estado, con las bajas al final en Todos', () => {
    expect(ids(filterVehicles(list, 'todos', ''))).toEqual(['b', 'c', 'a']);
    expect(ids(filterVehicles(list, 'activos', ''))).toEqual(['b']);
    expect(ids(filterVehicles(list, 'taller', ''))).toEqual(['c']);
    expect(ids(filterVehicles(list, 'baja', ''))).toEqual(['a']);
  });
  it('búsqueda sin mayúsculas, espacios ni acentos', () => {
    expect(ids(filterVehicles(list, 'todos', 'aa 236'))).toEqual(['b']);
    expect(ids(filterVehicles(list, 'todos', 'agronomia'))).toEqual(['b']);
    expect(ids(filterVehicles(list, 'todos', 'nico'))).toEqual(['b']);
    expect(ids(filterVehicles(list, 'todos', 'xyz'))).toEqual([]);
  });
  it('cuenta por filtro', () => {
    expect(countByFilter(list)).toEqual({ todos: 3, activos: 1, taller: 1, baja: 1 });
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
  it('editar una unidad que ya compartía patente no la traba', () => {
    const twins = [vrow('a', { patente: 'SP' }), vrow('b', { patente: 'SP' }), vrow('c', { patente: 'JRS506' })];
    expect(vehicleFormError({ ...f, patente: 'SP' }, twins, twins[0])).toBeNull();
    expect(vehicleFormError({ ...f, patente: 'JRS506' }, twins, twins[0])).toBe('Ya hay un vehículo con la patente JRS 506');
  });
});
