import { useState } from 'react';
import { DOC_COLUMNS, DOC_TYPES, docStatus, type DocType } from '../../supabase/functions/_shared/alerts';
import { formatDateLong, todayISO } from '../../supabase/functions/_shared/dates';
import { useUpdateVehicle, useVehicles } from '../../lib/data';
import { DOC_OF, appointmentNote, appointmentProposal, currentExpiryNote, dateError, initialDocPick, renewProposal, renewedMessage } from '../../lib/docForm';
import { plateText } from '../../lib/format';
import { appointmentPatch, renewPatch } from '../../lib/patches';
import { useAlertPrefs } from '../../lib/useAlertPrefs';
import { DISPLAY_WINDOW_DAYS, displayPrefs } from '../../lib/display';
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
  // No unit chosen yet: the select asks for one instead of picking the first of the list
  const [start] = useState(() => initialDocPick(options, displayPrefs(prefs), today, kind, vehicleId, docType));
  const [selectedId, setSelectedId] = useState(start.vehicleId);
  const [type, setType] = useState<DocType>(start.type);
  // Empty until typed. Appointments propose a date; a renewal never invents one
  const [date, setDate] = useState<string | null>(null);

  const title = fixed ? (renew ? `Renovar ${type}` : `Turno de ${type}`) : renew ? 'Renovar un documento' : 'Cargar un turno';
  const vehicle = fixed ? vehicles?.find(v => v.id === vehicleId) : options.find(v => v.id === selectedId);

  if (!vehicles) {
    return (
      <Sheet open onClose={onClose} title={title}>
        {error ? <EmptyState icon="cloud_off" title="No se pudieron cargar los vehículos" text="Revisá la conexión y probá de nuevo." /> : <Loading />}
      </Sheet>
    );
  }
  if (fixed ? !vehicle : options.length === 0) {
    return (
      <Sheet open onClose={onClose} title={title}>
        {fixed
          ? <EmptyState icon="search_off" title="Vehículo no encontrado" text="Puede que lo hayan eliminado." />
          : <EmptyState icon="directions_car" title="No hay vehículos con documentos" text="Los generadores y las unidades de baja no llevan seguro, VTV ni patente." />}
      </Sheet>
    );
  }

  const columns = DOC_COLUMNS[type];
  const doc = vehicle ? docStatus(type, vehicle[columns.expiration], vehicle[columns.appointment], DISPLAY_WINDOW_DAYS, today) : null;
  const value = date ?? (renew || !doc ? '' : appointmentProposal(doc.appointment, today));
  const busy = update.isPending;
  // "Cargar fecha" in the ficha: a document without a date gets its first expiration, not a renewal
  const firstTime = renew && !doc?.expiration;
  const sheetTitle = fixed && firstTime ? `Vencimiento ${DOC_OF[type]}` : title;

  const save = (patch: Record<string, string | null>, message: string) =>
    vehicle && update.mutate({ id: vehicle.id, patch }, {
      onSuccess: () => { toast(message); onClose(); },
      onError: e => toast(e.message, 'error'),
    });

  const submit = () => {
    if (!vehicle) return;
    const problem = dateError(kind, value, today);
    if (problem) { toast(problem, 'error'); return; }
    if (renew) save(renewPatch(type, value), renewedMessage(type, value, !firstTime));
    else save(appointmentPatch(type, value), `Turno cargado para el ${formatDateLong(value)}`);
  };

  const pick = (next: { id?: string; type?: DocType }) => {
    if (next.id !== undefined) setSelectedId(next.id);
    if (next.type !== undefined) setType(next.type);
    setDate(null);
  };

  const note = renew && doc ? currentExpiryNote(doc.expiration, today) : null;

  return (
    <Sheet
      open
      onClose={onClose}
      busy={busy}
      title={sheetTitle}
      subtitle={fixed && vehicle && <>{vehicle.model} <Plate value={vehicle.patente} /> · {type}</>}
      footer={<>
        <button type="button" className="btn btn-ghost" disabled={busy} onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-primary" disabled={busy || !vehicle || !value} onClick={submit}>
          {busy ? 'Guardando…' : renew ? 'Guardar' : 'Guardar turno'}
        </button>
      </>}
    >
      {!fixed && <>
        <label className="field">
          <span>Vehículo</span>
          <select className="input" value={vehicle?.id ?? ''} onChange={e => pick({ id: e.target.value })}>
            {!vehicle && <option value="" disabled>Elegí un vehículo</option>}
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

      {vehicle && doc && <>
        <label className="field">
          <span>{renew ? (firstTime ? 'Fecha de vencimiento' : 'Nueva fecha de vencimiento') : 'Fecha del turno'}</span>
          <input className="input" type="date" value={value} min={renew ? undefined : today} onChange={e => setDate(e.target.value)} />
        </label>

        {note && (
          <div className="sheet-more">
            <p className="note"><Icon name="event" />{note}</p>
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setDate(renewProposal(doc.expiration, today))}>
              <Icon name="add" />+1 año
            </button>
          </div>
        )}

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
      </>}
    </Sheet>
  );
}
