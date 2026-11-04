import { useState } from 'react';
import { DOC_COLUMNS, DOC_TYPES, attentionList, docStatus, type DocType } from '../../supabase/functions/_shared/alerts';
import { formatDateLong, todayISO } from '../../supabase/functions/_shared/dates';
import { useUpdateVehicle, useVehicles } from '../../lib/data';
import { appointmentNote, appointmentProposal, dateError, renewProposal, renewedMessage } from '../../lib/docForm';
import { plateText } from '../../lib/format';
import { appointmentPatch, renewPatch } from '../../lib/patches';
import { useAlertPrefs } from '../../lib/useAlertPrefs';
import { Sheet } from '../Sheet';
import { useToast } from '../Toast';
import { EmptyState, Icon, Loading, Plate, Segmented } from '../ui';

type Kind = 'renew' | 'appointment';

const DOC_OPTIONS = DOC_TYPES.map(t => ({ value: t, label: t }));

// Renews a document (new expiration, the appointment is cleared) or books its appointment.
// Without a fixed vehicle and document, it starts on the most urgent one.
export function DocSheet({ kind, vehicleId, docType, onClose }: { kind: Kind; vehicleId?: string; docType?: DocType; onClose: () => void }) {
  const { data: vehicles, error } = useVehicles();
  const { prefs } = useAlertPrefs();
  const update = useUpdateVehicle();
  const toast = useToast();
  const today = todayISO();
  const renew = kind === 'renew';
  const fixed = Boolean(vehicleId && docType);

  // Generators carry no documents and units de baja get no notices
  const options = (vehicles ?? [])
    .filter(v => v.tipo !== 'generator' && v.status !== 'Baja')
    .sort((a, b) => a.model.localeCompare(b.model, 'es'));
  // Renewing fits any pending document; an appointment, one that has none yet
  const urgent = attentionList(options, prefs, today).find(i => renew || i.doc.state !== 'appointment');

  const [selectedId, setSelectedId] = useState(vehicleId ?? urgent?.vehicle.id ?? '');
  const [type, setType] = useState<DocType>(docType ?? urgent?.doc.type ?? 'VTV');
  // null keeps the proposed date, which follows the chosen vehicle and document
  const [date, setDate] = useState<string | null>(null);

  const title = fixed ? (renew ? `Renovar ${type}` : `Turno de ${type}`) : renew ? 'Renovar un documento' : 'Cargar un turno';
  const vehicle = fixed ? vehicles?.find(v => v.id === vehicleId) : options.find(v => v.id === selectedId) ?? options[0];

  if (!vehicles) {
    return (
      <Sheet open onClose={onClose} title={title}>
        {error ? <EmptyState icon="cloud_off" title="No se pudieron cargar los vehículos" text="Revisá la conexión y probá de nuevo." /> : <Loading />}
      </Sheet>
    );
  }
  if (!vehicle) {
    return (
      <Sheet open onClose={onClose} title={title}>
        {fixed
          ? <EmptyState icon="search_off" title="Vehículo no encontrado" text="Puede que lo hayan eliminado." />
          : <EmptyState icon="directions_car" title="No hay vehículos con documentos" text="Los generadores y las unidades de baja no llevan seguro, VTV ni patente." />}
      </Sheet>
    );
  }

  const columns = DOC_COLUMNS[type];
  const doc = docStatus(type, vehicle[columns.expiration], vehicle[columns.appointment], prefs.thresholds[type], today);
  const value = date ?? (renew ? renewProposal(doc.expiration, today) : appointmentProposal(doc.appointment, today));
  const busy = update.isPending;

  const save = (patch: Record<string, string | null>, message: string) =>
    update.mutate({ id: vehicle.id, patch }, {
      onSuccess: () => { toast(message); onClose(); },
      onError: e => toast(e.message, 'error'),
    });

  const submit = () => {
    const problem = dateError(kind, value, today);
    if (problem) { toast(problem, 'error'); return; }
    if (renew) save(renewPatch(type, value), renewedMessage(type, value));
    else save(appointmentPatch(type, value), `Turno cargado para el ${formatDateLong(value)}`);
  };

  const pick = (next: { id?: string; type?: DocType }) => {
    if (next.id !== undefined) setSelectedId(next.id);
    if (next.type !== undefined) setType(next.type);
    setDate(null);
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={title}
      subtitle={fixed && <>{vehicle.model} <Plate value={vehicle.patente} /> · {type}</>}
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={submit}>
          {busy ? 'Guardando…' : renew ? 'Guardar' : 'Guardar turno'}
        </button>
      </>}
    >
      {!fixed && <>
        <label className="field">
          <span>Vehículo</span>
          <select className="input" value={vehicle.id} onChange={e => pick({ id: e.target.value })}>
            {options.map(v => (
              <option key={v.id} value={v.id}>{v.model}{v.patente ? ` · ${plateText(v.patente)}` : ''}</option>
            ))}
          </select>
        </label>
        <div className="field">
          <span>Documento</span>
          <Segmented block value={type} options={DOC_OPTIONS} onChange={t => pick({ type: t })} />
        </div>
      </>}

      <label className="field">
        <span>{renew ? 'Nueva fecha de vencimiento' : 'Fecha del turno'}</span>
        <input className="input" type="date" value={value} min={renew ? undefined : today} onChange={e => setDate(e.target.value)} />
      </label>

      {renew
        ? doc.appointment && <p className="note"><Icon name="info" />Al guardar se borra el turno del {formatDateLong(doc.appointment)}.</p>
        : <p className="note"><Icon name="notifications" />{appointmentNote(prefs.thresholds.appointments, prefs.enabled.appointments)}</p>}

      {!renew && doc.appointment && (
        <div className="sheet-more">
          <button
            type="button"
            className="btn btn-danger btn-sm"
            disabled={busy}
            onClick={() => save(appointmentPatch(type, null), 'Turno quitado: vuelven los avisos de vencimiento')}
          >
            <Icon name="event_busy" />Quitar el turno del {formatDateLong(doc.appointment)}
          </button>
        </div>
      )}
    </Sheet>
  );
}
