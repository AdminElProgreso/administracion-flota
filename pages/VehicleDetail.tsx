import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { vehicleDocs, type AlertPrefs, type DocStatus } from '../supabase/functions/_shared/alerts';
import { todayISO } from '../supabase/functions/_shared/dates';
import { WorkItem } from '../components/rows';
import { useSheets } from '../components/sheets/SheetsProvider';
import { useToast } from '../components/Toast';
import { DocBadge, EmptyState, ErrorState, Icon, Loading, Plate, SectionHead, StatusPill } from '../components/ui';
import { useDeleteVehicle, useUpdateVehicle, useVehicles, useWorks } from '../lib/data';
import { docCardText } from '../lib/docCard';
import { DOC_ICONS, STATE_CLASS } from '../lib/docStyles';
import { money, num, orDash } from '../lib/format';
import { loadView } from '../lib/loadView';
import { useAlertPrefs } from '../lib/useAlertPrefs';
import { useConfirmStep } from '../lib/useConfirmStep';
import { deleteAndLeave } from '../lib/deleteFlow';
import { TYPE_INFO } from '../lib/vehicles';
import type { VehicleRow, VehicleStatus } from '../types';

function DocCard({ doc, vehicleId, prefs }: { doc: DocStatus; vehicleId: string; prefs: AlertPrefs }) {
  const { open } = useSheets();
  const text = docCardText(doc, prefs);
  const urgent = doc.state === 'expired' || doc.state === 'expiring' || (doc.state === 'appointment' && doc.daysToAppointment === 0);
  const noDate = doc.state === 'no-date';
  return (
    <article className={`doc card ${STATE_CLASS[doc.state]}`}>
      <header className="doc-head">
        <span className="doc-icon"><Icon name={DOC_ICONS[doc.type]} /></span>
        <h3>{doc.type}</h3>
        <DocBadge doc={doc} />
      </header>
      <p className="doc-when">{text.lead}{text.strong && <> <strong>{text.strong}</strong></>}</p>
      <p className="doc-hint">{text.hint}</p>
      <div className="doc-actions">
        <button type="button" className={`btn btn-sm ${urgent ? 'btn-primary' : 'btn-ghost'}`} onClick={() => open({ kind: 'renew', vehicleId, docType: doc.type })}>
          <Icon name={noDate ? 'edit_calendar' : 'autorenew'} />{noDate ? 'Cargar fecha' : 'Renovar'}
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => open({ kind: 'appointment', vehicleId, docType: doc.type })}>
          <Icon name="event" />{doc.state === 'appointment' ? 'Cambiar turno' : 'Cargar turno'}
        </button>
      </div>
    </article>
  );
}

// Baja in two steps; once de baja, reactivate or delete for good after typing BORRAR
function DangerZone({ vehicle, workCount, onLeaving, onLeft }: {
  vehicle: VehicleRow;
  workCount: number;
  onLeaving: (on: boolean) => void;
  onLeft: () => void;
}) {
  const update = useUpdateVehicle();
  const remove = useDeleteVehicle();
  const toast = useToast();
  const step = useConfirmStep();
  const [word, setWord] = useState('');
  const busy = update.isPending || remove.isPending;
  const onError = (e: Error) => toast(e.message, 'error');

  const setStatus = (status: VehicleStatus, message: string) =>
    update.mutate({ id: vehicle.id, patch: { status } }, { onSuccess: () => { toast(message); step.disarm(); }, onError });

  // This zone unmounts before the deletion ends: deleteAndLeave awaits it instead of relying on mutate callbacks
  const erase = () => void deleteAndLeave(() => remove.mutateAsync(vehicle.id), { setLeaving: onLeaving, toast, leave: onLeft });

  if (vehicle.status !== 'Baja') {
    return (
      <section className="sec card danger">
        <div>
          <h3>Dar de baja la unidad</h3>
          <p>Deja de aparecer en la flota activa y no genera más avisos. El historial se conserva.</p>
        </div>
        <div className="danger-actions">
          {step.armed ? <>
            <button type="button" className="btn btn-ghost btn-sm" onClick={step.disarm}>Cancelar</button>
            <button
              type="button"
              className="btn btn-danger-solid btn-sm"
              disabled={busy}
              onClick={() => { if (step.confirmed()) setStatus('Baja', 'Unidad dada de baja'); }}
            >
              {busy ? 'Guardando…' : 'Sí, dar de baja'}
            </button>
          </> : (
            <button type="button" className="btn btn-danger btn-sm" onClick={step.arm}><Icon name="do_not_disturb_on" />Dar de baja</button>
          )}
        </div>
      </section>
    );
  }

  const confirmed = word.trim().toUpperCase() === 'BORRAR';
  const what = workCount === 0 ? 'la unidad' : workCount === 1 ? 'la unidad y su trabajo' : `la unidad y sus ${workCount} trabajos`;
  return (
    <section className="sec card danger">
      <div>
        <h3>Unidad de baja</h3>
        <p>No aparece en la flota activa ni genera avisos. Podés reactivarla o eliminarla para siempre.</p>
      </div>
      {step.armed ? (
        <div className="danger-confirm">
          <label className="field">
            <span>Vas a borrar {what}. Escribí BORRAR para confirmar.</span>
            <input className="input upper" autoComplete="off" autoCapitalize="characters" value={word} onChange={e => setWord(e.target.value)} />
          </label>
          <div className="danger-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { step.disarm(); setWord(''); }}>Cancelar</button>
            <button type="button" className="btn btn-danger-solid btn-sm" disabled={!confirmed || busy} onClick={erase}>
              {remove.isPending ? 'Eliminando…' : 'Eliminar definitivamente'}
            </button>
          </div>
        </div>
      ) : (
        <div className="danger-actions">
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setStatus('Activo', 'Unidad reactivada')}>
            <Icon name="restart_alt" />{update.isPending ? 'Guardando…' : 'Reactivar'}
          </button>
          <button type="button" className="btn btn-danger btn-sm" onClick={step.arm}><Icon name="delete_forever" />Eliminar definitivamente</button>
        </div>
      )}
    </section>
  );
}

export default function VehicleDetail() {
  const { id } = useParams();
  const location = useLocation();
  const vehicles = useVehicles();
  const works = useWorks();
  const alertPrefs = useAlertPrefs();
  const { open } = useSheets();
  const navigate = useNavigate();
  // Set while the unit is being deleted, so the screen doesn't flash "no encontrado" before leaving
  const [leaving, setLeaving] = useState(false);

  // Coming from the list, going back keeps its filter and search
  const back = (location.state as { back?: string } | null)?.back ?? '/fleet';
  const backLink = <Link className="back" to={back}><Icon name="arrow_back" />Vehículos</Link>;

  const view = loadView(vehicles, works, { data: alertPrefs.loadState === 'ready' ? alertPrefs.prefs : undefined, error: alertPrefs.error });
  if (view === 'error') {
    const retry = () => { void vehicles.refetch(); void works.refetch(); void alertPrefs.refetch(); };
    return <div className="screen">{backLink}<div className="sec"><ErrorState onRetry={retry} /></div></div>;
  }
  if (view === 'loading' || !vehicles.data || !works.data) return <Loading />;

  const v = vehicles.data.find(x => x.id === id);
  if (!v) {
    if (leaving) return <Loading />;
    return (
      <div className="screen">
        {backLink}
        <div className="sec">
          <EmptyState icon="search_off" title="Vehículo no encontrado" text="Puede que lo hayan eliminado.">
            <Link className="btn btn-ghost btn-sm" to="/fleet"><Icon name="directions_car" />Ver vehículos</Link>
          </EmptyState>
        </div>
      </div>
    );
  }

  const info = TYPE_INFO[v.tipo] ?? TYPE_INFO.car;
  const today = todayISO();
  const year = today.slice(0, 4);
  const history = works.data.filter(w => w.vehicle_id === v.id);
  const yearTotal = history.filter(w => w.date.startsWith(year)).reduce((a, w) => a + (w.cost ?? 0), 0);
  const facts: [string, string][] = [
    ['Año', orDash(v.year)],
    [info.unit === 'km' ? 'Kilometraje' : 'Horas de uso', v.odometer === null ? '—' : `${num(v.odometer)} ${info.unit}`],
    ['Encargado', orDash(v.manager)],
    ['Chofer', orDash(v.assigned_driver)],
  ];

  return (
    <div className="screen">
      {backLink}
      <div className="vhead card">
        <div className="vh-main">
          <span className="vtype xl"><Icon name={info.icon} /></span>
          <div className="vh-id">
            <p className="eyebrow">{[info.label, v.section].filter(Boolean).join(' · ')}</p>
            <h1 className="display vh-title">{v.model}</h1>
            <div className="vh-tags"><Plate value={v.patente} large /><StatusPill status={v.status} /></div>
          </div>
        </div>
        <dl className="facts">
          {facts.map(([k, val]) => <div key={k}><dt>{k}</dt><dd>{val}</dd></div>)}
        </dl>
        <div className="vh-actions">
          <button type="button" className="btn btn-primary" onClick={() => open({ kind: 'work', vehicleId: v.id })}><Icon name="add" />Registrar trabajo</button>
          <button type="button" className="btn btn-ghost" onClick={() => open({ kind: 'vehicle', vehicle: v })}><Icon name="edit" />Editar datos</button>
        </div>
      </div>

      {v.tipo !== 'generator' && (
        <section className="sec">
          <SectionHead title="Documentación" />
          {v.status === 'Baja' && <p className="note warn doc-note"><Icon name="notifications_off" />La unidad está de baja: no recibe avisos de vencimiento.</p>}
          <div className="docs">
            {vehicleDocs(v, alertPrefs.prefs, today).map(d => <DocCard key={d.type} doc={d} vehicleId={v.id} prefs={alertPrefs.prefs} />)}
          </div>
        </section>
      )}

      <section className="sec">
        <SectionHead title="Historial técnico">
          {history.length > 0 && <span className="sec-note num">{money(yearTotal)} en {year}</span>}
        </SectionHead>
        {history.length ? (
          <div className="card list">
            {history.map(w => <WorkItem key={w.id} work={w} showVehicle={false} onClick={() => open({ kind: 'work', work: w })} />)}
          </div>
        ) : (
          <EmptyState icon="history" title="Todavía no hay trabajos" text="Registrá el primer mantenimiento o reparación de esta unidad." />
        )}
      </section>

      <DangerZone vehicle={v} workCount={history.length} onLeaving={setLeaving} onLeft={() => navigate('/fleet', { replace: true })} />
    </div>
  );
}
