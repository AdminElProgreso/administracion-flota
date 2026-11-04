import { useState, type ChangeEvent } from 'react';
import { todayISO } from '../../supabase/functions/_shared/dates';
import type { WorkRow, WorkType } from '../../types';
import { useDeleteWork, useSaveWork, useVehicles } from '../../lib/data';
import { plateText } from '../../lib/format';
import { useConfirmStep } from '../../lib/useConfirmStep';
import { emptyWorkForm, formFromWork, workFromForm, type WorkForm } from '../../lib/works';
import { Sheet } from '../Sheet';
import { useToast } from '../Toast';
import { EmptyState, Icon, Loading, Segmented } from '../ui';

const TYPE_OPTIONS: { value: WorkType; label: string; icon: string }[] = [
  { value: 'Mantenimiento', label: 'Mantenimiento', icon: 'handyman' },
  { value: 'Reparación', label: 'Reparación', icon: 'car_repair' },
];

type TextField = Exclude<keyof WorkForm, 'type'>;

// Records a maintenance or repair, or edits (and deletes) one already saved
export function WorkSheet({ vehicleId, work, onClose }: { vehicleId?: string; work?: WorkRow; onClose: () => void }) {
  const { data: vehicles, error: vehiclesError } = useVehicles();
  const save = useSaveWork();
  const remove = useDeleteWork();
  const toast = useToast();
  const [form, setForm] = useState<WorkForm>(() => (work ? formFromWork(work) : emptyWorkForm(vehicleId ?? '', todayISO())));
  const confirmDelete = useConfirmStep();
  const busy = save.isPending || remove.isPending;

  // Units de baja only show up when the work already belongs to one
  const options = (vehicles ?? [])
    .filter(v => v.status !== 'Baja' || v.id === form.vehicle_id)
    .sort((a, b) => a.model.localeCompare(b.model, 'es'));
  const known = options.some(v => v.id === form.vehicle_id);
  const input = (key: TextField) => ({
    value: form[key],
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [key]: e.target.value })),
  });

  const submit = () => {
    let values;
    try {
      values = workFromForm(form);
    } catch (e) {
      toast((e as Error).message, 'error');
      return;
    }
    save.mutate({ id: work?.id, values }, {
      onSuccess: () => { toast(work ? 'Trabajo actualizado' : 'Trabajo registrado'); onClose(); },
      onError: e => toast(e.message, 'error'),
    });
  };

  // Two steps: the first tap turns the button into "Sí, borrar"
  const erase = () => {
    if (!work) return;
    if (!confirmDelete.armed) { confirmDelete.arm(); return; }
    if (!confirmDelete.confirmed()) return;
    remove.mutate(work.id, {
      onSuccess: () => { toast('Trabajo borrado'); onClose(); },
      onError: e => toast(e.message, 'error'),
    });
  };

  const title = work ? 'Editar trabajo' : 'Registrar un trabajo';
  // Without the list of vehicles there is nothing to choose: say why instead of an empty picker
  if (!vehicles) {
    return (
      <Sheet open onClose={onClose} title={title}>
        {vehiclesError ? <EmptyState icon="cloud_off" title="No se pudieron cargar los vehículos" text="Revisá la conexión y probá de nuevo." /> : <Loading />}
      </Sheet>
    );
  }

  return (
    <Sheet
      open
      onClose={onClose}
      busy={busy}
      title={title}
      footer={<>
        <button type="button" className="btn btn-ghost" disabled={busy} onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={submit}>{save.isPending ? 'Guardando…' : 'Guardar'}</button>
      </>}
    >
      <label className="field">
        <span>Vehículo</span>
        <select className="input" {...input('vehicle_id')} value={known ? form.vehicle_id : ''}>
          {!known && <option value="" disabled>Elegí un vehículo</option>}
          {options.map(v => <option key={v.id} value={v.id}>{v.model}{v.patente ? ` · ${plateText(v.patente)}` : ''}</option>)}
        </select>
      </label>

      <div className="field">
        <span>Tipo</span>
        <Segmented block value={form.type} options={TYPE_OPTIONS} onChange={type => setForm(f => ({ ...f, type }))} />
      </div>

      <label className="field"><span>Qué se hizo</span><input className="input" placeholder="Ej.: cambio de aceite y filtros" {...input('description')} /></label>

      <div className="field-row">
        <label className="field"><span>Fecha</span><input className="input" type="date" {...input('date')} /></label>
        <label className="field"><span>Costo</span><input className="input num" inputMode="numeric" placeholder="$ 0" {...input('cost')} /></label>
      </div>

      <label className="field"><span>Taller o proveedor</span><input className="input" placeholder="Ej.: Lubricentro" {...input('provider')} /></label>

      {work && (
        <div className="sheet-more danger-actions">
          <button type="button" className={`btn btn-sm ${confirmDelete.armed ? 'btn-danger-solid' : 'btn-danger'}`} disabled={busy} onClick={erase}>
            <Icon name="delete" />{remove.isPending ? 'Borrando…' : confirmDelete.armed ? 'Sí, borrar' : 'Borrar trabajo'}
          </button>
          {confirmDelete.armed && !remove.isPending && <span className="sheet-more-note">No se puede deshacer.</span>}
        </div>
      )}
    </Sheet>
  );
}
