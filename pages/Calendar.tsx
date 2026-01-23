import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

const Calendar = () => {
   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
   const [filterType, setFilterType] = useState<'all' | 'Seguro' | 'VTV' | 'Patente'>('all');
   const [events, setEvents] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [currentDate, setCurrentDate] = useState(new Date());
   const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

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
            const checkExpiry = (dateStr: string, type: 'Seguro' | 'VTV' | 'Patente') => {
               if (!dateStr) return;
               const d = new Date(dateStr + 'T00:00:00');
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
                     color: type === 'Seguro' ? 'rose' : (type === 'VTV' ? 'amber' : 'emerald'),
                     description: `Vencimiento de ${type} registrado en la ficha del activo.`
                  });
               }
            };

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

   // Reset selected day when month changes
   useEffect(() => {
      const today = new Date();
      if (currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()) {
         setSelectedDay(today.getDate());
      } else {
         setSelectedDay(1);
      }
   }, [currentDate.getMonth(), currentDate.getFullYear()]);

   const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
   const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

   const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
   const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
   const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

   const filteredEvents = useMemo(() =>
      events.filter(e => filterType === 'all' || e.type.toUpperCase().includes(filterType.toUpperCase())),
      [events, filterType]
   );

   const selectedDayEvents = useMemo(() =>
      filteredEvents.filter(e => e.day === selectedDay),
      [filteredEvents, selectedDay]
   );

   const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });

   if (loading) return (
      <div className="h-screen flex items-center justify-center bg-background-dark">
         <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg shadow-primary/20"></div>
      </div>
   );

   return (
      <div className="p-4 md:p-6 pb-28 lg:pb-6 min-h-full flex flex-col max-w-7xl mx-auto space-y-6">
         <header className="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-4 lg:gap-6">
            <div className="flex items-center justify-between gap-4">
               {/* MES Y AÑO A LA IZQUIERDA */}
               <div className="flex items-center bg-brand-surface/50 backdrop-blur-md border border-brand-border rounded-xl p-1 shadow-xl">
                  <button onClick={prevMonth} className="p-2 hover:bg-stone-700/50 rounded-lg text-stone-400 hover:text-white transition-all active:scale-90">
                     <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <div className="px-4 min-w-[120px] sm:min-w-[160px] text-center">
                     <h2 className="text-lg sm:text-2xl font-black text-white capitalize tracking-tight leading-none">{monthName}</h2>
                     <span className="text-[10px] sm:text-xs text-primary font-mono font-bold tracking-widest uppercase">{currentDate.getFullYear()}</span>
                  </div>
                  <button onClick={nextMonth} className="p-2 hover:bg-stone-700/50 rounded-lg text-stone-400 hover:text-white transition-all active:scale-90">
                     <span className="material-symbols-outlined">chevron_right</span>
                  </button>
               </div>

               {/* SELECTOR DE VISTA A LA DERECHA (SOLO MOBILE/TABLET) */}
               <div className="flex lg:hidden p-1 bg-brand-surface/40 backdrop-blur-md border border-brand-border rounded-xl shadow-lg">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-stone-700 text-primary shadow-inner' : 'text-stone-500'}`}>
                     <span className="material-symbols-outlined text-[20px]">calendar_view_month</span>
                  </button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-stone-700 text-primary shadow-inner' : 'text-stone-500'}`}>
                     <span className="material-symbols-outlined text-[20px]">view_agenda</span>
                  </button>
               </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
               {/* FILTROS OCUPANDO EL RESTO DEL ESPACIO */}
               <div className="flex p-1 bg-brand-surface/40 backdrop-blur-md border border-brand-border rounded-xl shadow-lg overflow-x-auto">
                  {['all', 'Seguro', 'VTV', 'Patente'].map((type) => (
                     <button
                        key={type}
                        onClick={() => setFilterType(type as any)}
                        className={`px-3 sm:px-4 py-2 text-[9px] sm:text-[10px] font-black rounded-lg transition-all uppercase tracking-wider flex items-center gap-2 whitespace-nowrap ${filterType === type
                           ? 'bg-primary text-brand-dark shadow-lg shadow-primary/10'
                           : 'text-stone-500 hover:text-stone-200'
                           }`}
                     >
                        {type !== 'all' && (
                           <span className={`w-1.5 h-1.5 rounded-full ${type === 'Seguro' ? 'bg-rose-500' : type === 'VTV' ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}></span>
                        )}
                        {type === 'all' ? 'Ver Todo' : type}
                     </button>
                  ))}
               </div>

               {/* SELECTOR DE VISTA (SOLO DESKTOP PARA EVITAR DUPLICADO) */}
               <div className="hidden lg:flex p-1 bg-brand-surface/40 backdrop-blur-md border border-brand-border rounded-xl shadow-lg">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-stone-700 text-primary shadow-inner' : 'text-stone-500'}`}>
                     <span className="material-symbols-outlined text-[20px]">calendar_view_month</span>
                  </button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-stone-700 text-primary shadow-inner' : 'text-stone-500'}`}>
                     <span className="material-symbols-outlined text-[20px]">view_agenda</span>
                  </button>
               </div>
            </div>
         </header>

         {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
               {/* CALENDARIO COMPACTO (GLASSMORPHISM) */}
               <div className="lg:col-span-8 bg-brand-surface/30 backdrop-blur-xl border border-brand-border rounded-2xl shadow-2xl overflow-hidden">
                  <div className="grid grid-cols-7 gap-px bg-brand-border/20">
                     {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(day => (
                        <div key={day} className="bg-brand-surface/40 p-3 text-center text-[10px] font-black text-stone-500 uppercase tracking-widest">{day}</div>
                     ))}
                     {Array.from({ length: 42 }).map((_, i) => {
                        const dayNum = i - startOffset + 1;
                        const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                        const dayEvents = filteredEvents.filter(e => e.day === dayNum);
                        const isToday = dayNum === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                        const isSelected = selectedDay === dayNum && isCurrentMonth;

                        return (
                           <div
                              key={i}
                              onClick={() => isCurrentMonth && setSelectedDay(dayNum)}
                              className={`group relative aspect-square lg:aspect-auto lg:min-h-[100px] p-2 transition-all duration-300 cursor-pointer overflow-hidden rounded-xl ${!isCurrentMonth ? 'bg-stone-950/10 opacity-30 pointer-events-none' :
                                 isSelected ? 'bg-primary/10 shadow-inner' : 'bg-brand-dark/40 hover:bg-brand-surface/60'
                                 }`}
                           >
                              <div className={`absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black transition-all ${isToday ? 'bg-primary text-brand-dark shadow-lg shadow-primary/30' :
                                 isSelected ? 'text-primary' : 'text-stone-500 group-hover:text-stone-200'
                                 }`}>
                                 {isCurrentMonth ? dayNum : ''}
                              </div>

                              {/* INDICADORES DE PUNTOS (DOTS) */}
                              <div className="mt-8 flex flex-wrap justify-center gap-1 xl:gap-1.5 transition-transform duration-300 group-hover:scale-110">
                                 {isCurrentMonth && dayEvents.map((evt, idx) => (
                                    <div
                                       key={evt.id}
                                       className={`w-2 h-2 rounded-full shadow-sm animate-in zoom-in-50 duration-300 delay-${idx * 75} ${evt.color === 'rose' ? 'bg-rose-500 shadow-rose-500/50' :
                                          evt.color === 'blue' ? 'bg-blue-400 shadow-blue-400/50' :
                                             evt.color === 'amber' ? 'bg-amber-500 shadow-amber-500/50' : 'bg-emerald-500 shadow-emerald-500/50'
                                          }`}
                                    />
                                 ))}
                              </div>

                              {/* TEXTO SOLO EN DESKTOP */}
                              <div className="hidden xl:block mt-2 space-y-1">
                                 {isCurrentMonth && dayEvents.slice(0, 2).map(evt => (
                                    <div key={evt.id} className="text-[9px] font-bold truncate text-stone-400 bg-brand-surface/30 px-1 rounded border border-brand-border/30">
                                       {evt.vehicle.split(' ')[0]} {evt.type.substring(0, 1)}
                                    </div>
                                 ))}
                                 {dayEvents.length > 2 && (
                                    <div className="text-[8px] text-primary text-center font-black">+{dayEvents.length - 2} más</div>
                                 )}
                              </div>

                              {isSelected && (
                                 <div className="absolute inset-0 border-2 border-primary/40 rounded-xl pointer-events-none" />
                              )}
                           </div>
                        );
                     })}
                  </div>
               </div>

               {/* PANEL DE EVENTOS DEL DÍA SELECCIONADO (VISTA HÍBRIDA) */}
               <div className="lg:col-span-4 flex flex-col space-y-4 animate-in slide-in-from-right-10 duration-500">
                  <div className="p-6 bg-brand-surface/40 backdrop-blur-xl border border-brand-border rounded-2xl shadow-2xl flex-1 flex flex-col">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex flex-col">
                           <h3 className="text-xl font-black text-white tracking-tight">Eventos del Día</h3>
                           <p className="text-xs text-primary font-mono font-bold uppercase tracking-widest">{selectedDay} de {monthName}</p>
                        </div>
                        <div className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                           <span className="text-[10px] font-black text-primary">{selectedDayEvents.length} ALERTAS</span>
                        </div>
                     </div>

                     <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] lg:max-h-none pr-2 scrollbar-thin scrollbar-thumb-stone-700">
                        {selectedDayEvents.length === 0 ? (
                           <div className="flex flex-col items-center justify-center py-12 text-center opacity-30 grayscale">
                              <span className="material-symbols-outlined text-6xl mb-4">event_busy</span>
                              <p className="text-sm font-bold tracking-tight">Sin eventos para esta fecha</p>
                           </div>
                        ) : (
                           selectedDayEvents.map((evt, i) => (
                              <Link
                                 to="/fleet"
                                 key={evt.id}
                                 className={`block p-4 rounded-xl border transition-all duration-300 hover:translate-x-2 animate-in slide-in-from-right-4 delay-${i * 100} ${evt.color === 'rose' ? 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10' :
                                    evt.color === 'blue' ? 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10' :
                                       evt.color === 'amber' ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10' : 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
                                    }`}
                              >
                                 <div className="flex items-center gap-3 mb-2">
                                    <span className={`material-symbols-outlined text-lg ${evt.color === 'rose' ? 'text-rose-500' : evt.color === 'blue' ? 'text-blue-400' : evt.color === 'amber' ? 'text-amber-500' : 'text-emerald-500'
                                       }`}>
                                       {evt.type.includes('Seguro') ? 'security' : evt.type.includes('VTV') ? 'verified' : 'badge'}
                                    </span>
                                    <h4 className="text-sm font-black text-white">{evt.type}</h4>
                                 </div>
                                 <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                       <span className="text-[11px] font-bold text-stone-300">{evt.vehicle}</span>
                                       <span className="text-[10px] font-mono text-stone-500 uppercase">{evt.plate}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase ${evt.status === 'Vencido' ? 'bg-red-500/20 text-red-400 border-red-500/20' : 'bg-brand-dark/50 text-stone-400 border-brand-border'
                                       }`}>
                                       {evt.status}
                                    </span>
                                 </div>
                              </Link>
                           ))
                        )}
                     </div>
                  </div>
               </div>
            </div>
         ) : (
            <div className="bg-brand-surface/30 backdrop-blur-xl border border-brand-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-500">
               {filteredEvents.length === 0 ? (
                  <div className="p-20 text-center flex flex-col items-center">
                     <span className="material-symbols-outlined text-6xl text-stone-700 mb-4 animate-bounce">search_off</span>
                     <p className="text-stone-500 font-bold italic">No se encontraron eventos para los filtros seleccionados.</p>
                  </div>
               ) : (
                  <div className="divide-y divide-brand-border/30">
                     {filteredEvents.sort((a, b) => a.day - b.day).map((evt, i) => (
                        <div key={evt.id} className="p-6 hover:bg-brand-surface/40 transition-all flex items-center gap-6 group animate-in slide-in-from-left-4" style={{ animationDelay: `${i * 30}ms` }}>
                           <div className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center bg-brand-dark/50 transition-transform group-hover:scale-110 shadow-lg ${evt.color === 'rose' ? 'border-rose-500/20 text-rose-500 shadow-rose-500/5' :
                              evt.color === 'blue' ? 'border-blue-500/20 text-blue-400 shadow-blue-500/5' :
                                 evt.color === 'amber' ? 'border-amber-500/20 text-amber-500 shadow-amber-500/5' : 'border-emerald-500/20 text-emerald-500 shadow-emerald-500/5'
                              }`}>
                              <span className="text-lg font-black leading-none">{evt.day}</span>
                              <span className="text-[8px] font-black uppercase tracking-widest">{monthName.substring(0, 3)}</span>
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-black text-white truncate group-hover:text-primary transition-colors">{evt.type}</h4>
                              <div className="flex items-center gap-3">
                                 <span className="text-sm font-bold text-stone-400 italic">{evt.vehicle}</span>
                                 <span className="w-1 h-1 rounded-full bg-stone-700"></span>
                                 <span className="text-xs font-mono text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/20 uppercase">{evt.plate}</span>
                              </div>
                           </div>
                           <div className="hidden sm:flex flex-col items-end gap-1">
                              <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest shadow-lg ${evt.color === 'rose' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                 evt.color === 'blue' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    evt.color === 'amber' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                 }`}>
                                 {evt.status}
                              </span>
                              <p className="text-[9px] text-stone-600 font-mono italic">ID: {evt.id.substring(0, 8)}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         )}
      </div>
   );
};

export default Calendar;