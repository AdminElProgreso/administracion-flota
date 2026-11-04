import { useState } from 'react';
import { todayISO } from '../supabase/functions/_shared/dates';
import { EventRow } from '../components/rows';
import { EmptyState, ErrorState, Icon, Loading, PageHead, Segmented } from '../components/ui';
import { agendaEvents, eventTone, eventsByDay, groupByMonth, monthCells, type AgendaEvent } from '../lib/agenda';
import { useVehicles } from '../lib/data';
import { MONTHS, cap } from '../lib/format';
import { loadView } from '../lib/loadView';
import { useAlertPrefs } from '../lib/useAlertPrefs';

type AgendaView = 'lista' | 'mes';

const VIEW_OPTIONS: { value: AgendaView; label: string; icon: string }[] = [
  { value: 'lista', label: 'Lista', icon: 'view_agenda' },
  { value: 'mes', label: 'Mes', icon: 'calendar_month' },
];
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const LEGEND: [string, string][] = [['st-bad', 'Vencido'], ['st-warn', 'Por vencer'], ['st-appt', 'Turno'], ['st-ok', 'Al día']];

const eventKey = (e: AgendaEvent) => `${e.vehicle.id}-${e.doc.type}-${e.kind}`;
const rows = (events: AgendaEvent[]) => <div className="card list">{events.map(e => <EventRow key={eventKey(e)} event={e} />)}</div>;

export default function Calendar() {
  const vehicles = useVehicles();
  const alertPrefs = useAlertPrefs();
  const today = todayISO();
  const [ty, tm, td] = today.split('-').map(Number);
  // On phones one view at a time; from 900 px both side by side (the switch hides)
  const [view, setView] = useState<AgendaView>('lista');
  const [[year, month], setMonth] = useState<[number, number]>([ty, tm]);
  const [day, setDay] = useState(td);

  const head = (
    <PageHead
      eyebrow="Vencimientos y turnos"
      title="Agenda"
      action={<Segmented<AgendaView> className="seg-sm agenda-switch" value={view} options={VIEW_OPTIONS} onChange={setView} />}
    />
  );

  const state = loadView(vehicles, { data: alertPrefs.loadState === 'ready' ? alertPrefs.prefs : undefined, error: alertPrefs.error });
  if (state === 'error') {
    const retry = () => { void vehicles.refetch(); void alertPrefs.refetch(); };
    return <div className="screen">{head}<div className="sec"><ErrorState onRetry={retry} /></div></div>;
  }
  if (state === 'loading' || !vehicles.data) return <div className="screen">{head}<Loading /></div>;

  const { overdue, upcoming } = agendaEvents(vehicles.data, alertPrefs.prefs, today);
  const byDay = eventsByDay([...overdue, ...upcoming], year, month);
  const selected = byDay.get(day) ?? [];
  const isCurrentMonth = year === ty && month === tm;

  // Back on the current month the selection returns to today; any other month starts on the 1st
  const moveMonth = (delta: number) => {
    const d = new Date(Date.UTC(year, month - 1 + delta, 1));
    const [y, m] = [d.getUTCFullYear(), d.getUTCMonth() + 1];
    setMonth([y, m]);
    setDay(y === ty && m === tm ? td : 1);
  };

  const list = overdue.length || upcoming.length ? <>
    {overdue.length > 0 && (
      <div className="group">
        <div className="group-head st-bad"><Icon name="error" />Vencidos</div>
        {rows(overdue)}
      </div>
    )}
    {groupByMonth(upcoming).map(g => (
      <div key={g.key} className="group">
        <div className="group-head">{cap(MONTHS[g.month - 1])} {g.year}</div>
        {rows(g.items)}
      </div>
    ))}
  </> : <EmptyState icon="event_available" title="Nada en la agenda" text="Cargá las fechas de vencimiento de cada vehículo." />;

  return (
    <div className="screen">
      {head}
      <div className={`agenda-grid view-${view}`}>
        <div className="agenda-list">{list}</div>
        <div className="agenda-month">
          <div className="card month">
            <div className="month-head">
              <button type="button" className="icon-btn" aria-label="Mes anterior" onClick={() => moveMonth(-1)}><Icon name="chevron_left" /></button>
              <b>{cap(MONTHS[month - 1])} {year}</b>
              <button type="button" className="icon-btn" aria-label="Mes siguiente" onClick={() => moveMonth(1)}><Icon name="chevron_right" /></button>
            </div>
            <div className="dow" aria-hidden="true">{WEEKDAYS.map(w => <span key={w}>{w}</span>)}</div>
            <div className="days">
              {monthCells(year, month).map((d, i) => {
                if (d === null) return <span key={`pad-${i}`} />;
                const events = byDay.get(d) ?? [];
                const cls = ['day', isCurrentMonth && d === td ? 'is-today' : '', d === day ? 'is-sel' : ''].filter(Boolean).join(' ');
                const label = `${d} de ${MONTHS[month - 1]}${events.length ? `, ${events.length} ${events.length === 1 ? 'evento' : 'eventos'}` : ''}`;
                return (
                  <button key={d} type="button" className={cls} aria-label={label} aria-pressed={d === day} onClick={() => setDay(d)}>
                    {d}
                    <span className="dots">{events.slice(0, 3).map(e => <i key={eventKey(e)} className={eventTone(e)} />)}</span>
                  </button>
                );
              })}
            </div>
            <div className="legend">{LEGEND.map(([cls, text]) => <span key={cls}><i className={cls} />{text}</span>)}</div>
          </div>
          <div className="day-list">
            <h3>{day} de {MONTHS[month - 1]}</h3>
            {selected.length ? rows(selected) : (
              <div className="card empty"><Icon name="event_available" /><p>Sin vencimientos ni turnos este día.</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
