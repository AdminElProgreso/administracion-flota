import { Link, useSearchParams } from 'react-router-dom';
import { vehicleDocs, type AlertPrefs } from '../supabase/functions/_shared/alerts';
import { todayISO } from '../supabase/functions/_shared/dates';
import { useSheets } from '../components/sheets/SheetsProvider';
import { Chip, EmptyState, ErrorState, Icon, Loading, PageHead, Plate, StatusPill } from '../components/ui';
import { useVehicles } from '../lib/data';
import { STATE_CLASS, docLabel } from '../lib/docStyles';
import { num } from '../lib/format';
import { loadView } from '../lib/loadView';
import { useAlertPrefs } from '../lib/useAlertPrefs';
import { TYPE_INFO, countByFilter, filterVehicles, type VehicleFilter } from '../lib/vehicles';
import type { VehicleRow } from '../types';

const FILTERS: { value: VehicleFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'activos', label: 'Activos' },
  { value: 'taller', label: 'En taller' },
  { value: 'baja', label: 'De baja' },
];

function VehicleCard({ v, prefs, today }: { v: VehicleRow; prefs: AlertPrefs; today: string }) {
  const info = TYPE_INFO[v.tipo] ?? TYPE_INFO.car;
  const meta = [v.year, v.section].filter(Boolean);
  let docs;
  if (v.tipo === 'generator') {
    docs = <div className="vc-nodocs"><Icon name="info" />No lleva seguro, VTV ni patente</div>;
  } else if (v.status === 'Baja') {
    docs = <div className="vc-nodocs"><Icon name="notifications_off" />De baja: no recibe avisos de vencimiento</div>;
  } else {
    docs = (
      <div className="vc-docs">
        {vehicleDocs(v, prefs, today).map(d => (
          <div key={d.type} className={`vdoc ${STATE_CLASS[d.state]}`}>
            <span className="vdoc-name">{d.type}</span>
            <span className="vdoc-state">{docLabel(d)}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <Link className="vcard card" to={`/fleet/${v.id}`}>
      <div className="vc-top">
        <span className="vtype"><Icon name={info.icon} /></span>
        <div className="vc-id">
          <div className="vc-name">{v.model}</div>
          <div className="vc-meta">
            <Plate value={v.patente} />
            {/* One piece, so on a narrow card year and section wrap together */}
            {meta.length > 0 && <span>{meta.join(' · ')}</span>}
          </div>
        </div>
        <StatusPill status={v.status} />
      </div>
      {docs}
      <div className="vc-foot">
        <span><Icon name={info.unit === 'km' ? 'speed' : 'schedule'} />{v.odometer === null ? '—' : `${num(v.odometer)} ${info.unit}`}</span>
        <span><Icon name="person" />{v.assigned_driver || 'Sin chofer'}</span>
      </div>
    </Link>
  );
}

export default function Fleet() {
  const vehicles = useVehicles();
  const alertPrefs = useAlertPrefs();
  const { open } = useSheets();
  // Filter and search live in the address, so coming back from a ficha keeps them
  const [params, setParams] = useSearchParams();
  const filter = FILTERS.find(f => f.value === params.get('filtro'))?.value ?? 'todos';
  const query = params.get('q') ?? '';

  const change = (next: { filtro?: VehicleFilter; q?: string }) => {
    const p = new URLSearchParams(params);
    if (next.filtro !== undefined) {
      if (next.filtro === 'todos') p.delete('filtro');
      else p.set('filtro', next.filtro);
    }
    if (next.q !== undefined) {
      if (next.q) p.set('q', next.q);
      else p.delete('q');
    }
    setParams(p, { replace: true });
  };

  const add = <button type="button" className="btn btn-primary btn-sm" onClick={() => open({ kind: 'vehicle' })}><Icon name="add" />Agregar</button>;
  const head = <PageHead eyebrow="Flota de la Cooperativa" title="Vehículos" action={add} />;

  const view = loadView(vehicles, { data: alertPrefs.loadState === 'ready' ? alertPrefs.prefs : undefined, error: alertPrefs.error });
  if (view === 'error') {
    const retry = () => { void vehicles.refetch(); void alertPrefs.refetch(); };
    return <div className="screen">{head}<div className="sec"><ErrorState onRetry={retry} /></div></div>;
  }
  if (view === 'loading' || !vehicles.data) return <div className="screen">{head}<Loading /></div>;

  const list = vehicles.data;
  const counts = countByFilter(list);
  const found = filterVehicles(list, filter, query);
  const today = todayISO();

  let body;
  if (!list.length) {
    body = (
      <EmptyState icon="directions_car" title="Todavía no hay vehículos" text="Agregá el primero para seguir sus vencimientos.">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => open({ kind: 'vehicle' })}><Icon name="add" />Agregar un vehículo</button>
      </EmptyState>
    );
  } else if (!found.length && !query.trim()) {
    body = <EmptyState icon="directions_car" title={`No hay vehículos ${FILTERS.find(f => f.value === filter)?.label.toLowerCase()}`} />;
  } else if (!found.length) {
    body = <EmptyState icon="search_off" title="Sin resultados" text="Probá con otra patente, modelo o chofer." />;
  } else {
    body = found.map(v => <VehicleCard key={v.id} v={v} prefs={alertPrefs.prefs} today={today} />);
  }

  return (
    <div className="screen">
      {head}
      <div className="tools">
        <label className="search">
          <Icon name="search" />
          <input
            type="search"
            placeholder="Buscar por patente, modelo o chofer"
            aria-label="Buscar vehículos"
            autoComplete="off"
            value={query}
            onChange={e => change({ q: e.target.value })}
          />
        </label>
        <div className="chips" role="group" aria-label="Filtrar por estado">
          {FILTERS.map(f => (
            <Chip key={f.value} pressed={filter === f.value} count={counts[f.value]} onClick={() => change({ filtro: f.value })}>{f.label}</Chip>
          ))}
        </div>
      </div>
      <div className="vgrid">{body}</div>
    </div>
  );
}
