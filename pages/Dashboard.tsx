import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

const StatCard = ({ title, value, subtext, icon, colorClass, borderClass }: any) => (
  <div className={`bg-brand-surface border ${borderClass} rounded-xl p-5 relative overflow-hidden group transition-all hover:scale-[1.02]`}>
    <div className={`absolute right-0 top-0 w-20 h-20 bg-gradient-to-br ${colorClass} to-transparent rounded-bl-full -mr-4 -mt-4 opacity-10`}></div>
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-lg bg-brand-dark border border-brand-border ${colorClass.replace('from-', 'text-')}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
    </div>
    <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest">{title}</h3>
    <p className="text-[10px] text-stone-500 mt-1">{subtext}</p>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, inWorkshop: 0, alerts: 0 });
  const [loading, setLoading] = useState(true);
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      // 1. Verificar si el usuario configuró su contraseña
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !user.user_metadata?.password_set) {
        setShowPasswordAlert(true);
      }

      // 2. Obtener estadísticas de la flota
      const { data: fleet, error } = await supabase.from('vehiculos').select('status, vtv_expiration, insurance_expiration');

      if (fleet) {
        const total = fleet.length;
        const workshop = fleet.filter(v => v.status === 'En Taller').length;

        // Contar vencimientos próximos (menos de 15 días)
        const today = new Date();
        const fifteenDaysOut = new Date();
        fifteenDaysOut.setDate(today.getDate() + 15);

        const critical = fleet.filter(v => {
          const vtv = v.vtv_expiration ? new Date(v.vtv_expiration) : null;
          const ins = v.insurance_expiration ? new Date(v.insurance_expiration) : null;
          return (vtv && vtv < fifteenDaysOut) || (ins && ins < fifteenDaysOut);
        }).length;

        setStats({ total, inWorkshop: workshop, alerts: critical });
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-background-dark"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-4 md:p-6 pb-20">
      <header className="mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">grid_view</span> Panel de Control
        </h2>
        <p className="text-sm text-stone-500 font-medium">Estado real de la flota de El Progreso</p>
      </header>

      {/* Alerta de Seguridad */}
      {showPasswordAlert && (
        <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in">
          <span className="material-symbols-outlined text-amber-500 text-3xl">lock_open</span>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-amber-500 font-bold">Seguridad pendiente</h3>
            <p className="text-stone-400 text-sm">Establecé tu contraseña en Configuración para asegurar tu acceso.</p>
          </div>
          <Link to="/settings" className="bg-amber-500 text-brand-dark font-bold px-6 py-2 rounded-lg text-sm">Configurar</Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Vencimientos"
          value={stats.alerts}
          subtext="Próximos 15 días"
          icon="notifications_active"
          colorClass="from-rose-500"
          borderClass={stats.alerts > 0 ? "border-rose-500/40" : "border-brand-border"}
        />
        <StatCard
          title="En Taller"
          value={stats.inWorkshop}
          subtext="Unidades detenidas"
          icon="build"
          colorClass="from-amber-500"
          borderClass="border-brand-border"
        />
        <StatCard
          title="Flota Total"
          value={stats.total}
          subtext="Unidades registradas"
          icon="local_shipping"
          colorClass="from-primary"
          borderClass="border-brand-border"
        />
        <StatCard
          title="Gastos (Mes)"
          value="$0"
          subtext="Pendiente conexión Taller"
          icon="payments"
          colorClass="from-emerald-500"
          borderClass="border-brand-border"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/maintenance" className="flex flex-col items-center justify-center p-4 bg-brand-surface border border-brand-border rounded-xl hover:bg-stone-800 transition-all group">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-white">handyman</span>
          </div>
          <span className="text-[10px] font-bold text-stone-300 uppercase">Cargar Taller</span>
        </Link>
        <Link to="/fleet" className="flex flex-col items-center justify-center p-4 bg-brand-surface border border-brand-border rounded-xl hover:bg-stone-800 transition-all group">
          <div className="w-12 h-12 rounded-full bg-primary-dark flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-white">add_circle</span>
          </div>
          <span className="text-[10px] font-bold text-stone-300 uppercase">Nueva Unidad</span>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;