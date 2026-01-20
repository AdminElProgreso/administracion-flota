import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Vehicle } from '../types';
import { supabase } from '../supabase'; // Conexión real

const Fleet = () => {
   // 1. Estados para datos reales
   const [vehicles, setVehicles] = useState<Vehicle[]>([]);
   const [loading, setLoading] = useState(true);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [newVehicleType, setNewVehicleType] = useState<'car' | 'truck' | 'generator'>('car');

   // 2. Función para cargar datos de Supabase
   const fetchVehicles = async () => {
      setLoading(true);
      const { data, error } = await supabase
         .from('vehiculos')
         .select('*')
         .order('created_at', { ascending: false });

      if (error) {
         console.error('Error:', error);
      } else if (data) {
         // Mapeamos los datos de la DB (snake_case) al formato de tu App (camelCase)
         const mapped: Vehicle[] = data.map(v => ({
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
            alerts: []
         }));
         setVehicles(mapped);
      }
      setLoading(false);
   };

   useEffect(() => {
      fetchVehicles();
   }, []);

   // 3. Función para guardar (usando FormData para no romper el modal)
   const handleAddVehicle = async (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      const nuevoVehiculo = {
         tipo: newVehicleType,
         patente: formData.get('patente'),
         modelo: formData.get('modelo'),
         anio: parseInt(formData.get('anio') as string) || new Date().getFullYear(),
         seccion: formData.get('seccion'),
         encargado: formData.get('encargado'),
         chofer: formData.get('chofer'),
         odometro: parseInt(formData.get('odometro') as string) || 0,
         vencimiento_vtv: formData.get('vtv_date') || null,
         vencimiento_seguro: formData.get('seguro_date') || null,
         vencimiento_patente: formData.get('patente_date') || null,
         estado: 'Activo'
      };

      const { error } = await supabase.from('vehiculos').insert([nuevoVehiculo]);

      if (error) {
         alert('Error al guardar: ' + error.message);
      } else {
         setIsModalOpen(false);
         fetchVehicles();
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
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
   }

   return (
      <div className="p-4 md:p-6 pb-24 md:pb-6">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
               <h2 className="text-2xl font-bold text-white tracking-tight">Listado de Activos</h2>
               <p className="text-sm text-stone-500 mt-1">Gestión de vehículos, responsables y vencimientos.</p>
            </div>
            <button
               onClick={() => setIsModalOpen(true)}
               className="bg-primary hover:bg-primary-dark text-brand-dark font-bold text-sm px-4 py-2.5 rounded-md shadow-lg shadow-primary/20 flex items-center gap-2 transition-all w-full sm:w-auto justify-center"
            >
               <span className="material-symbols-outlined">add</span> Añadir Activo
            </button>
         </div>

         {/* Filter Bar */}
         <div className="bg-brand-surface border border-brand-border rounded-xl p-4 mb-6 shadow-xl">
            <div className="flex flex-wrap gap-4 items-center">
               <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-500 uppercase">Sección:</span>
                  <select className="bg-brand-dark border-brand-border text-stone-300 text-xs rounded p-1.5 focus:ring-1 focus:ring-primary focus:border-primary">
                     <option>Todas</option>
                     <option>Cereales</option>
                     <option>Logística</option>
                     <option>Agronomía</option>
                  </select>
               </div>
               <div className="w-px h-8 bg-brand-border hidden sm:block"></div>
               <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-500 uppercase">Tipo:</span>
                  <select className="bg-brand-dark border-brand-border text-stone-300 text-xs rounded p-1.5 focus:ring-1 focus:ring-primary focus:border-primary">
                     <option>Todos</option>
                     <option>Autos/Camionetas</option>
                     <option>Camiones</option>
                     <option>Generadores</option>
                  </select>
               </div>
            </div>
         </div>

         {/* --- MOBILE VIEW --- */}
         <div className="lg:hidden space-y-4">
            {vehicles.map((v) => {
               const insStatus = getExpirationStatus(v.insuranceExpiration);
               const vtvStatus = getExpirationStatus(v.vtvExpiration);
               const isGenerator = v.type === 'generator';
               return (
                  <div key={v.id} className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-lg relative overflow-hidden">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded-lg bg-brand-dark border border-brand-border flex items-center justify-center text-stone-500">
                              <span className="material-symbols-outlined text-2xl">{getIconByType(v.type)}</span>
                           </div>
                           <div>
                              <h3 className="text-white font-bold text-lg leading-tight">{v.model}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                 {v.patente && <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">{v.patente}</span>}
                                 <span className="text-stone-500 text-xs font-mono">{v.year}</span>
                              </div>
                           </div>
                        </div>
                        <span className={`flex-shrink-0 w-3 h-3 rounded-full shadow-lg shadow-black/50 ${v.status === 'Activo' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                     </div>
                     <div className="space-y-3 mb-5 bg-brand-dark/30 rounded-lg p-3 border border-brand-border/50">
                        <div className="flex justify-between items-center border-b border-brand-border/50 pb-2">
                           <span className="text-stone-500 text-xs uppercase font-bold">Sección</span>
                           <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-dark text-stone-300">{v.section}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-brand-border/50 pb-2">
                           <span className="text-stone-500 text-xs uppercase font-bold">Encargado</span>
                           <span className="text-stone-300 text-sm font-medium">{v.manager}</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-stone-500 text-xs uppercase font-bold">Uso</span>
                           <span className="text-stone-300 font-mono text-sm font-bold">{v.odometer.toLocaleString()} {isGenerator ? 'Hrs' : 'km'}</span>
                        </div>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                           {!isGenerator && (
                              <>
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${insStatus === 'expired' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500 opacity-40'}`}><span className="material-symbols-outlined text-sm">security</span></div>
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${vtvStatus === 'expired' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500 opacity-40'}`}><span className="material-symbols-outlined text-sm">verified</span></div>
                              </>
                           )}
                        </div>
                        <Link to={`/fleet/${v.id}`} className="px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-sm text-stone-300 font-bold flex items-center gap-1">Ver Ficha <span className="material-symbols-outlined text-sm">chevron_right</span></Link>
                     </div>
                  </div>
               );
            })}
         </div>

         {/* --- DESKTOP VIEW --- */}
         <div className="hidden lg:block bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-2xl">
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
                  {vehicles.map((v) => (
                     <tr key={v.id} className="hover:bg-brand-dark/50 transition-colors group">
                        <td className="px-6 py-4">
                           <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded bg-brand-dark flex items-center justify-center text-stone-500 border border-brand-border"><span className="material-symbols-outlined text-xl">{getIconByType(v.type)}</span></div>
                              <div>
                                 {v.patente && <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 mb-1 inline-block">{v.patente}</span>}
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
                        <td className="px-6 py-4">
                           {v.type !== 'generator' && (
                              <div className="flex gap-2">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${getExpirationStatus(v.insuranceExpiration) === 'expired' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500 opacity-40'}`}><span className="material-symbols-outlined text-sm">security</span></div>
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${getExpirationStatus(v.vtvExpiration) === 'expired' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500 opacity-40'}`}><span className="material-symbols-outlined text-sm">verified</span></div>
                              </div>
                           )}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-stone-300">{v.odometer.toLocaleString()} {v.type === 'generator' ? 'Hrs' : 'km'}</td>
                        <td className="px-6 py-4">
                           <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${v.status === 'Activo' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'Activo' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>{v.status}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right"><Link to={`/fleet/${v.id}`} className="text-stone-500 hover:text-white transition-colors mr-2"><span className="material-symbols-outlined">visibility</span></Link></td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* --- MODAL DE ALTA (TU DISEÑO ORIGINAL) --- */}
         {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
               <div className="relative w-full max-w-4xl bg-brand-surface rounded-xl border border-brand-border shadow-2xl flex flex-col max-h-[95vh]">
                  <form onSubmit={handleAddVehicle} className="flex flex-col h-full">
                     <div className="flex items-center justify-between px-6 py-5 border-b border-brand-border">
                        <div>
                           <h3 className="text-xl font-bold text-white">Alta de Activo</h3>
                           <p className="text-xs text-stone-400">Seleccione el tipo y complete los datos</p>
                        </div>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                     </div>

                     <div className="flex-1 overflow-y-auto p-8">
                        <div className="grid grid-cols-3 gap-4 mb-8">
                           <button type="button" onClick={() => setNewVehicleType('car')} className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${newVehicleType === 'car' ? 'border-primary bg-primary/10 text-white' : 'border-brand-border bg-brand-dark/30 text-stone-500'}`}><span className="material-symbols-outlined text-3xl mb-2">directions_car</span><span className="text-xs font-bold uppercase">Auto / Camioneta</span></button>
                           <button type="button" onClick={() => setNewVehicleType('truck')} className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${newVehicleType === 'truck' ? 'border-primary bg-primary/10 text-white' : 'border-brand-border bg-brand-dark/30 text-stone-500'}`}><span className="material-symbols-outlined text-3xl mb-2">local_shipping</span><span className="text-xs font-bold uppercase">Camión</span></button>
                           <button type="button" onClick={() => setNewVehicleType('generator')} className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${newVehicleType === 'generator' ? 'border-primary bg-primary/10 text-white' : 'border-brand-border bg-brand-dark/30 text-stone-500'}`}><span className="material-symbols-outlined text-3xl mb-2">electric_bolt</span><span className="text-xs font-bold uppercase">Grupo Electrógeno</span></button>
                        </div>

                        <div className={`grid grid-cols-1 ${newVehicleType === 'generator' ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-8`}>
                           <div className="space-y-6">
                              <h4 className="text-primary font-bold text-sm uppercase tracking-wider border-b border-brand-border pb-2">1. Datos y Responsables</h4>
                              <div className="grid grid-cols-2 gap-4">
                                 {newVehicleType !== 'generator' && (
                                    <div className="col-span-1">
                                       <label className="text-xs text-stone-400 mb-1 block">Patente <span className="text-red-500">*</span></label>
                                       <input name="patente" required className="w-full bg-brand-dark border-brand-border rounded-lg text-white font-mono uppercase text-center h-10 border focus:border-primary focus:ring-0" placeholder="AA 000 BB" />
                                    </div>
                                 )}
                                 <div className={newVehicleType === 'generator' ? 'col-span-2' : 'col-span-1'}>
                                    <label className="text-xs text-stone-400 mb-1 block">{newVehicleType === 'generator' ? 'Horas de Uso Actual' : 'Kilometraje Actual'}</label>
                                    <input name="odometro" type="number" className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white border focus:border-primary focus:ring-0" placeholder="0" />
                                 </div>
                                 <div className="col-span-1">
                                    <label className="text-xs text-stone-400 mb-1 block">Modelo</label>
                                    <input name="modelo" required className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white border focus:border-primary focus:ring-0" placeholder="Ej. Hilux SRV" />
                                 </div>
                                 <div className="col-span-1">
                                    <label className="text-xs text-stone-400 mb-1 block">Año</label>
                                    <input name="anio" type="number" className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white border focus:border-primary focus:ring-0" placeholder="2024" />
                                 </div>
                              </div>

                              <div className="bg-brand-dark/30 p-4 rounded-lg border border-brand-border">
                                 <div className="mb-3">
                                    <label className="text-xs text-stone-400 mb-1 block">Sección Operativa <span className="text-red-500">*</span></label>
                                    <select name="seccion" className="w-full bg-brand-surface border-brand-border rounded-lg text-white h-10 px-3 border focus:border-primary focus:ring-0">
                                       <option>Administración</option><option>Cereales</option><option>Agronomía</option><option>Logística</option><option>Estación de Servicio</option>
                                    </select>
                                 </div>
                                 <div className="mb-3">
                                    <label className="text-xs text-stone-400 mb-1 block">Encargado de Sección <span className="text-red-500">*</span></label>
                                    <input name="encargado" className="w-full bg-brand-surface border-brand-border rounded-lg text-white h-10 px-3 border focus:border-primary focus:ring-0" placeholder="Nombre" />
                                 </div>
                                 {newVehicleType !== 'generator' && (
                                    <div>
                                       <label className="text-xs text-stone-400 mb-1 block">Chofer Asignado (Opcional)</label>
                                       <input name="chofer" className="w-full bg-brand-surface border-brand-border rounded-lg text-white h-10 px-3 border focus:border-primary focus:ring-0" />
                                    </div>
                                 )}
                              </div>
                           </div>

                           {newVehicleType !== 'generator' && (
                              <div className="space-y-6">
                                 <h4 className="text-primary font-bold text-sm uppercase tracking-wider border-b border-brand-border pb-2">2. Documentación y Vencimientos</h4>
                                 <div className="space-y-4">
                                    <div className="bg-brand-dark/30 p-4 rounded-lg border border-brand-border hover:border-emerald-500/30">
                                       <div className="flex items-center gap-2 mb-3"><span className="material-symbols-outlined text-emerald-500">verified</span><span className="text-white font-bold text-sm">VTV / Revisión Técnica</span></div>
                                       <label className="text-xs text-stone-500 mb-1 block">Fecha de Vencimiento</label>
                                       <input name="vtv_date" type="date" className="w-full bg-brand-surface border-brand-border rounded-lg h-10 px-3 text-white focus:border-emerald-500 focus:ring-0" />
                                    </div>
                                    <div className="bg-brand-dark/30 p-4 rounded-lg border border-brand-border hover:border-blue-500/30">
                                       <div className="flex items-center gap-2 mb-3"><span className="material-symbols-outlined text-blue-500">security</span><span className="text-white font-bold text-sm">Seguro Automotor</span></div>
                                       <div className="grid grid-cols-2 gap-3">
                                          <div><label className="text-xs text-stone-500 mb-1 block">Compañía</label><input name="seguro_cia" className="w-full bg-brand-surface border-brand-border rounded-lg h-10 px-3 text-white focus:border-blue-500 focus:ring-0" /></div>
                                          <div><label className="text-xs text-stone-500 mb-1 block">Vencimiento</label><input name="seguro_date" type="date" className="w-full bg-brand-surface border-brand-border rounded-lg h-10 px-3 text-white focus:border-blue-500 focus:ring-0" /></div>
                                       </div>
                                    </div>
                                    <div className="bg-brand-dark/30 p-4 rounded-lg border border-brand-border hover:border-white/30">
                                       <div className="flex items-center gap-2 mb-3"><span className="material-symbols-outlined text-white">badge</span><span className="text-white font-bold text-sm">Patente / Impuestos</span></div>
                                       <label className="text-xs text-stone-500 mb-1 block">Próximo Vencimiento</label>
                                       <input name="patente_date" type="date" className="w-full bg-brand-surface border-brand-border rounded-lg text-white h-10 px-3 focus:border-white focus:ring-0" />
                                    </div>
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="p-6 border-t border-brand-border flex justify-end gap-3 bg-brand-surface rounded-b-xl">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-stone-400 hover:text-white font-bold uppercase">Cancelar</button>
                        <button type="submit" className="px-8 py-2 bg-primary text-brand-dark rounded-lg font-bold text-sm uppercase shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors">Guardar en la Nube</button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default Fleet;