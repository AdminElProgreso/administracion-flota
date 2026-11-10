import { useLayoutEffect, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { attentionList } from '../supabase/functions/_shared/alerts';
import { todayISO } from '../supabase/functions/_shared/dates';
import { useVehicles } from '../lib/data';
import { logout } from '../lib/session';
import { useAlertPrefs } from '../lib/useAlertPrefs';
import { displayPrefs } from '../lib/display';
import { ErrorBoundary } from './ErrorBoundary';
import { useSheets } from './sheets/SheetsProvider';
import { useToast } from './Toast';
import { Icon, Logo } from './ui';

const SECTIONS = [
  { to: '/', label: 'Inicio', icon: 'home', end: true },
  { to: '/fleet', label: 'Vehículos', icon: 'directions_car', end: false },
  { to: '/calendar', label: 'Agenda', icon: 'calendar_month', end: false },
  { to: '/maintenance', label: 'Taller', icon: 'build', end: false },
];

const navClass = ({ isActive }: { isActive: boolean }) => `nav-item${isActive ? ' is-active' : ''}`;
const tabClass = ({ isActive }: { isActive: boolean }) => `tab${isActive ? ' is-active' : ''}`;

// Sidebar from 900 px; top bar and bottom tab bar with the "+" button on phones
export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { data: vehicles } = useVehicles();
  const { prefs } = useAlertPrefs();
  const { open } = useSheets();
  const toast = useToast();
  const signOut = () => void logout().then(problem => { if (problem) toast(problem, 'error'); });
  const count = vehicles ? attentionList(vehicles, displayPrefs(prefs), todayISO()).length : 0;

  // The page scrolls the window: every screen starts at the top. A layout effect runs before the passive effects of
  // the screen, so a ficha that scrolls itself to a document is not sent back to the top afterwards
  useLayoutEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  const [home, fleet, agenda, shop] = SECTIONS;
  const tab = (s: (typeof SECTIONS)[number]) => (
    <NavLink to={s.to} end={s.end} className={tabClass}><Icon name={s.icon} />{s.label}</NavLink>
  );

  return (
    <div className="app">
      <aside className="sidebar" aria-label="Navegación">
        <div className="sb-brand"><Logo /><span>Gestión de Flota</span></div>
        {SECTIONS.map(s => (
          <NavLink key={s.to} to={s.to} end={s.end} className={navClass}>
            <Icon name={s.icon} />{s.label}
            {s.to === '/calendar' && count > 0 && <span className="count">{count}</span>}
          </NavLink>
        ))}
        <button type="button" className="sb-new" onClick={() => open({ kind: 'quick' })}><Icon name="add" />Nuevo registro</button>
        <div className="sb-bottom">
          <NavLink to="/settings" className={navClass}><Icon name="settings" />Ajustes</NavLink>
          <button type="button" className="nav-item" onClick={signOut}><Icon name="logout" />Salir</button>
          <p className="sb-coop">Desde 1948 al servicio del productor y la comunidad.</p>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <Logo />
          <span className="spacer" />
          <NavLink to="/calendar" className="icon-btn" aria-label={count ? `Agenda: ${count} avisos` : 'Agenda'}>
            <Icon name="notifications" />
            {count > 0 && <span className="dot">{count}</span>}
          </NavLink>
          <NavLink to="/settings" className="icon-btn" aria-label="Ajustes"><Icon name="settings" /></NavLink>
        </header>
        {/* A new key per screen: after a failure, going to another screen works again */}
        <main><ErrorBoundary key={pathname} inline>{children}</ErrorBoundary></main>
      </div>

      <nav className="tabbar" aria-label="Secciones">
        {tab(home)}
        {tab(fleet)}
        <button type="button" className="fab" aria-label="Nuevo registro" onClick={() => open({ kind: 'quick' })}><Icon name="add" /></button>
        {tab(agenda)}
        {tab(shop)}
      </nav>
    </div>
  );
}
