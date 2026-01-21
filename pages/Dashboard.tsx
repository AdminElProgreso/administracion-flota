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
  const [stats, setStats] = useState({ total: 0, inWorkshop: 0, alertsCount: 0, monthlyExpenses: 0 });
  const [urgentAlerts, setUrgentAlerts] = useState<any[]>([]);
  const [todayAppts, setTodayAppts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);

  const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long' });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (user && !user.user_metadata?.password_set) {
        setShowPasswordAlert(true);
      }

      // 1. Obtener flota activa
      const { data: fleet } = await supabase.from('vehiculos').select('*').neq('status', 'Baja');

      // 2. Obtener gastos del mes
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data: expensesData } = await supabase.from('mantenimientos').select('cost').gte('date', firstDay).lte('date', lastDay);
      const totalMonthlyExpenses = expensesData?.reduce((acc, curr) => acc + (curr.cost || 0), 0) || 0;

      if (fleet) {
        const checkToday = new Date();
        const todayStr = checkToday.toISOString().split('T')[0];
        const realAlerts: any[] = [];
        const apptsForToday: any[] = [];
        let workshopCount = 0;

        fleet.forEach(v => {
          if (v.status === 'En Taller') workshopCount++;

          // Revisar turnos para hoy
          if (v.vtv_appointment === todayStr) apptsForToday.push({ vehicle: v.model, plate: v.patente, type: 'VTV' });
          if (v.insurance_appointment === todayStr) apptsForToday.push({ vehicle: v.model, plate: v.patente, type: 'Seguro' });
          if (v.patente_appointment === todayStr) apptsForToday.push({ vehicle: v.model, plate: v.patente, type: 'Patente' });

          const checkDoc = (dateStr: string, apptStr: string, type: string) => {
            if (!dateStr) return;
            const expiry = new Date(dateStr);
            const diffDays = Math.ceil((expiry.getTime() - checkToday.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays <= 30 || apptStr) {
              realAlerts.push({
                id: `${v.id}-${type}`,
                type: 'Vencimiento',
                subtype: type,
                vehicle: `${v.model} (${v.patente ? v.patente.toUpperCase() : 'S/P'})`,
                days: diffDays,
                hasAppointment: !!apptStr,
                status: apptStr ? 'appointment' : (diffDays < 0 ? 'expired' : (diffDays <= 15 ? 'warning' : 'info'))
              });
            }
          };

          checkDoc(v.vtv_expiration, v.vtv_appointment, 'VTV');
          checkDoc(v.insurance_expiration, v.insurance_appointment, 'Seguro');
          checkDoc(v.patente_expiration, v.patente_appointment, 'Patente');
        });

        setTodayAppts(apptsForToday);
        setUrgentAlerts(realAlerts.sort((a, b) => a.days - b.days).slice(0, 5));
        setStats({
          total: fleet.length,
          inWorkshop: workshopCount,
          alertsCount: realAlerts.length,
          monthlyExpenses: totalMonthlyExpenses
        });
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-background-dark"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-primary">grid_view</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Panel de Control</h2>
        </div>
        <p className="text-sm text-stone-500 font-medium">Estado real de la flota de El Progreso</p>
      </header>

      {/* Turnos para Hoy */}
      {todayAppts.length > 0 && (
        <div className="mb-6 p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 flex flex-col sm:flex-row items-center gap-4 animate-in slide-in-from-top-4 duration-500">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
            <span className="material-symbols-outlined text-3xl">event_upcoming</span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-blue-400 font-bold">Turnos de Renovación Hoy</h3>
            <p className="text-stone-400 text-sm">
              {todayAppts.map((a, i) => `${a.vehicle} (${a.type})` + (i < todayAppts.length - 1 ? ', ' : ''))}
            </p>
          </div>
          <Link to="/calendar" className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-2 rounded-lg text-sm transition-colors shadow-lg shadow-blue-900/20">Ver Agenda</Link>
        </div>
      )}

      {showPasswordAlert && (
        <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-center gap-4">
          <span className="material-symbols-outlined text-amber-500 text-3xl">lock_open</span>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-amber-500 font-bold">Seguridad de la cuenta</h3>
            <p className="text-stone-400 text-sm">Configurá tu contraseña propia por seguridad.</p>
          </div>
          <Link to="/settings" className="bg-amber-500 text-brand-dark font-bold px-6 py-2 rounded-lg text-sm shadow-lg">Configurar</Link>
        </div>
      )}

      {/* 1. Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard title="Documentación" value={stats.alertsCount} subtext="Pendientes o turnos" icon="notifications_active" colorClass="from-rose-500" borderClass={stats.alertsCount > 0 ? "border-rose-500/30" : "border-brand-border"} />
        <StatCard title="En Taller" value={stats.inWorkshop} subtext="Unidades detenidas" icon="build" colorClass="from-amber-500" borderClass="border-brand-border" />
        <StatCard title="Gasto Mensual" value={new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(stats.monthlyExpenses)} subtext={`Acumulado ${capitalizedMonth}`} icon="payments" colorClass="from-emerald-500" borderClass="border-brand-border" />
        <StatCard title="Flota Total" value={stats.total} subtext="Vehículos operativos" icon="local_shipping" colorClass="from-primary" borderClass="border-brand-border" />
      </div>

      {/* 2. Accesos Rápidos */}
      <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-3 px-1">Accesos Rápidos</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <QuickAction to="/maintenance" icon="handyman" label="Cargar Mantenim." color="bg-blue-600" />
        <QuickAction to="/fleet" icon="add_circle" label="Nueva Unidad" color="bg-primary-dark" />
        <QuickAction to="/calendar" icon="calendar_clock" label="Ver Agenda" color="bg-emerald-600" />
      </div>

      {/* 3. Critical Alerts List */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden flex flex-col shadow-lg">
        <div className="p-4 border-b border-brand-border flex justify-between items-center bg-brand-dark/30">
          <h3 className="text-white font-bold flex items-center gap-2"><span className="material-symbols-outlined text-rose-500">warning</span>Atención Requerida</h3>
          <Link to="/calendar" className="text-xs text-primary hover:underline">Ver Agenda</Link>
        </div>
        <div className="divide-y divide-brand-border">
          {urgentAlerts.length === 0 ? (
            <div className="p-8 text-center text-stone-500"><span className="material-symbols-outlined text-4xl mb-2 opacity-50">check_circle</span><p>Todo en orden</p></div>
          ) : (
            urgentAlerts.map((alert) => (
              <div key={alert.id} className="p-4 flex items-center gap-4 hover:bg-brand-dark/30 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${alert.status === 'appointment' ? 'bg-blue-500/10 text-blue-400' :
                    alert.status === 'expired' ? 'bg-rose-500/10 text-rose-500' :
                      alert.status === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-stone-800 text-stone-500'
                  }`}>
                  <span className="material-symbols-outlined">{alert.subtype === 'Seguro' ? 'security' : alert.subtype === 'VTV' ? 'verified' : 'badge'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{alert.subtype} • {alert.status === 'appointment' ? 'Turno Programado' : alert.type}</p>
                  <p className="text-xs text-stone-400 truncate">{alert.vehicle}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${alert.status === 'appointment' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      alert.status === 'expired' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                        alert.status === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                    {alert.status === 'appointment' ? 'EN PROCESO' : (alert.days < 0 ? `Vencido` : `Faltan ${alert.days} días`)}
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