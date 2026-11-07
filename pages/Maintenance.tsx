import { useState } from 'react';
import { todayISO } from '../supabase/functions/_shared/dates';
import { WorkItem } from '../components/rows';
import { useSheets } from '../components/sheets/SheetsProvider';
import { Chip, EmptyState, ErrorState, Icon, Loading, PageHead } from '../components/ui';
import { groupByMonth } from '../lib/agenda';
import { useVehicles, useWorks } from '../lib/data';
import { MONTHS, cap, money } from '../lib/format';
import { loadView } from '../lib/loadView';
import { averageSpend, barPercent, monthlySpend } from '../lib/spend';
import type { WorkType } from '../types';

type WorkFilter = 'todos' | WorkType;

const FILTERS: { value: WorkFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'Mantenimiento', label: 'Mantenimiento' },
  { value: 'Reparación', label: 'Reparación' },
];

const total = (works: { cost: number | null }[]) => works.reduce((a, w) => a + (w.cost ?? 0), 0);
const plural = (n: number) => `${n} ${n === 1 ? 'trabajo' : 'trabajos'}`;

export default function Maintenance() {
  const works = useWorks();
  const vehicles = useVehicles();
  const { open } = useSheets();
  const [filter, setFilter] = useState<WorkFilter>('todos');

  const register = <button type="button" className="btn btn-primary btn-sm" onClick={() => open({ kind: 'work' })}><Icon name="add" />Registrar</button>;
  const head = <PageHead title="Taller" action={register} />;

  const view = loadView(works, vehicles);
  if (view === 'error') {
    const retry = () => { void works.refetch(); void vehicles.refetch(); };
    return <div className="screen">{head}<div className="sec"><ErrorState onRetry={retry} /></div></div>;
  }
  if (view === 'loading' || !works.data || !vehicles.data) return <div className="screen">{head}<Loading /></div>;

  const today = todayISO();
  const months = monthlySpend(works.data, today);
  const current = months[months.length - 1];
  const max = Math.max(...months.map(m => m.total));
  const byId = new Map(vehicles.data.map(v => [v.id, v]));
  const shown = filter === 'todos' ? works.data : works.data.filter(w => w.type === filter);

  let list;
  if (!works.data.length) {
    list = (
      <EmptyState icon="handyman" title="Todavía no hay trabajos" text="Registrá el primer mantenimiento o reparación.">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => open({ kind: 'work' })}><Icon name="add" />Registrar un trabajo</button>
      </EmptyState>
    );
  } else if (!shown.length) {
    list = <EmptyState icon="handyman" title="Sin trabajos" text="Todavía no hay registros con este filtro." />;
  } else {
    list = groupByMonth(shown).map(g => (
      <div key={g.key} className="group">
        <div className="group-head">{cap(MONTHS[g.month - 1])} {g.year}<span className="total num">{money(total(g.items))}</span></div>
        <div className="card list">
          {g.items.map(w => <WorkItem key={w.id} work={w} vehicle={byId.get(w.vehicle_id)} onClick={() => open({ kind: 'work', work: w })} />)}
        </div>
      </div>
    ));
  }

  return (
    <div className="screen">
      {head}
      <div className="spend card">
        <div>
          <p className="eyebrow">Gasto de {MONTHS[Number(today.slice(5, 7)) - 1]}</p>
          <div className="display spend-value num">{money(current.total)}</div>
          <p className="spend-sub">{plural(current.count)} · promedio de los últimos 6 meses {money(averageSpend(months))}</p>
        </div>
        <div className="bars" role="list" aria-label="Gasto por mes">
          {months.map(m => (
            <div key={m.key} role="listitem" className={`bar${m.key === current.key ? ' is-cur' : ''}`} title={money(m.total)} aria-label={`${m.label}: ${money(m.total)}`}>
              <span style={{ height: `${barPercent(m.total, max)}%` }} />
              <small>{m.label}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="taller-tools">
        <div className="chips" role="group" aria-label="Filtrar por tipo">
          {FILTERS.map(f => <Chip key={f.value} pressed={filter === f.value} onClick={() => setFilter(f.value)}>{f.label}</Chip>)}
        </div>
      </div>
      <div className="taller-list">{list}</div>
    </div>
  );
}
