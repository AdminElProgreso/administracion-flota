import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

const Calendar = () => {
   const [selectedEvent, setSelectedEvent] = useState<any>(null);
   const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
   const [filterType, setFilterType] = useState<'all' | 'Seguro' | 'VTV' | 'Patente'>('all');
   const [events, setEvents] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   // Estado para la navegación del calendario
   const [currentDate, setCurrentDate] = useState(new Date());

   // Cargar datos reales de Supabase
   const fetchCalendarData = async () => {
      setLoading(true);
      const { data: vehicles, error } = await supabase
         .from('vehiculos')
         .select('id, model, patente, vtv_expiration, insurance_expiration, patente_expiration')
         .neq('status', 'Baja'); // <--- Solo traer vehículos que NO estén de baja

      if (vehicles) {
         const today = new Date();
         today.setHours(0, 0, 0, 0);
         const realEvents: any[] = [];

         vehicles.forEach(v => {
            const processDoc = (dateStr: string, type: 'Seguro' | 'VTV' | 'Patente') => {
               if (!dateStr) return;

               const expiryDate = new Date(dateStr);
               const expiryDay = expiryDate.getUTCDate(); // Usamos UTC para evitar desfasajes
               const expiryMonth = expiryDate.getUTCMonth();
               const expiryYear = expiryDate.getUTCFullYear();

               // Solo lo agregamos si coincide con el mes y año que estamos viendo
               if (expiryMonth === currentDate.getMonth() && expiryYear === currentDate.getFullYear()) {

                  // Calcular estado
                  let status = 'Próximo';
                  const compareDate = new Date(dateStr);
                  compareDate.setHours(0, 0, 0, 0);

                  if (compareDate.getTime() < today.getTime()) status = 'Vencido';
                  else if (compareDate.getTime() === today.getTime()) status = 'Vence Hoy';

                  realEvents.push({
                     id: `${v.id}-${type}`,
                     day: expiryDay,
                     type: type,
                     vehicle: v.model,
                     plate: v.patente ? v.patente.toUpperCase() : 'S/P',
                     status: status,
                     color: type === 'Seguro' ? 'rose' : (type === 'VTV' ? 'amber' : 'blue'),
                     description: `Vencimiento de ${type} registrado en la ficha del activo.`
                  });
               }
            };

            processDoc(v.insurance_expiration, 'Seguro');
            processDoc(v.vtv_expiration, 'VTV');
            processDoc(v.patente_expiration, 'Patente');
         });

         setEvents(realEvents);
      }
      setLoading(false);
   };

   useEffect(() => {
      fetchCalendarData();
   }, [currentDate]); // Se recarga cuando cambias de mes

   // Navegación
   const prevMonth = () => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
   };

   const nextMonth = () => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
   };

   // Lógica del Calendario
   const year = currentDate.getFullYear();
   const month = currentDate.getMonth();
   const today = new Date();
   const daysInMonth = new Date(year, month + 1, 0).getDate();
   const firstDayOfMonth = new Date(year, month, 1).getDay();
   const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

   const filteredEvents = events.filter(e => filterType === 'all' || e.type === filterType);
   const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
   const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

   if (loading) return (
      <div className="h-screen flex items-center justify-center bg-background-dark">
         <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
   );

   return (
      <div className="p-4 md:p-6 h-full flex flex-col max-w-7xl mx-auto">
         <header className="flex flex-col xl:flex-row items-start xl:items-end justify-between mb-6 gap-6">
            <div className="flex flex-col gap-2 w-full md:w-auto">
               <div className="flex items-center gap-4">
                  <div className="flex items-center bg-brand-surface border border-brand-border rounded-lg p-1">
                     <button onClick={prevMonth} className="p-1.5 hover:bg-stone-700 rounded-md text-stone-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-xl">chevron_left</span>
                     </button>
                     <div className="px-4 min-w-[140px] text-center">
                        <h2 className="text-xl font-bold text-white capitalize leading-none">{formattedMonth}</h2>
                        <span className="text-xs text-stone-500 font-mono">{year}</span>
                     </div>
                     <button onClick={nextMonth} className="p-1.5 hover:bg-stone-700 rounded-md text-stone-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-xl">chevron_right</span>
                     </button>
                  </div>
                  {today.getMonth() === month && today.getFullYear() === year && (
                     <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 animate-pulse">Mes Actual</span>
                  )}
               </div>
               <p className="text-sm text-stone-500 hidden sm:block">Agenda automática de vencimientos de flota.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
               <div className="flex p-1 bg-brand-surface border border-brand-border rounded-lg overflow-x-auto no-scrollbar">
                  <button onClick={() => setFilterType('all')} className={`px-4 py-2 text-xs font-bold rounded-md transition-all whitespace-nowrap ${filterType === 'all' ? 'bg-stone-700 text-white shadow' : 'text-stone-500 hover:text-stone-300'}`}>Todos</button>
                  <button onClick={() => setFilterType('Seguro')} className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${filterType === 'Seguro' ? 'bg-rose-500/20 text-rose-400 shadow' : 'text-stone-500 hover:text-stone-300'}`}><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Seguros</button>
                  <button onClick={() => setFilterType('VTV')} className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${filterType === 'VTV' ? 'bg-amber-500/20 text-amber-400 shadow' : 'text-stone-500 hover:text-stone-300'}`}><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> VTV</button>
                  <button onClick={() => setFilterType('Patente')} className={`px-4 py-2 text-xs font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${filterType === 'Patente' ? 'bg-blue-500/20 text-blue-400 shadow' : 'text-stone-500 hover:text-stone-300'}`}><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Patentes</button>
               </div>
               <div className="flex p-1 bg-brand-surface border border-brand-border rounded-lg flex-shrink-0">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-stone-700 text-white' : 'text-stone-500 hover:text-stone-300'}`}><span className="material-symbols-outlined text-[20px]">calendar_view_month</span></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-stone-700 text-white' : 'text-stone-500 hover:text-stone-300'}`}><span className="material-symbols-outlined text-[20px]">view_agenda</span></button>
               </div>
            </div>
         </header>

         {viewMode === 'grid' && (
            <div className="flex-1 w-full overflow-x-auto rounded-xl border border-brand-border shadow-2xl bg-brand-border">
               <div className="min-w-[800px] grid grid-cols-7 gap-px bg-brand-border">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                     <div key={day} className="bg-brand-surface/90 p-3 text-center text-xs font-bold text-stone-500 uppercase tracking-wider sticky top-0 z-10">{day}</div>
                  ))}
                  {Array.from({ length: 35 }).map((_, i) => {
                     const dayNum = i - startOffset + 1;
                     const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
                     const dayEvents = filteredEvents.filter(e => e.day === dayNum);
                     const isToday = isCurrentMonth && dayNum === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                     return (
                        <div key={i} className={`p-2 relative min-h-[120px] transition-colors ${!isCurrentMonth ? 'bg-stone-950/30' : isToday ? 'bg-brand-surface ring-1 ring-inset ring-primary z-0' : 'bg-brand-dark hover:bg-brand-surface/20'}`}>
                           <div className={`absolute top-2 right-2 text-sm font-mono flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-brand-dark font-bold w-6 h-6' : (isCurrentMonth ? 'text-stone-400' : 'text-stone-700')}`}>
                              {dayNum > 0 && dayNum <= daysInMonth ? dayNum : ''}
                           </div>
                           <div className="mt-7 space-y-1.5">
                              {isCurrentMonth && dayEvents.map((evt) => (
                                 <button key={evt.id} onClick={() => setSelectedEvent(evt)} className={`w-full text-left px-2 py-1.5 rounded border text-[10px] font-bold truncate flex items-center gap-2 transition-transform hover:scale-[1.02] ${evt.color === 'rose' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : evt.color === 'amber' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                                    <span className="material-symbols-outlined text-[14px] flex-shrink-0">{evt.type === 'Seguro' ? 'security' : evt.type === 'VTV' ? 'verified' : 'badge'}</span>
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
            <div className="flex-1 bg-brand-surface border border-brand-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
               {filteredEvents.length === 0 ? (
                  <div className="p-12 text-center text-stone-500 flex flex-col items-center">
                     <span className="material-symbols-outlined text-4xl mb-2 opacity-30">filter_alt_off</span>
                     <p>No hay vencimientos de <span className="text-stone-300 font-bold">{filterType === 'all' ? 'ningún tipo' : filterType}</span> este mes.</p>
                  </div>
               ) : (
                  <div className="divide-y divide-brand-border">
                     {filteredEvents.sort((a, b) => a.day - b.day).map((evt) => (
                        <div key={evt.id} className="p-4 hover:bg-brand-dark/30 transition-colors flex items-center gap-4 group cursor-pointer" onClick={() => setSelectedEvent(evt)}>
                           <div className={`flex-shrink-0 w-16 border rounded-lg p-2 text-center ${evt.day === today.getDate() && month === today.getMonth() ? 'bg-primary border-primary text-brand-dark' : 'bg-brand-dark border-brand-border text-stone-500'}`}>
                              <span className="text-[10px] font-bold uppercase">{formattedMonth.substring(0, 3)}</span>
                              <span className="block text-xl font-bold">{evt.day}</span>
                           </div>
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${evt.color === 'rose' ? 'bg-rose-500/10 text-rose-500' : evt.color === 'amber' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                              <span className="material-symbols-outlined">{evt.type === 'Seguro' ? 'security' : evt.type === 'VTV' ? 'verified' : 'badge'}</span>
                           </div>
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                 <h4 className="text-white font-bold truncate">{evt.type}: {evt.vehicle}</h4>
                                 <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold ${evt.status === 'Vencido' ? 'bg-rose-500/10 text-rose-500' : 'bg-brand-dark text-stone-400'}`}>{evt.status}</span>
                              </div>
                              <p className="text-sm text-stone-400 truncate">{evt.plate}</p>
                           </div>
                           <span className="material-symbols-outlined text-stone-600 group-hover:text-primary transition-colors">chevron_right</span>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         )}

         {selectedEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
               <div className="bg-brand-surface border border-brand-border rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className={`h-2 w-full ${selectedEvent.color === 'rose' ? 'bg-rose-500' : selectedEvent.color === 'amber' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                  <div className="p-6">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${selectedEvent.color === 'rose' ? 'bg-rose-500/10 text-rose-500' : selectedEvent.color === 'amber' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                              <span className="material-symbols-outlined text-2xl">{selectedEvent.type === 'Seguro' ? 'security' : selectedEvent.type === 'VTV' ? 'verified' : 'badge'}</span>
                           </div>
                           <div>
                              <h3 className="text-xl font-bold text-white leading-tight">Vencimiento {selectedEvent.type}</h3>
                              <p className="text-stone-400 text-sm">{selectedEvent.status}</p>
                           </div>
                        </div>
                        <button onClick={() => setSelectedEvent(null)} className="text-stone-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                     </div>
                     <div className="space-y-4 mb-6">
                        <div className="bg-brand-dark rounded-lg p-4 border border-brand-border">
                           <div className="flex justify-between mb-2">
                              <div><div className="text-xs text-stone-500 font-bold uppercase">Unidad</div><div className="text-white font-bold text-sm">{selectedEvent.vehicle}</div></div>
                              <div className="text-right"><div className="text-xs text-stone-500 font-bold uppercase">Patente</div><div className="text-primary font-mono text-xs border border-primary/20 bg-primary/10 px-1.5 py-0.5 rounded">{selectedEvent.plate}</div></div>
                           </div>
                           <div className="h-px bg-brand-border my-3"></div>
                           <div><div className="text-xs text-stone-500 font-bold uppercase">Detalle</div><div className="text-stone-300 text-sm">{selectedEvent.description}</div></div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-stone-900/50 border border-brand-border/50">
                           <span className="material-symbols-outlined text-stone-400">calendar_month</span>
                           <div className="text-sm"><span className="text-stone-500 block text-xs font-bold uppercase">Fecha</span><span className="text-white font-bold">{selectedEvent.day} de {formattedMonth}, {year}</span></div>
                        </div>
                     </div>
                     <div className="flex gap-3">
                        <Link to={`/fleet`} className="flex-1 py-3 rounded-lg bg-primary hover:bg-primary-dark text-brand-dark font-bold text-sm text-center">Ir a Flota</Link>
                        <button onClick={() => setSelectedEvent(null)} className="px-4 py-3 rounded-lg border border-brand-border text-stone-300 text-sm">Cerrar</button>
                     </div>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default Calendar;