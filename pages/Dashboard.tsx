import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

// Función auxiliar para corregir el desfase de fecha UTC
const formatLocalDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString();
};

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

  // ESTADO PARA EL MODAL DE RENOVACIÓN RÁPIDA
  const [renewalModal, setRenewalModal] = useState<{
    isOpen: boolean;
    vehicle: any;
    type: string;
    currentExpiry: string
  } | null>(null);

  const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long' });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  const fetchDashboardData = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user && !user.user_metadata?.password_set) {
      setShowPasswordAlert(true);
    }

    const { data: fleet } = await supabase.from('vehiculos').select('*').neq('status', 'Baja');

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: expensesData } = await supabase.from('mantenimientos')
      .select('cost')
      .gte('date', firstDay)
      .lte('date', lastDay);

    const totalMonthlyExpenses = expensesData?.reduce((acc, curr) => acc + (curr.cost || 0), 0) || 0;

    if (fleet) {
      const todayLocal = new Date();
      const offset = todayLocal.getTimezoneOffset();
      const todayStr = new Date(todayLocal.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];

      const realAlerts: any[] = [];
      const apptsForToday: any[] = [];
      let workshopCount = 0;

      fleet.forEach(v => {
        if (v.status === 'En Taller') workshopCount++;

        // Detectar turnos para hoy
        const checkAppt = (apptStr: string, expiryStr: string, type: string) => {
          if (apptStr === todayStr) {
            apptsForToday.push({
              id: v.id,
              vehicle: v.model,
              plate: v.patente,
              type,
              currentExpiry: expiryStr,
              fullData: v
            });
          }
        };

        checkAppt(v.vtv_appointment, v.vtv_expiration, 'VTV');
        checkAppt(v.insurance_appointment, v.insurance_expiration, 'Seguro');
        checkAppt(v.patente_appointment, v.patente_expiration, 'Patente');

        const checkDoc = (dateStr: string, apptStr: string, type: string) => {
          if (!dateStr && !apptStr) return;
          let diffDays = 999;
          if (dateStr) {
            const expiry = new Date(dateStr + 'T00:00:00');
            diffDays = Math.ceil((expiry.getTime() - todayLocal.getTime()) / (1000 * 60 * 60 * 24));
          }

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // LÓGICA PARA ACTUALIZAR VENCIMIENTO Y BORRAR TURNO
  const handleConfirmRenewal = async (newDate: string) => {
    if (!renewalModal || !newDate) return;

    const columnMap: any = {
      'VTV': { exp: 'vtv_expiration', appt: 'vtv_appointment' },
      'Seguro': { exp: 'insurance_expiration', appt: 'insurance_appointment' },
      'Patente': { exp: 'patente_expiration', appt: 'patente_appointment' }
    };

    const fields = columnMap[renewalModal.type];

    const { error } = await supabase
      .from('vehiculos')
      .update({
        [fields.exp]: newDate,
        [fields.appt]: null // Elimina el turno automáticamente
      })
      .eq('id', renewalModal.vehicle.id);

    if (error) {
      alert("Error al actualizar: " + error.message);
    } else {
      setRenewalModal(null);
      fetchDashboardData();
    }
  };

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

      {/* Notificación de Turnos para Hoy con Acción de Modal */}
      {todayAppts.length > 0 && (
        <div className="mb-6 space-y-3">
          {todayAppts.map((appt, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 flex flex-col sm:flex-row items-center gap-4 animate-in slide-in-from-top-4 duration-500">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <span className="material-symbols-outlined text-3xl">notification_important</span>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-blue-400 font-bold">¡Turno hoy! - {appt.type}</h3>
                <p className="text-stone-400 text-sm">
                  {appt.vehicle} ({appt.plate?.toUpperCase()}) tiene un turno para renovar {appt.type} el día de hoy.
                </p>
              </div>
              <button
                onClick={() => setRenewalModal({ isOpen: true, vehicle: appt.fullData, type: appt.type, currentExpiry: appt.currentExpiry })}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-2 rounded-lg text-sm transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">edit_calendar</span>
                Renovar Ahora
              </button>
            </div>
          ))}
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

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard title="Documentación" value={stats.alertsCount} subtext="Pendientes o turnos" icon="notifications_active" colorClass="from-rose-500" borderClass={stats.alertsCount > 0 ? "border-rose-500/30" : "border-brand-border"} />
        <StatCard title="En Taller" value={stats.inWorkshop} subtext="Unidades detenidas" icon="build" colorClass="from-amber-500" borderClass="border-brand-border" />
        <StatCard title="Gasto Mensual" value={new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(stats.monthlyExpenses)} subtext={`Acumulado ${capitalizedMonth}`} icon="payments" colorClass="from-emerald-500" borderClass="border-brand-border" />
        <StatCard title="Flota Total" value={stats.total} subtext="Vehículos operativos" icon="local_shipping" colorClass="from-primary" borderClass="border-brand-border" />
      </div>

      <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-3 px-1">Accesos Rápidos</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <QuickAction to="/maintenance" icon="handyman" label="Cargar Mantenim." color="bg-blue-600" />
        <QuickAction to="/fleet" icon="add_circle" label="Nueva Unidad" color="bg-primary-dark" />
        <QuickAction to="/calendar" icon="calendar_clock" label="Ver Agenda" color="bg-emerald-600" />
      </div>

      {/* Critical Alerts List */}
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
                  <p className="text-sm font-bold text-white truncate">{alert.subtype} • {alert.status === 'appointment' ? 'Turno Programado' : (alert.days < 0 ? 'Vencido' : 'Vence pronto')}</p>
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

      {/* MODAL DE RENOVACIÓN DESDE DASHBOARD (DISEÑO CALENDARIO) */}
      {renewalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setRenewalModal(null)}>
          <div className="bg-brand-surface border border-brand-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="h-2 w-full bg-blue-500"></div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                    <span className="material-symbols-outlined text-2xl">autorenew</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white leading-tight">Renovar {renewalModal.type}</h3>
                    <p className="text-stone-400 text-sm">Gestión de turno hoy</p>
                  </div>
                </div>
                <button onClick={() => setRenewalModal(null)} className="text-stone-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-brand-dark rounded-lg p-4 border border-brand-border">
                  <div className="flex justify-between mb-3">
                    <div>
                      <p className="text-[10px] text-stone-500 uppercase font-bold mb-1">Unidad</p>
                      <p className="text-white font-bold text-sm">{renewalModal.vehicle.model}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-stone-500 uppercase font-bold mb-1">Patente</p>
                      <p className="text-primary font-mono text-xs bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">{renewalModal.vehicle.patente?.toUpperCase() || 'S/P'}</p>
                    </div>
                  </div>
                  <div className="h-px bg-brand-border my-2"></div>
                  <div>
                    <p className="text-[10px] text-stone-500 uppercase font-bold mb-1">Vencimiento Actual (Lectura)</p>
                    <p className="text-stone-400 text-sm font-mono">{formatLocalDate(renewalModal.currentExpiry) || 'Sin fecha'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-stone-900/50 border border-brand-border/50">
                  <label className="text-[10px] text-stone-500 uppercase font-bold mb-2 block">Nueva Fecha de Vencimiento</label>
                  <input
                    type="date"
                    id="newExpiryDate"
                    className="w-full bg-brand-dark border border-brand-border rounded-lg h-12 px-3 text-white focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const input = document.getElementById('newExpiryDate') as HTMLInputElement;
                    handleConfirmRenewal(input.value);
                  }}
                  className="flex-1 bg-primary hover:bg-primary-dark text-brand-dark font-bold py-3 rounded-lg text-sm transition-colors shadow-lg shadow-primary/10"
                >
                  Confirmar Renovación
                </button>
                <button onClick={() => setRenewalModal(null)} className="px-4 py-3 border border-brand-border text-stone-300 text-sm rounded-lg">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;