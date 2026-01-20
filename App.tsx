import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, Link, Navigate } from 'react-router-dom';
import { supabase } from './supabase'; // Importamos la conexión
import Login from './pages/Login'; // Importamos la nueva pantalla

// Páginas
import Dashboard from './pages/Dashboard';
import Fleet from './pages/Fleet';
import Maintenance from './pages/Maintenance';
import Calendar from './pages/Calendar';
import Team from './pages/Team';
import VehicleDetail from './pages/VehicleDetail';
import Settings from './pages/Settings';

// --- COMPONENTES AUXILIARES (SidebarLink, Layout) ---
// (Mantenemos los mismos componentes visuales que ya tenías, solo cambiamos la lógica principal al final)

const SidebarLink = ({ to, icon, label, exact = false, collapsed = false }: any) => {
  const location = useLocation();
  const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      title={collapsed ? label : ''}
      className={`flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg transition-all group relative overflow-hidden ${isActive
          ? 'bg-brand-surface border border-brand-border text-white'
          : 'hover:bg-brand-surface/50 text-stone-400 hover:text-primary'
        }`}
    >
      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
      <span className={`material-symbols-outlined ${isActive ? 'text-primary' : 'group-hover:text-primary'} transition-colors ${collapsed ? 'text-2xl' : ''}`}>
        {icon}
      </span>
      {!collapsed && (
        <span className="font-medium text-sm whitespace-nowrap transition-opacity duration-300 animate-in fade-in">{label}</span>
      )}
    </Link>
  );
};

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const getMobileLinkClass = (path: string) => {
    const isActive = path === '/' ? location.pathname === path : location.pathname.startsWith(path);
    return `flex flex-col items-center gap-1 transition-colors w-16 ${isActive ? 'text-primary' : 'text-stone-400 hover:text-stone-200'}`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-dark text-stone-200 font-display">
      {/* Sidebar (Desktop) */}
      <aside className={`hidden lg:flex ${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-brand-dark border-r border-brand-border flex-col flex-shrink-0 z-20 transition-all duration-300 ease-in-out`}>
        <div className={`h-[72px] border-b border-brand-border flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-6'} transition-all`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 relative flex-shrink-0 bg-primary/20 rounded flex items-center justify-center text-primary cursor-pointer" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
              <span className="material-symbols-outlined">local_shipping</span>
            </div>
            {!isSidebarCollapsed && (
              <div className="whitespace-nowrap overflow-hidden transition-all duration-300">
                <h1 className="font-bold text-lg leading-none tracking-tight text-white">El Progreso</h1>
                <span className="text-xs text-stone-500 font-mono tracking-widest uppercase">Gestión Flota</span>
              </div>
            )}
          </div>
          {!isSidebarCollapsed && (
            <button onClick={() => setIsSidebarCollapsed(true)} className="text-stone-500 hover:text-white transition-colors">
              <span className="material-symbols-outlined">menu_open</span>
            </button>
          )}
        </div>

        <nav className="flex-1 flex flex-col gap-2 p-3 overflow-y-auto overflow-x-hidden">
          <SidebarLink to="/" icon="grid_view" label="Dashboard" exact collapsed={isSidebarCollapsed} />
          {!isSidebarCollapsed ? (
            <div className="my-2 px-4 text-xs font-bold text-stone-500 uppercase tracking-widest whitespace-nowrap animate-in fade-in">Operaciones</div>
          ) : <div className="my-2 mx-2 h-px bg-brand-border"></div>}

          <SidebarLink to="/fleet" icon="directions_car" label="Flota" collapsed={isSidebarCollapsed} />
          <SidebarLink to="/maintenance" icon="build" label="Mantenimientos" collapsed={isSidebarCollapsed} />
          <SidebarLink to="/calendar" icon="calendar_month" label="Calendario" collapsed={isSidebarCollapsed} />
          <SidebarLink to="/team" icon="groups" label="Equipo" collapsed={isSidebarCollapsed} />

          <div className="mt-auto pt-6 border-t border-brand-border">
            <SidebarLink to="/settings" icon="settings" label="Configuración" collapsed={isSidebarCollapsed} />
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg hover:bg-red-900/20 text-stone-400 hover:text-red-400 transition-all mt-1`}
              title="Cerrar Sesión"
            >
              <span className="material-symbols-outlined">logout</span>
              {!isSidebarCollapsed && <span className="font-medium text-sm">Salir</span>}
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="lg:hidden h-16 border-b border-brand-border bg-brand-dark flex items-center justify-between px-4 z-30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">local_shipping</span>
            <span className="font-bold text-white">El Progreso</span>
          </div>
          <button onClick={handleLogout} className="material-symbols-outlined text-stone-400">logout</button>
        </header>

        <main className="flex-1 overflow-y-auto bg-background-dark relative scroll-smooth p-0 lg:p-0">
          <div className="absolute inset-0 z-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #44403c 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          <div className="relative z-10 h-full">
            {children}
          </div>
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-brand-dark/95 backdrop-blur-md border-t border-brand-border flex justify-between items-center px-2 pb-safe pt-2 h-[72px]">
          <Link to="/" className={getMobileLinkClass('/')}><span className="material-symbols-outlined">grid_view</span><span className="text-[10px] font-medium">Dash</span></Link>
          <Link to="/fleet" className={getMobileLinkClass('/fleet')}><span className="material-symbols-outlined">directions_car</span><span className="text-[10px] font-medium">Flota</span></Link>
          <Link to="/maintenance" className={getMobileLinkClass('/maintenance')}><span className="material-symbols-outlined">build</span><span className="text-[10px] font-medium">Taller</span></Link>
          <Link to="/calendar" className={getMobileLinkClass('/calendar')}><span className="material-symbols-outlined">calendar_month</span><span className="text-[10px] font-medium">Agenda</span></Link>
          <Link to="/team" className={getMobileLinkClass('/team')}><span className="material-symbols-outlined">groups</span><span className="text-[10px] font-medium">Equipo</span></Link>
        </nav>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL CON LÓGICA DE SEGURIDAD ---
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verificar sesión al inicio
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Escuchar cambios (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0c0a09] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-500 text-sm animate-pulse">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        {/* Si no hay sesión, mostramos Login */}
        {!session ? (
          <Route path="*" element={<Login />} />
        ) : (
          /* Si hay sesión, mostramos la App protegida */
          <Route path="/" element={<Layout><Dashboard /></Layout>} />
        )}

        {/* Rutas protegidas adicionales (Solo accesibles si hay sesión) */}
        {session && (
          <>
            <Route path="/fleet" element={<Layout><Fleet /></Layout>} />
            <Route path="/fleet/:id" element={<Layout><VehicleDetail /></Layout>} />
            <Route path="/maintenance" element={<Layout><Maintenance /></Layout>} />
            <Route path="/calendar" element={<Layout><Calendar /></Layout>} />
            <Route path="/team" element={<Layout><Team /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
          </>
        )}
      </Routes>
    </HashRouter>
  );
}