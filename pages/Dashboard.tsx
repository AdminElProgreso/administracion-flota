import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { attentionList } from '../supabase/functions/_shared/alerts';
import { todayISO } from '../supabase/functions/_shared/dates';
import { AttentionRow, WorkItem } from '../components/rows';
import { useSheets } from '../components/sheets/SheetsProvider';
import { EmptyState, ErrorState, Icon, Kpi, Loading, Plate, SectionHead } from '../components/ui';
import { useVehicles, useWorks } from '../lib/data';
import { MONTHS, greeting, longDate, money } from '../lib/format';
import { attentionSummary, missingDates, nextExpiryLabel, statusLink } from '../lib/home';
import { loadView } from '../lib/loadView';
import { monthlySpend } from '../lib/spend';
import { useAlertPrefs } from '../lib/useAlertPrefs';
import { displayPrefs } from '../lib/display';

// Accounts that came in with an invitation link have no password of their own until they set one
function usePasswordMissing(): boolean {
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) setMissing(Boolean(session && !session.user.user_metadata?.password_set));
    });
    return () => { active = false; };
  }, []);
  return missing;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function Dashboard() {
  const vehicles = useVehicles();
  const works = useWorks();
  const alertPrefs = useAlertPrefs();
  const { open } = useSheets();
  const passwordMissing = usePasswordMissing();

  // The thresholds decide what needs attention: the screen waits for them too
  const prefsQuery = { data: alertPrefs.loadState === 'ready' ? alertPrefs.prefs : undefined, error: alertPrefs.error };
  const view = loadView(vehicles, works, prefsQuery);
  if (view === 'error') {
    const retry = () => { void vehicles.refetch(); void works.refetch(); void alertPrefs.refetch(); };
    return <div className="screen"><div className="sec"><ErrorState onRetry={retry} /></div></div>;
  }
  if (!vehicles.data || !works.data || view === 'loading') return <Loading />;

  const today = todayISO();
  const list = vehicles.data;
  const items = attentionList(list, displayPrefs(alertPrefs.prefs), today);
  const missing = missingDates(list, today);
  const summary = attentionSummary(items, missing);
  const todays = items.filter(i => i.doc.state === 'appointment' && i.doc.daysToAppointment === 0);
  const next = items.find(i => i.doc.state === 'expiring');
  const inFleet = list.filter(v => v.status !== 'Baja').length;
  const operating = list.filter(v => v.status === 'Activo').length;
  const inShop = list.filter(v => v.status === 'En Taller');
  const [month] = monthlySpend(works.data, today, 1);
  const monthName = MONTHS[Number(today.slice(5, 7)) - 1];
  const byId = new Map(list.map(v => [v.id, v]));
  const recent = works.data.slice(0, 4);
  const docKey = (i: (typeof items)[number]) => `${i.vehicle.id}-${i.doc.type}`;

  return (
    <div className="screen">
      <div className="hero">
        <p className="hero-date">{longDate(today)}</p>
        <h1 className="display hero-title">{greeting(new Date())}</h1>
        <Link className="hero-status" to={statusLink(items.length, missing)}>
          <span className="hs-icon"><Icon name={items.length ? 'notifications_active' : missing ? 'edit_calendar' : 'verified'} fill /></span>
          <span className="hs-text"><strong>{summary.title}</strong><small>{summary.detail}</small></span>
          <Icon name="chevron_right" />
        </Link>
      </div>

      <div className="kpis">
        <Kpi icon="directions_car" label="Operativos" value={operating} sub={`de ${inFleet} en la flota`} to="/fleet?filtro=activos" />
        <Kpi icon="build" label="En taller" value={inShop.length} sub={inShop.map(v => v.model).join(', ') || 'Ninguno'} to="/fleet?filtro=taller" />
        <Kpi icon="payments" label={`Gasto de ${monthName}`} value={money(month.total)} sub={plural(month.count, 'trabajo', 'trabajos')} to="/maintenance" />
        <Kpi
          icon="event_upcoming"
          label="Próximo vencimiento"
          value={nextExpiryLabel(next?.doc.daysToExpiration ?? null)}
          sub={next ? `${next.doc.type} · ${next.vehicle.model}` : 'Nada en el plazo'}
          to="/calendar"
        />
      </div>

      {passwordMissing && (
        <div className="banner">
          <Icon name="key" />
          <div><b>Configurá tu contraseña</b><small>Elegí una contraseña propia para entrar a la app.</small></div>
          <Link className="btn btn-primary btn-sm" to="/settings">Configurar</Link>
        </div>
      )}

      <div className="home-grid">
        <div>
          {todays.length > 0 && (
            <section className="sec">
              <SectionHead title="Para hoy" />
              {todays.map(({ vehicle, doc }) => (
                <div key={`${vehicle.id}-${doc.type}`} className="card row today">
                  <span className="row-icon st-appt"><Icon name="event_available" fill /></span>
                  <span className="row-main">
                    <span className="row-title">Turno de {doc.type} hoy</span>
                    <span className="row-sub">{vehicle.model} <Plate value={vehicle.patente} /></span>
                  </span>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => open({ kind: 'renew', vehicleId: vehicle.id, docType: doc.type })}>
                    <Icon name="task_alt" />Registrar renovación
                  </button>
                </div>
              ))}
            </section>
          )}

          <section className="sec">
            <SectionHead title="Necesitan atención">
              <Link className="link" to="/calendar">Ver agenda<Icon name="chevron_right" /></Link>
            </SectionHead>
            {items.length
              ? <div className="card list">{items.map(item => <AttentionRow key={docKey(item)} item={item} />)}</div>
              : missing
                ? (
                  <EmptyState icon="edit_calendar" title="Faltan fechas" text={`${missing} ${missing === 1 ? 'documento no tiene' : 'documentos no tienen'} fecha de vencimiento y no generan avisos.`}>
                    <Link className="btn btn-ghost btn-sm" to="/fleet?filtro=sinfecha"><Icon name="edit_calendar" />Cargar fechas</Link>
                  </EmptyState>
                )
                : <EmptyState icon="check_circle" title="Todo en orden" text="No hay documentos vencidos, por vencer ni turnos." />}
          </section>
        </div>

        <div>
          <section className="sec">
            <SectionHead title="Últimos trabajos">
              <Link className="link" to="/maintenance">Ver todos<Icon name="chevron_right" /></Link>
            </SectionHead>
            {recent.length ? (
              <div className="card list">
                {recent.map(w => <WorkItem key={w.id} work={w} vehicle={byId.get(w.vehicle_id)} onClick={() => open({ kind: 'work', work: w })} />)}
              </div>
            ) : (
              <EmptyState icon="handyman" title="Todavía no hay trabajos" text="Registrá el primer mantenimiento o reparación.">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => open({ kind: 'work' })}><Icon name="add" />Registrar un trabajo</button>
              </EmptyState>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
