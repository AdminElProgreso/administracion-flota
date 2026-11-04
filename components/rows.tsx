import { Link } from 'react-router-dom';
import type { AttentionItem } from '../supabase/functions/_shared/alerts';
import { todayISO } from '../supabase/functions/_shared/dates';
import { agendaWhen, eventDays, eventTitle, eventTone, type AgendaEvent } from '../lib/agenda';
import { DOC_ICONS, STATE_CLASS, docTitle } from '../lib/docStyles';
import { MONTHS_SHORT, money, shortDate } from '../lib/format';
import type { VehicleRow, WorkRow } from '../types';
import { DocBadge, Icon, Plate } from './ui';

export function AttentionRow({ item }: { item: AttentionItem }) {
  const { vehicle, doc } = item;
  return (
    <Link className="row" to={`/fleet/${vehicle.id}`}>
      <span className={`row-icon ${STATE_CLASS[doc.state]}`}><Icon name={DOC_ICONS[doc.type]} /></span>
      <span className="row-main">
        <span className="row-title">{docTitle(doc)}</span>
        <span className="row-sub">{vehicle.model} <Plate value={vehicle.patente} /></span>
      </span>
      <DocBadge doc={doc} />
    </Link>
  );
}

export function WorkItem({ work, vehicle, showVehicle = true, onClick }: { work: WorkRow; vehicle?: VehicleRow; showVehicle?: boolean; onClick: () => void }) {
  const repair = work.type === 'Reparación';
  const sub = [showVehicle ? (vehicle?.model ?? 'Unidad eliminada') : null, shortDate(work.date, todayISO()), work.provider].filter(Boolean).join(' · ');
  return (
    <button type="button" className="row" onClick={onClick}>
      <span className={`row-icon ${repair ? 'tone-orange' : 'tone-green'}`}><Icon name={repair ? 'car_repair' : 'handyman'} /></span>
      <span className="row-main">
        <span className="row-title">{work.description || work.type}</span>
        <span className="row-sub">{sub}</span>
      </span>
      <span className="row-money num">{money(work.cost ?? 0)}</span>
    </button>
  );
}

export function EventRow({ event }: { event: AgendaEvent }) {
  const tone = eventTone(event);
  const [, month, day] = event.date.split('-').map(Number);
  return (
    <Link className="row" to={`/fleet/${event.vehicle.id}`}>
      <span className={`ev-date ${tone}`}><b className="display">{day}</b><span>{MONTHS_SHORT[month - 1]}</span></span>
      <span className="row-main">
        <span className="row-title">{eventTitle(event)}</span>
        <span className="row-sub">{event.vehicle.model} <Plate value={event.vehicle.patente} /></span>
      </span>
      <span className={`badge ${tone}`}>{agendaWhen(eventDays(event))}</span>
    </Link>
  );
}
