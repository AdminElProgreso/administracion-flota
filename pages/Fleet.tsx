import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Vehicle } from '../types';
import { supabase } from '../supabase';

const Fleet = () => {
   const [vehicles, setVehicles] = useState<Vehicle[]>([]);
   const [loading, setLoading] = useState(true);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [newVehicleType, setNewVehicleType] = useState<'car' | 'truck' | 'generator'>('car');

   // NUEVOS ESTADOS PARA FILTROS
   const [statusFilter, setStatusFilter] = useState<'operativos' | 'bajas' | 'todos'>('operativos');

   const fetchVehicles = async () => {
      setLoading(true);
      let query = supabase.from('vehiculos').select('*');

      // Aplicar filtro de estado
      if (statusFilter === 'operativos') {
         query = query.neq('status', 'Baja');
      } else if (statusFilter === 'bajas') {
         query = query.eq('status', 'Baja');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
         console.error('Error:', error);
      } else if (data) {
         const mapped: Vehicle[] = data.map(v => ({
            id: v.id,
            type: v.tipo,
            patente: v.patente,
            model: v.model,
            year: v.year,
            section: v.section,
            status: v.status,
            odometer: v.odometer,
            manager: v.manager,
            assignedDriver: v.assigned_driver,
            insuranceExpiration: v.insurance_expiration,
            vtvExpiration: v.vtv_expiration,
            patenteExpiration: v.patente_expiration,
            alerts: []
         }));
         setVehicles(mapped);
      }
      setLoading(false);
   };

   useEffect(() => {
      fetchVehicles();
   }, [statusFilter]); // Recargar cuando cambie el filtro

   const handleAddVehicle = async (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      const nuevoVehiculo = {
         tipo: newVehicleType,
         patente: formData.get('patente')?.toString().toUpperCase(),
         model: formData.get('modelo'),
         year: parseInt(formData.get('anio') as string) || new Date().getFullYear(),
         section: formData.get('seccion'),
         manager: formData.get('encargado'),
         assigned_driver: formData.get('chofer'),
         odometer: parseInt(formData.get('odometro') as string) || 0,
         vtv_expiration: formData.get('vtv_date') || null,
         insurance_expiration: formData.get('seguro_date') || null,
         patente_expiration: formData.get('patente_date') || null,
         status: 'Activo'
      };

      const { error } = await supabase.from('vehiculos').insert([nuevoVehiculo]);

      if (error) {
         alert('Error al guardar: ' + error.message);
      } else {
         setIsModalOpen(false);
         fetchVehicles();
      }
   };

   const getStatusColor = (status: string) => {
      switch (status) {
         case 'Activo': return 'bg-emerald-500';
         case 'En Taller': return 'bg-amber-500';
         case 'Baja': return 'bg-rose-500';
         default: return 'bg-stone-500';
      }
   };

   const getStatusStyles = (status: string) => {
      switch (status) {
         case 'Activo': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
         case 'En Taller': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
         case 'Baja': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
         default: return 'bg-stone-500/10 text-stone-500 border-stone-500/20';
      }
   };

   const getIconByType = (type: string) => {
      switch (type) {
         case 'car': return 'directions_car';
         case 'truck': return 'local_shipping';
         case 'generator': return 'electric_bolt';
         default: return 'directions_car';
      }
   };

   if (loading) return <div className="flex items-center justify-center h-screen bg-background-dark"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

   return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
               <h2 className="text-2xl font-bold text-white tracking-tight">Listado de Activos</h2>
               <p className="text-sm text-stone-500 mt-1">Gestión de flota y equipos de El Progreso.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary-dark text-brand-dark font-bold text-sm px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2 w-full sm:w-auto justify-center transition-all">
               <span className="material-symbols-outlined">add</span> Añadir Activo
            </button>
         </div>

         {/* Barra de Filtros Actualizada */}
         <div className="bg-brand-surface border border-brand-border rounded-xl p-4 mb-6 shadow-xl">
            <div className="flex flex-wrap gap-4 items-center">
               <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-500 uppercase">Mostrar:</span>
                  <select
                     value={statusFilter}
                     onChange={(e) => setStatusFilter(e.target.value as any)}
                     className="bg-brand-dark border-brand-border text-stone-300 text-xs rounded p-1.5 focus:ring-1 focus:ring-primary outline-none"
                  >
                     <option value="operativos">Operativos (Activos + Taller)</option>
                     <option value="todos">Todos los registros</option>
                     <option value="bajas">Solo Bajas (Vencidos/Vendidos)</option>
                  </select>
               </div>
            </div>
         </div>

         {/* --- MOBILE VIEW --- */}
         <div className="lg:hidden space-y-4">
            {vehicles.map((v) => (
               <div key={v.id} className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-lg relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-brand-dark border border-brand-border flex items-center justify-center text-stone-500">
                           <span className="material-symbols-outlined text-2xl">{getIconByType(v.type)}</span>
                        </div>
                        <div>
                           <h3 className="text-white font-bold text-lg leading-tight">{v.model}</h3>
                           <div className="flex items-center gap-2 mt-1">
                              {v.patente && <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">{v.patente.toUpperCase()}</span>}
                              <span className="text-stone-500 text-xs font-mono">{v.year}</span>
                           </div>
                        </div>
                     </div>
                     <span className={`flex-shrink-0 w-3 h-3 rounded-full shadow-lg ${getStatusColor(v.status)}`}></span>
                  </div>
                  <div className="space-y-3 mb-5 bg-brand-dark/30 rounded-lg p-3 border border-brand-border/50">
                     <div className="flex justify-between items-center border-b border-brand-border/50 pb-2">
                        <span className="text-stone-500 text-xs uppercase font-bold">Estado</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusStyles(v.status)}`}>{v.status}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-stone-500 text-xs uppercase font-bold">Uso</span>
                        <span className="text-stone-300 font-mono text-sm font-bold">{v.odometer.toLocaleString()} {v.type === 'generator' ? 'Hrs' : 'km'}</span>
                     </div>
                  </div>
                  <div className="flex items-center justify-end">
                     <Link to={`/fleet/${v.id}`} className="px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-sm text-stone-300 font-bold flex items-center gap-1">Ver Ficha <span className="material-symbols-outlined text-sm">chevron_right</span></Link>
                  </div>
               </div>
            ))}
         </div>

         {/* --- DESKTOP VIEW --- */}
         <div className="hidden lg:block bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-2xl">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-brand-dark border-b border-brand-border text-xs uppercase tracking-wider text-stone-500">
                     <th className="px-6 py-4 font-semibold">Identificación</th>
                     <th className="px-6 py-4 font-semibold">Sección y Encargado</th>
                     <th className="px-6 py-4 font-semibold">Uso Actual</th>
                     <th className="px-6 py-4 font-semibold">Estado</th>
                     <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-brand-border text-stone-300">
                  {vehicles.map((v) => (
                     <tr key={v.id} className="hover:bg-brand-dark/50 transition-colors group">
                        <td className="px-6 py-4">
                           <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded bg-brand-dark flex items-center justify-center text-stone-500 border border-brand-border"><span className="material-symbols-outlined text-xl">{getIconByType(v.type)}</span></div>
                              <div>
                                 {v.patente && <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 mb-1 inline-block">{v.patente.toUpperCase()}</span>}
                                 <div className="text-sm font-bold text-stone-200">{v.model}</div>
                                 <div className="text-xs text-stone-500">{v.year}</div>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col gap-1">
                              <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-brand-dark text-stone-400 border-brand-border">{v.section}</span>
                              <div className="flex items-center gap-1.5 mt-1"><span className="material-symbols-outlined text-stone-500 text-[14px]">person</span><span className="text-xs text-stone-300">{v.manager}</span></div>
                           </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm">{v.odometer.toLocaleString()} {v.type === 'generator' ? 'Hrs' : 'km'}</td>
                        <td className="px-6 py-4">
                           <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(v.status)}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(v.status)}`}></span>{v.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right"><Link to={`/fleet/${v.id}`} className="text-stone-500 hover:text-white transition-colors mr-2"><span className="material-symbols-outlined">visibility</span></Link></td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* MODAL ALTA (Mantenido igual) */}
         {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
               <div className="relative w-full max-w-4xl bg-brand-surface rounded-xl border border-brand-border shadow-2xl flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
                  <form onSubmit={handleAddVehicle}>
                     <div className="flex items-center justify-between px-6 py-5 border-b border-brand-border">
                        <h3 className="text-xl font-bold text-white">Alta de Activo</h3>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                     </div>
                     <div className="p-8 overflow-y-auto max-h-[70vh] space-y-6">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                           <button type="button" onClick={() => setNewVehicleType('car')} className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${newVehicleType === 'car' ? 'border-primary bg-primary/10 text-white' : 'border-brand-border bg-brand-dark/30 text-stone-500'}`}><span className="material-symbols-outlined text-3xl mb-2">directions_car</span><span className="text-xs font-bold uppercase">Auto</span></button>
                           <button type="button" onClick={() => setNewVehicleType('truck')} className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${newVehicleType === 'truck' ? 'border-primary bg-primary/10 text-white' : 'border-brand-border bg-brand-dark/30 text-stone-500'}`}><span className="material-symbols-outlined text-3xl mb-2">local_shipping</span><span className="text-xs font-bold uppercase">Camión</span></button>
                           <button type="button" onClick={() => setNewVehicleType('generator')} className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${newVehicleType === 'generator' ? 'border-primary bg-primary/10 text-white' : 'border-brand-border bg-brand-dark/30 text-stone-500'}`}><span className="material-symbols-outlined text-3xl mb-2">electric_bolt</span><span className="text-xs font-bold uppercase">Generador</span></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <input name="patente" placeholder="Patente" className="bg-brand-dark border-brand-border rounded h-10 px-3 text-white uppercase" />
                           <input name="modelo" required placeholder="Modelo" className="bg-brand-dark border-brand-border rounded h-10 px-3 text-white" />
                           <input name="anio" type="number" placeholder="Año" className="bg-brand-dark border-brand-border rounded h-10 px-3 text-white" />
                           <input name="odometro" type="number" placeholder="Km/Horas" className="bg-brand-dark border-brand-border rounded h-10 px-3 text-white" />
                           <select name="seccion" className="bg-brand-dark border-brand-border rounded h-10 px-3 text-white">
                              <option>Cereales</option><option>Logística</option><option>Administración</option><option>Agronomía</option>
                           </select>
                           <input name="encargado" placeholder="Encargado" className="bg-brand-dark border-brand-border rounded h-10 px-3 text-white" />
                        </div>
                     </div>
                     <div className="p-6 border-t border-brand-border flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-stone-400 font-bold text-sm uppercase">Cancelar</button>
                        <button type="submit" className="px-8 py-2 bg-primary text-brand-dark rounded-lg font-bold text-sm uppercase">Guardar</button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default Fleet;