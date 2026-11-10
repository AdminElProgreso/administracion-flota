import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { attentionList } from '../supabase/functions/_shared/alerts';
import { todayISO } from '../supabase/functions/_shared/dates';
import { AttentionRow, WorkItem } from '../components/rows';
import { useSheets } from '../components/sheets/SheetsProvider';
import { EmptyState, ErrorState, Icon, Kpi, Loading, Plate, SectionHead } from '../components/ui';
import { useVehicles, useWorks } from '../lib/data';
import { MONTHS } from '../lib/format';
import { attentionSummary, greetingLine, homeKpis, missingDates, statusAction } from '../lib/home';
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
  const action = statusAction(items.length, missing);
  const kpis = homeKpis({
    operating, inFleet, inShop: inShop.map(v => v.model), monthName, monthTotal: month.total, monthCount: month.count,
    next: next && next.doc.daysToExpiration !== null ? { days: next.doc.daysToExpiration, type: next.doc.type, model: next.vehicle.model } : null,
  });
  const docKey = (i: (typeof items)[number]) => `${i.vehicle.id}-${i.doc.type}`;

  return (
    <div className="screen">
      <div className="hero">
        <p className="hero-date">{greetingLine(new Date(), today)}</p>
        <h1 className="display hero-title">{summary.title}</h1>
        <p className="hero-detail">{summary.detail}</p>
        {action && <Link className="btn btn-light hero-action" to={action.to}>{action.label}</Link>}
      </div>

      {passwordMissing && (
        <div className="banner">
          <Icon name="key" />
          <div><b>Configurá tu contraseña</b><small>Elegí una contraseña propia para entrar a la app.</small></div>
          <Link className="btn btn-primary btn-sm" to="/settings">Configurar</Link>
        </div>
      )}

      <div className="home-grid">
        <div className="home-main">
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

        <div className="kpis">
          {kpis.map(k => <Kpi key={k.label} {...k} />)}
        </div>

        <div className="home-recent">
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
