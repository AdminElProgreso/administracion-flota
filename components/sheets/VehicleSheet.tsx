import { useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { VehicleRow, VehicleStatus, VehicleType } from '../../types';
import { useCreateVehicle, useUpdateVehicle, useVehicles } from '../../lib/data';
import {
  STATUS_INFO, TYPE_INFO, emptyVehicleForm, formFromVehicle, sectionOptions, vehicleEditPatch, vehicleFormError, vehicleFromForm,
  type VehicleForm,
} from '../../lib/vehicles';
import { Sheet } from '../Sheet';
import { useToast } from '../Toast';
import { Icon, Plate, Segmented, VehicleArt } from '../ui';

const TYPES = Object.entries(TYPE_INFO) as [VehicleType, (typeof TYPE_INFO)[VehicleType]][];
const STATUS_OPTIONS = (Object.keys(STATUS_INFO) as VehicleStatus[]).map(s => ({ value: s, label: STATUS_INFO[s].label }));
type TextField = Exclude<keyof VehicleForm, 'tipo' | 'status'>;
const hasDates = (v: VehicleRow) =>
  Boolean(v.insurance_expiration || v.vtv_expiration || v.patente_expiration || v.insurance_appointment || v.vtv_appointment || v.patente_appointment);

// Adds a vehicle, or edits its data when one is given (the documents are renewed from its ficha)
export function VehicleSheet({ vehicle, onClose }: { vehicle?: VehicleRow; onClose: () => void }) {
  const { data: vehicles = [] } = useVehicles();
  const create = useCreateVehicle();
  const update = useUpdateVehicle();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState<VehicleForm>(() => (vehicle ? formFromVehicle(vehicle) : emptyVehicleForm()));

  const editing = Boolean(vehicle);
  const generator = form.tipo === 'generator';
  const busy = create.isPending || update.isPending;
  const setTipo = (tipo: VehicleType) => setForm(f => ({ ...f, tipo }));
  const setStatus = (status: VehicleStatus) => setForm(f => ({ ...f, status }));
  const input = (key: TextField) => ({
    value: form[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [key]: e.target.value })),
  });

  const submit = () => {
    const problem = vehicleFormError(form, vehicles, vehicle);
    if (problem) { toast(problem, 'error'); return; }
    const onError = (e: Error) => toast(e.message, 'error');
    if (vehicle) {
      update.mutate({ id: vehicle.id, patch: vehicleEditPatch(form) }, {
        onSuccess: () => { toast('Datos guardados'); onClose(); },
        onError,
      });
    } else {
      create.mutate(vehicleFromForm(form), {
        onSuccess: created => { toast('Vehículo agregado'); onClose(); navigate(`/fleet/${created.id}`); },
        onError,
      });
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      busy={busy}
      title={editing ? 'Editar datos' : 'Agregar un vehículo'}
      subtitle={vehicle && <>{vehicle.model} <Plate value={vehicle.patente} /></>}
      footer={<>
        <button type="button" className="btn btn-ghost" disabled={busy} onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? 'Guardando…' : 'Guardar'}</button>
      </>}
    >
      <div className="field">
        <span>Tipo</span>
        <div className="types" role="group" aria-label="Tipo">
          {TYPES.map(([key, t]) => (
            <button key={key} type="button" className="type-opt" aria-pressed={form.tipo === key} onClick={() => setTipo(key)}>
              <VehicleArt type={key} />{t.label}
            </button>
          ))}
        </div>
      </div>

      {editing && generator && vehicle && vehicle.tipo !== 'generator' && hasDates(vehicle) && (
        <p className="note warn"><Icon name="warning" />Un generador no lleva documentos: al guardar se borran sus vencimientos y turnos.</p>
      )}

      <div className="field-row">
        <label className="field"><span>Modelo</span><input className="input upper" placeholder="Ej.: HILUX SRV" autoCapitalize="characters" {...input('model')} /></label>
        {!generator && (
          <label className="field"><span>Patente</span><input className="input upper" placeholder="AA 123 BC" autoCapitalize="characters" {...input('patente')} /></label>
        )}
      </div>

      <div className="field-row">
        <label className="field"><span>Año</span><input className="input num" inputMode="numeric" maxLength={4} placeholder="2024" {...input('year')} /></label>
        <label className="field">
          <span>Sección</span>
          <select className="input" {...input('section')}>
            <option value="" disabled>Elegí una</option>
            {sectionOptions(vehicles).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      <div className="field-row">
        <label className="field"><span>Encargado</span><input className="input upper" autoCapitalize="characters" {...input('manager')} /></label>
        {!generator && (
          <label className="field"><span>Chofer</span><input className="input upper" placeholder="Opcional" autoCapitalize="characters" {...input('driver')} /></label>
        )}
      </div>

      <label className="field">
        <span>{TYPE_INFO[form.tipo].unit === 'km' ? 'Kilometraje' : 'Horas de uso'}</span>
        <input className="input num" inputMode="numeric" placeholder={TYPE_INFO[form.tipo].unit === 'km' ? 'Ej.: 95.100' : 'Ej.: 2.300'} {...input('odometer')} />
      </label>

      {editing && (
        <div className="field">
          <span>Estado</span>
          <Segmented block value={form.status} options={STATUS_OPTIONS} onChange={setStatus} />
        </div>
      )}

      {!editing && !generator && <>
        <div className="field-row">
          <label className="field"><span>Vence el seguro</span><input className="input" type="date" {...input('insurance_expiration')} /></label>
          <label className="field"><span>Vence la VTV</span><input className="input" type="date" {...input('vtv_expiration')} /></label>
        </div>
        <div className="field-row">
          <label className="field"><span>Vence la patente</span><input className="input" type="date" {...input('patente_expiration')} /></label>
        </div>
        <p className="note"><Icon name="info" />Los vencimientos son opcionales: también los cargás después desde la ficha.</p>
      </>}
    </Sheet>
  );
}
