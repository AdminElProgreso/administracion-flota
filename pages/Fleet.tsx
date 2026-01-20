import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Vehicle } from '../types';
import { supabase } from '../supabase'; // Importamos la conexión real

const Fleet = () => {
   const [vehicles, setVehicles] = useState<Vehicle[]>([]);
   const [loading, setLoading] = useState(true);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [newVehicleType, setNewVehicleType] = useState<'car' | 'truck' | 'generator'>('car');

   // 1. CARGAR DATOS DESDE SUPABASE
   const fetchVehicles = async () => {
      setLoading(true);
      const { data, error } = await supabase
         .from('vehiculos')
         .select('*')
         .order('created_at', { ascending: false });

      if (error) {
         console.error('Error cargando flota:', error);
      } else if (data) {
         // Mapeamos los nombres de la base de datos a los que usa tu interfaz de React
         const mappedVehicles: Vehicle[] = data.map(v => ({
            id: v.id,
            type: v.tipo,
            patente: v.patente,
            model: v.modelo,
            year: v.anio,
            section: v.seccion,
            status: v.estado,
            odometer: v.odometro,
            manager: v.encargado,
            assignedDriver: v.chofer,
            insuranceExpiration: v.vencimiento_seguro,
            vtvExpiration: v.vencimiento_vtv,
            patenteExpiration: v.vencimiento_patente,
            alerts: [] // Las alertas se calcularán dinámicamente
         }));
         setVehicles(mappedVehicles);
      }
      setLoading(false);
   };

   useEffect(() => {
      fetchVehicles();
   }, []);

   // 2. LOGICA PARA GUARDAR NUEVO ACTIVO
   const handleAddVehicle = async (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      const nuevoVehiculo = {
         tipo: newVehicleType,
         patente: formData.get('patente'),
         modelo: formData.get('modelo'),
         anio: parseInt(formData.get('anio') as string),
         seccion: formData.get('seccion'),
         encargado: formData.get('encargado'),
         chofer: formData.get('chofer'),
         odometro: parseInt(formData.get('odometro') as string || '0'),
         vencimiento_vtv: formData.get('vtv'),
         vencimiento_seguro: formData.get('seguro'),
         vencimiento_patente: formData.get('patente_fecha'),
      };

      const { error } = await supabase.from('vehiculos').insert([nuevoVehiculo]);

      if (error) {
         alert('Error al guardar: ' + error.message);
      } else {
         setIsModalOpen(false);
         fetchVehicles(); // Recargamos la lista
      }
   };

   const getExpirationStatus = (dateStr?: string) => {
      if (!dateStr) return 'ok';
      const today = new Date();
      const date = new Date(dateStr);
      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return 'expired';
      if (diffDays < 30) return 'warning';
      return 'ok';
   };

   const getIconByType = (type: string) => {
      switch (type) {
         case 'car': return 'directions_car';
         case 'truck': return 'local_shipping';
         case 'generator': return 'electric_bolt';
         default: return 'directions_car';
      }
   };

   if (loading) {
      return (
         <div className="flex items-center justify-center h-screen bg-background-dark">
            <div className="flex flex-col items-center gap-3">
               <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
               <p className="text-stone-500 font-bold">Cargando flota real...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
               <h2 className="text-2xl font-bold text-white tracking-tight">Listado de Activos</h2>
               <p className="text-sm text-stone-500 mt-1">Datos reales desde la nube de El Progreso.</p>
            </div>
            <button
               onClick={() => setIsModalOpen(true)}
               className="bg-primary hover:bg-primary-dark text-brand-dark font-bold text-sm px-4 py-2.5 rounded-md shadow-lg shadow-primary/20 flex items-center gap-2 transition-all w-full sm:w-auto justify-center"
            >
               <span className="material-symbols-outlined">add</span> Añadir Activo
            </button>
         </div>

         {/* --- VISTA DE TABLA DESKTOP --- */}
         <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-brand-dark border-b border-brand-border text-xs uppercase tracking-wider text-stone-500">
                        <th className="px-6 py-4 font-semibold">Identificación</th>
                        <th className="px-6 py-4 font-semibold">Sección y Encargado</th>
                        <th className="px-6 py-4 font-semibold">Documentación</th>
                        <th className="px-6 py-4 font-semibold">Uso Actual</th>
                        <th className="px-6 py-4 font-semibold">Estado</th>
                        <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                     {vehicles.length === 0 ? (
                        <tr>
                           <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                              No hay vehículos registrados. ¡Comienza añadiendo uno!
                           </td>
                        </tr>
                     ) : (
                        vehicles.map((v) => (
                           <tr key={v.id} className="hover:bg-brand-dark/50 transition-colors group">
                              <td className="px-6 py-4">
                                 <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded bg-brand-dark flex flex-shrink-0 items-center justify-center text-stone-500 border border-brand-border">
                                       <span className="material-symbols-outlined text-xl">{getIconByType(v.type)}</span>
                                    </div>
                                    <div>
                                       {v.patente && <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 mb-1 inline-block">{v.patente}</span>}
                                       <div className="text-sm font-bold text-stone-200">{v.model}</div>
                                       <div className="text-xs text-stone-500">{v.year}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col gap-1">
                                    <span className="inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-brand-dark/30 text-stone-300 border-brand-border">{v.section}</span>
                                    <div className="text-xs text-stone-300 font-medium">{v.manager}</div>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 {v.type !== 'generator' && (
                                    <div className="flex gap-2">
                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${getExpirationStatus(v.insuranceExpiration) === 'expired' ? 'bg-rose-500/10 text-rose-500 border-rose-500/50' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 opacity-40'}`} title="Seguro">
                                          <span className="material-symbols-outlined text-sm">security</span>
                                       </div>
                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${getExpirationStatus(v.vtvExpiration) === 'expired' ? 'bg-rose-500/10 text-rose-500 border-rose-500/50' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 opacity-40'}`} title="VTV">
                                          <span className="material-symbols-outlined text-sm">verified</span>
                                       </div>
                                    </div>
                                 )}
                              </td>
                              <td className="px-6 py-4 font-mono text-sm text-stone-300">
                                 {v.odometer.toLocaleString()} {v.type === 'generator' ? 'Hrs' : 'km'}
                              </td>
                              <td className="px-6 py-4">
                                 <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {v.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <Link to={`/fleet/${v.id}`} className="text-stone-500 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">visibility</span>
                                 </Link>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* --- MODAL DE ALTA REAL --- */}
         {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
               <div className="relative w-full max-w-2xl bg-brand-surface rounded-xl border border-brand-border shadow-2xl flex flex-col max-h-[95vh]">
                  <form onSubmit={handleAddVehicle}>
                     <div className="px-6 py-5 border-b border-brand-border flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white">Nuevo Activo</h3>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                     </div>

                     <div className="p-8 space-y-6 overflow-y-auto">
                        {/* Selector de Tipo */}
                        <div className="flex gap-4 mb-6">
                           {['car', 'truck', 'generator'].map(t => (
                              <button key={t} type="button" onClick={() => setNewVehicleType(t as any)} className={`flex-1 p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${newVehicleType === t ? 'border-primary bg-primary/10 text-white' : 'border-brand-border text-stone-500'}`}>
                                 <span className="material-symbols-outlined">{getIconByType(t)}</span>
                                 <span className="text-[10px] font-bold uppercase">{t}</span>
                              </button>
                           ))}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <input name="modelo" required placeholder="Modelo (Ej: Scania G340)" className="col-span-2 bg-brand-dark border border-brand-border rounded-lg h-10 px-3 text-white" />
                           {newVehicleType !== 'generator' && <input name="patente" required placeholder="Patente" className="bg-brand-dark border border-brand-border rounded-lg h-10 px-3 text-white font-mono uppercase" />}
                           <input name="anio" type="number" placeholder="Año" className="bg-brand-dark border border-brand-border rounded-lg h-10 px-3 text-white" />
                           <input name="odometro" type="number" placeholder={newVehicleType === 'generator' ? "Horas" : "Km"} className="bg-brand-dark border border-brand-border rounded-lg h-10 px-3 text-white" />
                           <select name="seccion" className="bg-brand-dark border border-brand-border rounded-lg h-10 px-3 text-white">
                              <option>Cereales</option><option>Agronomía</option><option>Logística</option><option>Administración</option>
                           </select>
                           <input name="encargado" placeholder="Encargado" className="bg-brand-dark border border-brand-border rounded-lg h-10 px-3 text-white" />
                           <input name="chofer" placeholder="Chofer" className="bg-brand-dark border border-brand-border rounded-lg h-10 px-3 text-white" />
                        </div>

                        {newVehicleType !== 'generator' && (
                           <div className="space-y-4 pt-4 border-t border-brand-border">
                              <div className="grid grid-cols-2 gap-4">
                                 <div><label className="text-[10px] text-stone-500 font-bold uppercase">Venc. VTV</label><input name="vtv" type="date" className="w-full bg-brand-dark border-brand-border rounded h-10 px-3 text-white" /></div>
                                 <div><label className="text-[10px] text-stone-500 font-bold uppercase">Venc. Seguro</label><input name="seguro" type="date" className="w-full bg-brand-dark border-brand-border rounded h-10 px-3 text-white" /></div>
                              </div>
                           </div>
                        )}
                     </div>

                     <div className="p-6 border-t border-brand-border flex justify-end gap-3 bg-brand-surface">
                        <button type="submit" className="px-8 py-2 bg-primary text-brand-dark rounded-lg font-bold text-sm uppercase shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors">
                           Guardar en la Nube
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default Fleet;