import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

const Calendar = () => {
   const [selectedEvent, setSelectedEvent] = useState<any>(null);
   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
   const [filterType, setFilterType] = useState<'all' | 'Seguro' | 'VTV' | 'Patente'>('all');
   const [events, setEvents] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [currentDate, setCurrentDate] = useState(new Date());

   const fetchCalendarData = async () => {
      setLoading(true);
      const { data: vehicles } = await supabase
         .from('vehiculos')
         .select('id, model, patente, vtv_expiration, insurance_expiration, patente_expiration, vtv_appointment, insurance_appointment, patente_appointment')
         .neq('status', 'Baja');

      if (vehicles) {
         const today = new Date();
         today.setHours(0, 0, 0, 0);
         const realEvents: any[] = [];

         vehicles.forEach(v => {
            // Lógica para Vencimientos (Corregido desfase de fecha)
            const checkExpiry = (dateStr: string, type: 'Seguro' | 'VTV' | 'Patente') => {
               if (!dateStr) return;
               const d = new Date(dateStr + 'T00:00:00'); // Forzar lectura local

               if (d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()) {
                  let status = 'Próximo';
                  if (d.getTime() < today.getTime()) status = 'Vencido';
                  else if (d.getTime() === today.getTime()) status = 'Vence Hoy';

                  realEvents.push({
                     id: `${v.id}-exp-${type}`,
                     day: d.getDate(),
                     type,
                     vehicle: v.model,
                     plate: v.patente ? v.patente.toUpperCase() : 'S/P',
                     status,
                     color: type === 'Seguro' ? 'rose' : (type === 'VTV' ? 'amber' : 'blue'),
                     description: `Vencimiento de ${type} registrado en la ficha del activo.`
                  });
               }
            };

            // Lógica para Turnos (Color Azul Fijo)
            const checkAppt = (dateStr: string, type: string) => {
               if (!dateStr) return;
               const d = new Date(dateStr + 'T00:00:00');

               if (d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()) {
                  realEvents.push({
                     id: `${v.id}-appt-${type}`,
                     day: d.getDate(),
                     type: `TURNO ${type}`,
                     vehicle: v.model,
                     plate: v.patente ? v.patente.toUpperCase() : 'S/P',
                     status: 'Programado',
                     color: 'blue',
                     description: `Turno programado para la renovación de ${type}.`
                  });
               }
            };

            checkExpiry(v.insurance_expiration, 'Seguro');
            checkExpiry(v.vtv_expiration, 'VTV');
            checkExpiry(v.patente_expiration, 'Patente');

            checkAppt(v.insurance_appointment, 'Seguro');
            checkAppt(v.vtv_appointment, 'VTV');
            checkAppt(v.patente_appointment, 'Patente');
         });

         setEvents(realEvents);
      }
      setLoading(false);
   };

   useEffect(() => { fetchCalendarData(); }, [currentDate]);

   const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
   const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

   const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
   const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
   const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

   const filteredEvents = events.filter(e => filterType === 'all' || e.type.toUpperCase().includes(filterType.toUpperCase()));
   const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });

   if (loading) return <div className="h-screen flex items-center justify-center bg-background-dark"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

   return (
      <div className="p-4 md:p-6 h-full flex flex-col max-w-7xl mx-auto">
         <header className="flex flex-col xl:flex-row items-start xl:items-end justify-between mb-6 gap-6">
            <div className="flex flex-col gap-2">
               <div className="flex items-center gap-4">
                  <div className="flex items-center bg-brand-surface border border-brand-border rounded-lg p-1">
                     <button onClick={prevMonth} className="p-1.5 hover:bg-stone-700 rounded-md text-stone-400 hover:text-white transition-colors"><span className="material-symbols-outlined">chevron_left</span></button>
                     <div className="px-4 min-w-[140px] text-center">
                        <h2 className="text-xl font-bold text-white capitalize leading-none">{monthName}</h2>
                        <span className="text-xs text-stone-500 font-mono">{currentDate.getFullYear()}</span>
                     </div>
                     <button onClick={nextMonth} className="p-1.5 hover:bg-stone-700 rounded-md text-stone-400 hover:text-white transition-colors"><span className="material-symbols-outlined">chevron_right</span></button>
                  </div>
               </div>
               <p className="text-sm text-stone-500 hidden sm:block">Agenda automática de vencimientos y turnos de flota.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
               {/* FILTROS RESTAURADOS CON PUNTOS DE COLOR */}
               <div className="flex p-1 bg-brand-surface border border-brand-border rounded-lg overflow-x-auto">
                  <button onClick={() => setFilterType('all')} className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${filterType === 'all' ? 'bg-stone-700 text-white' : 'text-stone-500 hover:text-stone-300'}`}>Todos</button>
                  <button onClick={() => setFilterType('Seguro')} className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${filterType === 'Seguro' ? 'bg-rose-500/20 text-rose-400' : 'text-stone-500'}`}>
                     <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Seguros
                  </button>
                  <button onClick={() => setFilterType('VTV')} className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${filterType === 'VTV' ? 'bg-amber-500/20 text-amber-400' : 'text-stone-500'}`}>
                     <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> VTV
                  </button>
                  <button onClick={() => setFilterType('Patente')} className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${filterType === 'Patente' ? 'bg-blue-500/20 text-blue-400' : 'text-stone-500'}`}>
                     <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Patente
                  </button>
               </div>
               <div className="flex p-1 bg-brand-surface border border-brand-border rounded-lg">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-stone-700 text-white' : 'text-stone-500'}`}><span className="material-symbols-outlined text-[20px]">calendar_view_month</span></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-stone-700 text-white' : 'text-stone-500'}`}><span className="material-symbols-outlined text-[20px]">view_agenda</span></button>
               </div>
            </div>
         </header>

         {viewMode === 'grid' && (
            <div className="flex-1 w-full overflow-x-auto rounded-xl border border-brand-border shadow-2xl bg-brand-border">
               <div className="min-w-[800px] grid grid-cols-7 gap-px bg-brand-border">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                     <div key={day} className="bg-brand-surface/90 p-3 text-center text-xs font-bold text-stone-500 uppercase tracking-wider">{day}</div>
                  ))}
                  {Array.from({ length: 35 }).map((_, i) => {
                     const dayNum = i - startOffset + 1;
                     const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                     const dayEvents = filteredEvents.filter(e => e.day === dayNum);
                     return (
                        <div key={i} className={`p-2 relative min-h-[120px] ${!isCurrentMonth ? 'bg-stone-950/30' : 'bg-brand-dark hover:bg-brand-surface/20'}`}>
                           <div className="absolute top-2 right-2 text-sm font-mono text-stone-400">{isCurrentMonth ? dayNum : ''}</div>
                           <div className="mt-7 space-y-1.5">
                              {isCurrentMonth && dayEvents.map((evt) => (
                                 <button key={evt.id} onClick={() => setSelectedEvent(evt)} className={`w-full text-left px-2 py-1.5 rounded border text-[10px] font-bold truncate flex items-center gap-1.5 transition-transform hover:scale-[1.02] ${evt.color === 'rose' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' :
                                       evt.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                          evt.color === 'amber' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                    }`}>
                                    <span className="material-symbols-outlined text-[14px] flex-shrink-0">{evt.type.includes('Seguro') ? 'security' : evt.type.includes('VTV') ? 'verified' : 'badge'}</span>
                                    <span className="truncate">{evt.type} • {evt.plate}</span>
                                 </button>
                              ))}
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>
         )}

         {viewMode === 'list' && (
            <div className="flex-1 bg-brand-surface border border-brand-border rounded-xl shadow-2xl overflow-hidden">
               {filteredEvents.length === 0 ? (
                  <div className="p-12 text-center text-stone-500 italic">No hay eventos para este mes.</div>
               ) : (
                  <div className="divide-y divide-brand-border">
                     {filteredEvents.sort((a, b) => a.day - b.day).map((evt) => (
                        <div key={evt.id} className="p-4 hover:bg-brand-dark/30 transition-colors flex items-center gap-4 cursor-pointer" onClick={() => setSelectedEvent(evt)}>
                           <div className="w-12 h-12 rounded-lg border border-brand-border flex items-center justify-center bg-brand-dark text-stone-300 font-bold">{evt.day}</div>
                           <div className="flex-1 min-w-0">
                              <h4 className="text-white font-bold truncate">{evt.type}: {evt.vehicle}</h4>
                              <p className="text-xs text-stone-400 font-mono">{evt.plate}</p>
                           </div>
                           <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase ${evt.color === 'blue' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-brand-dark text-stone-500'
                              }`}>{evt.status}</span>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         )}

         {/* MODAL DETALLADO RESTAURADO (ESTÉTICO) */}
         {selectedEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
               <div className="bg-brand-surface border border-brand-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className={`h-2 w-full ${selectedEvent.color === 'rose' ? 'bg-rose-500' :
                        selectedEvent.color === 'blue' ? 'bg-blue-500' :
                           selectedEvent.color === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
                     }`}></div>
                  <div className="p-6">
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                           <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${selectedEvent.color === 'rose' ? 'bg-rose-500/10 text-rose-500' : selectedEvent.color === 'blue' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              <span className="material-symbols-outlined text-2xl">{selectedEvent.type.includes('Seguro') ? 'security' : selectedEvent.type.includes('VTV') ? 'verified' : 'badge'}</span>
                           </div>
                           <div>
                              <h3 className="text-xl font-bold text-white leading-tight">{selectedEvent.type}</h3>
                              <p className="text-stone-400 text-sm">{selectedEvent.status}</p>
                           </div>
                        </div>
                        <button onClick={() => setSelectedEvent(null)} className="text-stone-500 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                     </div>

                     <div className="space-y-4 mb-8">
                        <div className="bg-brand-dark rounded-lg p-4 border border-brand-border">
                           <div className="flex justify-between mb-2">
                              <div><p className="text-[10px] text-stone-500 uppercase font-bold mb-1">Unidad</p><p className="text-white font-bold text-sm">{selectedEvent.vehicle}</p></div>
                              <div className="text-right"><p className="text-[10px] text-stone-500 uppercase font-bold mb-1">Patente</p><p className="text-primary font-mono text-xs bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">{selectedEvent.plate}</p></div>
                           </div>
                           <div className="h-px bg-brand-border my-3"></div>
                           <div><p className="text-[10px] text-stone-500 uppercase font-bold mb-1">Detalle del Registro</p><p className="text-stone-300 text-sm leading-relaxed">{selectedEvent.description}</p></div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-900/50 border border-brand-border/50">
                           <span className="material-symbols-outlined text-stone-400">calendar_month</span>
                           <div><p className="text-[10px] text-stone-500 uppercase font-bold leading-none mb-1">Fecha Programada</p><p className="text-white font-bold">{selectedEvent.day} de {monthName}, {currentDate.getFullYear()}</p></div>
                        </div>
                     </div>

                     <div className="flex gap-2">
                        <Link to="/fleet" className="flex-1 bg-primary hover:bg-primary-dark text-brand-dark font-bold py-2.5 rounded text-center text-sm transition-colors shadow-lg shadow-primary/10">Ir a Flota</Link>
                        <button onClick={() => setSelectedEvent(null)} className="px-4 py-2.5 border border-brand-border text-stone-300 text-sm rounded hover:bg-stone-800 transition-colors">Cerrar</button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default Calendar;