import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Vehicle, MaintenanceLog } from '../types';
import { supabase } from '../supabase';

const VehicleDetail = () => {
   const { id } = useParams();
   const [loading, setLoading] = useState(true);
   const [vehicle, setVehicle] = useState<Vehicle | null>(null);
   const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceLog[]>([]);

   // ESTADOS PARA PAGINACIÓN
   const [displayLimit, setDisplayLimit] = useState(10);
   const [hasMore, setHasMore] = useState(false);

   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
   const [docUpdateModal, setDocUpdateModal] = useState<{ isOpen: boolean; type: string; current: string } | null>(null);

   // 1. CARGAR DATOS REALES CON LÍMITE
   const fetchVehicleData = async () => {
      setLoading(true);

      // Traer datos del vehículo
      const { data: vData } = await supabase
         .from('vehiculos')
         .select('*')
         .eq('id', id)
         .single();

      if (vData) {
         setVehicle({
            id: vData.id,
            type: vData.tipo,
            patente: vData.patente,
            model: vData.model,
            year: vData.year,
            section: vData.section,
            status: vData.status,
            odometer: vData.odometer,
            manager: vData.manager,
            assignedDriver: vData.assigned_driver,
            insuranceExpiration: vData.insurance_expiration,
            vtvExpiration: vData.vtv_expiration,
            patenteExpiration: vData.patente_expiration,
            alerts: []
         });

         // Traer historial con límite (+1 para verificar si hay más)
         const { data: mData } = await supabase
            .from('mantenimientos')
            .select('*')
            .eq('vehicle_id', id)
            .order('date', { ascending: false })
            .limit(displayLimit + 1);

         if (mData) {
            const more = mData.length > displayLimit;
            setHasMore(more);
            const finalData = more ? mData.slice(0, displayLimit) : mData;

            setMaintenanceHistory(finalData.map(m => ({
               id: m.id,
               date: m.date,
               vehicleId: m.vehicle_id,
               vehicleName: vData.model,
               type: m.type,
               description: m.description,
               provider: m.provider,
               cost: m.cost,
               status: m.status
            })));
         }
      }
      setLoading(false);
   };

   useEffect(() => {
      fetchVehicleData();
   }, [id, displayLimit]);

   // 2. ACTUALIZAR DATOS
   const handleUpdateVehicle = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!vehicle) return;
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      const { error } = await supabase
         .from('vehiculos')
         .update({
            model: formData.get('model'),
            year: parseInt(formData.get('year') as string),
            odometer: parseInt(formData.get('odometer') as string),
            status: formData.get('status'),
            section: formData.get('section'),
            manager: formData.get('manager'),
            assigned_driver: formData.get('assignedDriver')
         })
         .eq('id', id);

      if (error) alert('Error: ' + error.message);
      else { setIsEditModalOpen(false); fetchVehicleData(); }
   };

   const handleUpdateDoc = async (newDate: string) => {
      if (!docUpdateModal || !vehicle) return;
      const columnMap: { [key: string]: string } = {
         'Seguro': 'insurance_expiration', 'VTV': 'vtv_expiration', 'Patente': 'patente_expiration'
      };
      const { error } = await supabase.from('vehiculos').update({ [columnMap[docUpdateModal.type]]: newDate }).eq('id', id);
      if (error) alert('Error: ' + error.message);
      else { setDocUpdateModal(null); fetchVehicleData(); }
   };

   if (loading) return <div className="h-screen flex items-center justify-center bg-background-dark"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
   if (!vehicle) return <div className="p-6 text-white text-center">Vehículo no encontrado.</div>;

   const isGenerator = vehicle.type === 'generator';
   const getIconByType = (type: string) => {
      switch (type) {
         case 'car': return 'directions_car';
         case 'truck': return 'local_shipping';
         case 'generator': return 'electric_bolt';
         default: return 'directions_car';
      }
   };

   const ExpirationCard = ({ title, date, icon, colorClass, borderClass, textClass, type }: any) => {
      if (!date) return (
         <button onClick={() => setDocUpdateModal({ isOpen: true, type, current: '' })} className="w-full text-left bg-brand-surface border border-dashed border-stone-700 rounded-lg p-4 flex items-center justify-between opacity-50 hover:opacity-100 transition-all">
            <div className="text-xs text-stone-500 uppercase font-bold tracking-wider">Cargar {title}</div>
            <span className="material-symbols-outlined">add_circle</span>
         </button>
      );
      const daysLeft = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const isExpired = daysLeft < 0;
      return (
         <button onClick={() => setDocUpdateModal({ isOpen: true, type, current: date })} className={`w-full text-left bg-brand-surface border ${borderClass} rounded-lg p-4 flex items-center justify-between relative overflow-hidden group hover:bg-brand-dark/30 transition-all`}>
            <div className={`absolute right-0 top-0 p-4 opacity-10 ${textClass}`}><span className="material-symbols-outlined text-6xl">{icon}</span></div>
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-[1px]">
               <div className="bg-brand-surface border border-brand-border px-4 py-2 rounded-full shadow-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-sm">edit_calendar</span>
                  <span className="text-xs font-bold text-white uppercase">Renovar</span>
               </div>
            </div>
            <div className="relative z-10">
               <p className="text-xs text-stone-400 uppercase font-bold tracking-wider mb-1">{title}</p>
               <p className={`text-lg font-mono font-bold ${textClass}`}>{new Date(date).toLocaleDateString()}</p>
               <p className={`text-[10px] mt-1 font-medium ${isExpired ? 'text-rose-500' : 'text-stone-500'}`}>{isExpired ? `Vencido hace ${Math.abs(daysLeft)} días` : `Vence en ${daysLeft} días`}</p>
            </div>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorClass} ${textClass}`}><span className="material-symbols-outlined">{icon}</span></div>
         </button>
      );
   };

   return (
      <div className="p-6 max-w-7xl mx-auto">
         {/* Breadcrumbs */}
         <nav className="flex items-center gap-2 text-sm mb-6">
            <Link to="/fleet" className="text-stone-500 hover:text-white">Flota</Link>
            <span className="material-symbols-outlined text-stone-600 text-xs">chevron_right</span>
            <span className="text-stone-500">{vehicle.section}</span>
            <span className="material-symbols-outlined text-stone-600 text-xs">chevron_right</span>
            <span className="text-primary font-medium">{vehicle.patente?.toUpperCase() || vehicle.model}</span>
         </nav>

         {/* Identity Header */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            <div className="lg:col-span-8 bg-brand-surface border border-brand-border rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
               <div className="w-full md:w-auto flex flex-col items-center">
                  <div className="w-32 h-32 rounded-lg bg-stone-900 border border-brand-border flex items-center justify-center text-stone-600 mb-3"><span className="material-symbols-outlined text-6xl">{getIconByType(vehicle.type)}</span></div>
                  {vehicle.patente && <div className="px-3 py-1 bg-primary text-brand-dark font-mono font-bold text-lg rounded">{vehicle.patente.toUpperCase()}</div>}
               </div>
               <div className="flex-1 w-full text-center md:text-left">
                  <div className="mb-6">
                     <h1 className="text-3xl font-bold text-white mb-1">{vehicle.model}</h1>
                     <p className="text-stone-400">{vehicle.year} • {vehicle.odometer.toLocaleString()} {isGenerator ? 'Hrs' : 'km'}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="bg-brand-dark/50 p-3 rounded border border-brand-border flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-400"><span className="material-symbols-outlined">badge</span></div>
                        <div><p className="text-[10px] uppercase text-stone-500 font-bold">Encargado de Sección</p><p className="text-white font-medium">{vehicle.manager}</p></div>
                     </div>
                     {!isGenerator && <div className="bg-brand-dark/50 p-3 rounded border border-brand-border flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-400"><span className="material-symbols-outlined">sports_motorsports</span></div>
                        <div><p className="text-[10px] uppercase text-stone-500 font-bold">Chofer Asignado</p><p className="text-white font-medium">{vehicle.assignedDriver || 'Sin asignar'}</p></div>
                     </div>}
                  </div>
               </div>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-4">
               <div className="flex-1 bg-brand-surface border border-brand-border rounded-xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
                  <div className={`absolute inset-0 opacity-5 ${vehicle.status === 'Activo' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-2">Estado Actual</h3>
                  <span className={`text-2xl font-bold mb-1 ${vehicle.status === 'Activo' ? 'text-emerald-500' : 'text-amber-500'}`}>{vehicle.status}</span>
               </div>
               <button onClick={() => setIsEditModalOpen(true)} className="w-full bg-primary hover:bg-primary-dark text-brand-dark font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/10"><span className="material-symbols-outlined">edit_document</span> Editar Datos</button>
            </div>
         </div>

         {/* Documentation */}
         {!isGenerator && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
               <ExpirationCard title="Seguro Automotor" date={vehicle.insuranceExpiration} icon="security" type="Seguro" colorClass="bg-emerald-500/10" borderClass="border-emerald-500/20" textClass="text-emerald-500" />
               <ExpirationCard title="VTV / Técnica" date={vehicle.vtvExpiration} icon="verified" type="VTV" colorClass="bg-amber-500/10" borderClass="border-amber-500/50" textClass="text-amber-500" />
               <ExpirationCard title="Patente" date={vehicle.patenteExpiration} icon="badge" type="Patente" colorClass="bg-emerald-500/10" borderClass="border-emerald-500/20" textClass="text-emerald-500" />
            </div>
         )}

         {/* HISTORIAL TÉCNICO CON SCROLL Y PAGINACIÓN */}
         <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden flex flex-col shadow-lg">
            <div className="p-4 border-b border-brand-border bg-brand-dark/30 flex justify-between items-center">
               <h2 className="text-white font-bold flex items-center gap-2"><span className="material-symbols-outlined text-stone-400">build</span> Historial Técnico</h2>
            </div>

            <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
               <table className="w-full text-left text-sm border-separate border-spacing-0">
                  <thead className="bg-brand-dark text-xs uppercase font-medium text-stone-500 sticky top-0 z-10">
                     <tr>
                        <th className="px-6 py-4 bg-brand-dark border-b border-brand-border">Fecha</th>
                        <th className="px-6 py-4 bg-brand-dark border-b border-brand-border">Categoría</th>
                        <th className="px-6 py-4 bg-brand-dark border-b border-brand-border">Descripción</th>
                        <th className="px-6 py-4 bg-brand-dark border-b border-brand-border text-right">Costo</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border text-stone-300">
                     {maintenanceHistory.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-8 text-center text-stone-500 italic">Sin registros técnicos.</td></tr>
                     ) : (
                        maintenanceHistory.map((log) => (
                           <tr key={log.id} className="hover:bg-brand-dark/30 transition-colors">
                              <td className="px-6 py-4 font-mono text-stone-400 whitespace-nowrap">{new Date(log.date).toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                 <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase border ${log.type === 'Mantenimiento' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>{log.type}</span>
                              </td>
                              <td className="px-6 py-4 font-medium text-white">{log.description}</td>
                              <td className="px-6 py-4 text-right font-mono font-bold text-white whitespace-nowrap">${log.cost.toLocaleString()}</td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>

               {/* BOTÓN CARGAR MÁS */}
               {hasMore && (
                  <div className="p-4 bg-brand-dark/10 flex justify-center border-t border-brand-border">
                     <button onClick={() => setDisplayLimit(prev => prev + 10)} className="text-primary text-xs font-bold uppercase hover:bg-primary/10 px-4 py-2 rounded-lg transition-all flex items-center gap-2 border border-primary/20">
                        <span className="material-symbols-outlined text-sm">expand_more</span> Cargar registros anteriores
                     </button>
                  </div>
               )}
               {maintenanceHistory.length > 0 && !hasMore && (
                  <div className="p-4 text-center border-t border-brand-border"><p className="text-[10px] text-stone-600 uppercase font-bold tracking-widest">Fin del historial</p></div>
               )}
            </div>
         </div>

         {/* EDIT MODAL */}
         {isEditModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}>
               <div className="bg-brand-surface w-full max-w-2xl rounded-xl border border-brand-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-dark/50">
                     <h3 className="text-white font-bold text-lg">Editar Datos</h3>
                     <button onClick={() => setIsEditModalOpen(false)} className="text-stone-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                  </div>
                  <form onSubmit={handleUpdateVehicle} className="p-6 space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1"><label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Modelo</label><input name="model" type="text" defaultValue={vehicle.model} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary outline-none" /></div>
                        <div className="col-span-1"><label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Año</label><input name="year" type="number" defaultValue={vehicle.year} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary outline-none" /></div>
                        <div className="col-span-1"><label className="text-xs font-bold text-stone-500 uppercase mb-1 block">{isGenerator ? 'Horas' : 'Odómetro (Km)'}</label><input name="odometer" type="number" defaultValue={vehicle.odometer} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary outline-none" /></div>
                        <div className="col-span-1"><label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Estado</label><select name="status" defaultValue={vehicle.status} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary outline-none"><option>Activo</option><option>En Taller</option><option>Baja</option></select></div>
                     </div>
                     <div className="border-t border-brand-border pt-4 grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Sección</label><select name="section" defaultValue={vehicle.section} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary outline-none"><option>Administración</option><option>Cereales</option><option>Agronomía</option><option>Logística</option><option>Hacienda</option><option>Estación de Servicio</option></select></div>
                        <div><label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Encargado</label><input name="manager" type="text" defaultValue={vehicle.manager} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary outline-none" /></div>
                        {!isGenerator && <div className="col-span-2"><label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Chofer Asignado</label><input name="assignedDriver" type="text" defaultValue={vehicle.assignedDriver} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary outline-none" /></div>}
                     </div>
                     <div className="flex justify-end pt-2"><button type="submit" className="bg-primary text-brand-dark font-bold px-8 py-2 rounded-lg text-sm">Guardar Cambios</button></div>
                  </form>
               </div>
            </div>
         )}

         {/* RENEW MODAL */}
         {docUpdateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setDocUpdateModal(null)}>
               <div className="bg-brand-surface w-full max-w-sm rounded-xl border border-brand-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-dark/50">
                     <h3 className="text-white font-bold text-lg">Renovar {docUpdateModal.type}</h3>
                     <button onClick={() => setDocUpdateModal(null)} className="text-stone-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                  </div>
                  <div className="p-6">
                     <label className="text-xs font-bold text-stone-500 uppercase mb-2 block">Nueva Fecha de Vencimiento</label>
                     <input type="date" id="docDate" className="w-full bg-brand-dark border-brand-border rounded-lg h-12 px-3 text-white mb-6 focus:ring-1 focus:ring-primary outline-none" />
                     <button onClick={() => { const val = (document.getElementById('docDate') as HTMLInputElement).value; if (val) handleUpdateDoc(val); }} className="w-full bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"><span className="material-symbols-outlined">update</span> Confirmar</button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default VehicleDetail;