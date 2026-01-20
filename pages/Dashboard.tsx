import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

const StatCard = ({ title, value, subtext, icon, colorClass, borderClass, onClick }: any) => (
  <div className={`bg-brand-surface border ${borderClass} rounded-xl p-5 relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02]`} onClick={onClick}>
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

const QuickAction = ({ to, icon, label, color }: any) => (
  <Link to={to} className="flex flex-col items-center justify-center p-4 bg-brand-surface border border-brand-border rounded-xl hover:bg-stone-800 transition-colors active:scale-95 group">
    <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
      <span className="material-symbols-outlined text-xl text-white">{icon}</span>
    </div>
    <span className="text-xs font-bold text-stone-300 uppercase tracking-wide text-center">{label}</span>
  </Link>
);

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, inWorkshop: 0, alertsCount: 0 });
  const [urgentAlerts, setUrgentAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      // 1. Verificar seguridad
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !user.user_metadata?.password_set) {
        setShowPasswordAlert(true);
      }

      // 2. Obtener vehículos para estadísticas y alertas reales
      const { data: fleet } = await supabase.from('vehiculos').select('*');

      if (fleet) {
        const today = new Date();
        const thirtyDaysOut = new Date();
        thirtyDaysOut.setDate(today.getDate() + 30);

        const realAlerts: any[] = [];
        let workshopCount = 0;

        fleet.forEach(v => {
          if (v.status === 'En Taller') workshopCount++;

          // Lógica de Alertas Reales para la lista
          const checkDoc = (dateStr: string, type: string) => {
            if (!dateStr) return;
            const expiry = new Date(dateStr);
            const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays <= 30) {
              realAlerts.push({
                id: `${v.id}-${type}`,
                type: 'Vencimiento',
                subtype: type,
                vehicle: `${v.model} (${v.patente || 'S/P'})`,
                days: diffDays,
                status: diffDays < 0 ? 'expired' : (diffDays < 7 ? 'warning' : 'info')
              });
            }
          };

          checkDoc(v.vtv_expiration, 'VTV');
          checkDoc(v.insurance_expiration, 'Seguro');
          checkDoc(v.patente_expiration, 'Patente');
        });

        setUrgentAlerts(realAlerts.sort((a, b) => a.days - b.days).slice(0, 5));
        setStats({
          total: fleet.length,
          inWorkshop: workshopCount,
          alertsCount: realAlerts.length
        });
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-background-dark">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-primary">grid_view</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Panel de Control</h2>
        </div>
        <p className="text-sm text-stone-500 font-medium">Estado real de la flota de El Progreso</p>
      </header>

      {/* Alerta de Seguridad */}
      {showPasswordAlert && (
        <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in">
          <span className="material-symbols-outlined text-amber-500 text-3xl">lock_open</span>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-amber-500 font-bold">Seguridad de la cuenta</h3>
            <p className="text-stone-400 text-sm">Todavía no configuraste tu contraseña propia. Por seguridad, hacelo ahora.</p>
          </div>
          <Link to="/settings" className="bg-amber-500 text-brand-dark font-bold px-6 py-2 rounded-lg text-sm shadow-lg shadow-amber-900/20">Configurar Contraseña</Link>
        </div>
      )}

      {/* 1. Stat Cards (Uso de stats reales de Supabase) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard
          title="Documentación"
          value={stats.alertsCount}
          subtext="Vencimientos próximos"
          icon="notifications_active"
          colorClass="from-rose-500"
          borderClass={stats.alertsCount > 0 ? "border-rose-500/30" : "border-brand-border"}
        />
        <StatCard
          title="En Taller"
          value={stats.inWorkshop}
          subtext="Unidades no operativas"
          icon="build"
          colorClass="from-amber-500"
          borderClass="border-brand-border"
        />
        <StatCard
          title="Gasto Mensual"
          value="$0"
          subtext="Conexión Taller pendiente"
          icon="payments"
          colorClass="from-emerald-500"
          borderClass="border-brand-border"
        />
        <StatCard
          title="Flota Total"
          value={stats.total}
          subtext="Vehículos registrados"
          icon="local_shipping"
          colorClass="from-primary"
          borderClass="border-brand-border"
        />
      </div>

      {/* 2. Accesos Rápidos (Restaurados los 4 originales) */}
      <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-3 px-1">Accesos Rápidos</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <QuickAction to="/maintenance" icon="handyman" label="Cargar Mantenim." color="bg-blue-600" />
        <QuickAction to="/fleet" icon="add_circle" label="Nueva Unidad" color="bg-primary-dark" />
        <QuickAction to="/calendar" icon="calendar_clock" label="Ver Agenda" color="bg-emerald-600" />
        <QuickAction to="/team" icon="person_add" label="Personal" color="bg-purple-600" />
      </div>

      {/* 3. Lista de Atención Requerida (Restaurada y con datos reales) */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden flex flex-col shadow-lg">
        <div className="p-4 border-b border-brand-border flex justify-between items-center bg-brand-dark/30">
          <h3 className="text-white font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-500">warning</span>
            Atención Requerida
          </h3>
          <Link to="/calendar" className="text-xs text-primary hover:underline">Ver Calendario</Link>
        </div>
        <div className="divide-y divide-brand-border">
          {urgentAlerts.length === 0 ? (
            <div className="p-8 text-center text-stone-500">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">check_circle</span>
              <p>Todo en orden en la flota</p>
            </div>
          ) : (
            urgentAlerts.map((alert) => (
              <div key={alert.id} className="p-4 flex items-center gap-4 hover:bg-brand-dark/30 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${alert.status === 'expired' ? 'bg-rose-500/10 text-rose-500' :
                    alert.status === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                  }`}>
                  <span className="material-symbols-outlined">
                    {alert.subtype === 'Seguro' ? 'security' : alert.subtype === 'VTV' ? 'verified' : 'badge'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{alert.type} de {alert.subtype}</p>
                  <p className="text-xs text-stone-400 truncate">{alert.vehicle}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${alert.status === 'expired' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      alert.status === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                    }`}>
                    {alert.days < 0 ? `Vencido hace ${Math.abs(alert.days)} días` : `Vence en ${alert.days} días`}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;