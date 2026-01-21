import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Vehicle, MaintenanceLog } from '../types';
import { supabase } from '../supabase';

const VehicleDetail = () => {
   const { id } = useParams();
   const [loading, setLoading] = useState(true);
   const [vehicle, setVehicle] = useState<any>(null);
   const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceLog[]>([]);

   const [displayLimit, setDisplayLimit] = useState(10);
   const [hasMore, setHasMore] = useState(false);

   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
   const [deleteConfirmText, setDeleteConfirmText] = useState('');

   const [docUpdateModal, setDocUpdateModal] = useState<{
      isOpen: boolean;
      type: 'Seguro' | 'VTV' | 'Patente';
      currentDoc: string;
      currentAppt: string
   } | null>(null);

   const fetchVehicleData = async () => {
      setLoading(true);
      const { data: vData } = await supabase.from('vehiculos').select('*').eq('id', id).single();

      if (vData) {
         setVehicle(vData);

         const { data: mData } = await supabase.from('mantenimientos')
            .select('*').eq('vehicle_id', id).order('date', { ascending: false }).limit(displayLimit + 1);

         if (mData) {
            const more = mData.length > displayLimit;
            setHasMore(more);
            const finalData = more ? mData.slice(0, displayLimit) : mData;
            setMaintenanceHistory(finalData.map(m => ({
               id: m.id, date: m.date, vehicleId: m.vehicle_id, vehicleName: vData.model,
               type: m.type, description: m.description, provider: m.provider, cost: m.cost, status: m.status
            })));
         }
      }
      setLoading(false);
   };

   useEffect(() => { fetchVehicleData(); }, [id, displayLimit]);

   const handleUpdateVehicle = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!vehicle) return;
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      const { error } = await supabase.from('vehiculos').update({
         patente: formData.get('patente')?.toString().toUpperCase(),
         model: formData.get('model'),
         year: parseInt(formData.get('year') as string),
         odometer: parseInt(formData.get('odometer') as string),
         status: formData.get('status'),
         section: formData.get('section'),
         manager: formData.get('manager'),
         assigned_driver: formData.get('assignedDriver')
      }).eq('id', id);

      if (error) alert('Error: ' + error.message);
      else { setIsEditModalOpen(false); fetchVehicleData(); }
   };

   const handleDeleteVehicle = async () => {
      if (deleteConfirmText !== 'borrar') return;
      await supabase.from('mantenimientos').delete().eq('vehicle_id', id);
      const { error } = await supabase.from('vehiculos').delete().eq('id', id);
      if (error) alert('Error al eliminar: ' + error.message);
      else { window.location.hash = '/fleet'; }
   };

   const handleUpdateDoc = async (newDocDate: string, newApptDate: string) => {
      if (!docUpdateModal) return;

      const columnMap = {
         'Seguro': { doc: 'insurance_expiration', appt: 'insurance_appointment' },
         'VTV': { doc: 'vtv_expiration', appt: 'vtv_appointment' },
         'Patente': { doc: 'patente_expiration', appt: 'patente_appointment' }
      };

      const fields = columnMap[docUpdateModal.type];

      const { error } = await supabase.from('vehiculos').update({
         [fields.doc]: newDocDate || null,
         [fields.appt]: newApptDate || null
      }).eq('id', id);

      if (error) alert('Error: ' + error.message);
      else { setDocUpdateModal(null); fetchVehicleData(); }
   };

   if (loading) return <div className="h-screen flex items-center justify-center bg-background-dark"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
   if (!vehicle) return <div className="p-6 text-white text-center">Vehículo no encontrado.</div>;

   const isGenerator = vehicle.tipo === 'generator';

   const ExpirationCard = ({ title, date, appointment, icon, type }: any) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiry = date ? new Date(date + 'T00:00:00') : null;
      const appt = appointment ? new Date(appointment + 'T00:00:00') : null;

      let colorClass = "text-emerald-500";
      let borderClass = "border-emerald-500/20";
      let bgClass = "bg-emerald-500/10";
      let statusText = "Al día";

      if (appt) {
         colorClass = "text-blue-400";
         borderClass = "border-blue-400/50";
         bgClass = "bg-blue-400/10";
         statusText = `Turno: ${appt.toLocaleDateString()}`;
      } else if (expiry) {
         const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
         if (diffDays < 0) {
            colorClass = "text-rose-500";
            borderClass = "border-rose-500/50";
            bgClass = "bg-rose-500/10";
            statusText = "Vencido";
         } else if (diffDays <= 15) {
            colorClass = "text-amber-500";
            borderClass = "border-amber-500/50";
            bgClass = "bg-amber-500/10";
            statusText = "Vence pronto";
         }
      }

      return (
         <button
            onClick={() => setDocUpdateModal({
               isOpen: true,
               type,
               currentDoc: date || '',
               currentAppt: appointment || ''
            })}
            className={`w-full text-left bg-brand-surface border ${borderClass} rounded-lg p-4 flex items-center justify-between relative overflow-hidden group hover:bg-brand-dark/30 transition-all`}
         >
            <div className={`absolute right-0 top-0 p-4 opacity-10 ${colorClass}`}><span className="material-symbols-outlined text-6xl">{icon}</span></div>
            <div className="relative z-10">
               <p className="text-xs text-stone-400 uppercase font-bold tracking-wider mb-1">{title}</p>
               <p className={`text-lg font-mono font-bold ${colorClass}`}>{expiry ? expiry.toLocaleDateString() : 'Sin fecha'}</p>
               <p className={`text-[10px] mt-1 font-bold uppercase ${colorClass}`}>{statusText}</p>
            </div>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${bgClass} ${colorClass}`}><span className="material-symbols-outlined">{icon}</span></div>
         </button>
      );
   };

   return (
      <div className="p-6 max-w-7xl mx-auto">
         <nav className="flex items-center gap-2 text-sm mb-6">
            <Link to="/fleet" className="text-stone-500 hover:text-white">Flota</Link>
            <span className="material-symbols-outlined text-stone-600 text-xs">chevron_right</span>
            <span className="text-stone-500">{vehicle.section}</span>
            <span className="material-symbols-outlined text-stone-600 text-xs">chevron_right</span>
            <span className="text-primary font-medium">{vehicle.patente?.toUpperCase() || vehicle.model}</span>
         </nav>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            <div className="lg:col-span-8 bg-brand-surface border border-brand-border rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
               <div className="w-full md:w-auto flex flex-col items-center">
                  <div className="w-32 h-32 rounded-lg bg-stone-900 border border-brand-border flex items-center justify-center text-stone-600 mb-3">
                     <span className="material-symbols-outlined text-6xl">{vehicle.tipo === 'car' ? 'directions_car' : vehicle.tipo === 'truck' ? 'local_shipping' : 'electric_bolt'}</span>
                  </div>
                  {vehicle.patente && <div className="px-3 py-1 bg-primary text-brand-dark font-mono font-bold text-lg rounded">{vehicle.patente.toUpperCase()}</div>}
               </div>
               <div className="flex-1 w-full text-center md:text-left">
                  <h1 className="text-3xl font-bold text-white mb-1">{vehicle.model}</h1>
                  <p className="text-stone-400 mb-6">{vehicle.year} • {vehicle.odometer?.toLocaleString()} {isGenerator ? 'Hrs' : 'km'}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="bg-brand-dark/50 p-3 rounded border border-brand-border flex items-center gap-3">
                        <span className="material-symbols-outlined text-stone-500">badge</span>
                        <div><p className="text-[10px] uppercase text-stone-500 font-bold">Encargado</p><p className="text-white font-medium">{vehicle.manager}</p></div>
                     </div>
                     <div className="bg-brand-dark/50 p-3 rounded border border-brand-border flex items-center gap-3">
                        <span className="material-symbols-outlined text-stone-500">person</span>
                        <div><p className="text-[10px] uppercase text-stone-500 font-bold">Chofer</p><p className="text-white font-medium">{vehicle.assigned_driver || 'N/A'}</p></div>
                     </div>
                  </div>
               </div>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-4">
               <div className="flex-1 bg-brand-surface border border-brand-border rounded-xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
                  <div className={`absolute inset-0 opacity-5 ${vehicle.status === 'Activo' ? 'bg-emerald-500' : vehicle.status === 'Baja' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                  <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-2">Estado</h3>
                  <span className={`text-2xl font-bold ${vehicle.status === 'Activo' ? 'text-emerald-500' : vehicle.status === 'Baja' ? 'text-rose-500' : 'text-amber-500'}`}>{vehicle.status}</span>
               </div>
               <button onClick={() => setIsEditModalOpen(true)} className="w-full bg-primary hover:bg-primary-dark text-brand-dark font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-all"><span className="material-symbols-outlined">edit_document</span> Editar Datos</button>
            </div>
         </div>

         {vehicle.tipo !== 'generator' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
               <ExpirationCard title="Seguro Automotor" date={vehicle.insurance_expiration} appointment={vehicle.insurance_appointment} icon="security" type="Seguro" />
               <ExpirationCard title="VTV / Técnica" date={vehicle.vtv_expiration} appointment={vehicle.vtv_appointment} icon="verified" type="VTV" />
               <ExpirationCard title="Patente" date={vehicle.patente_expiration} appointment={vehicle.patente_appointment} icon="badge" type="Patente" />
            </div>
         )}

         {/* HISTORIAL TÉCNICO */}
         <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-brand-border bg-brand-dark/30 flex justify-between items-center">
               <h2 className="text-white font-bold flex items-center gap-2"><span className="material-symbols-outlined text-stone-400">build</span> Historial Técnico</h2>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
               <div className="hidden md:block">
                  <table className="w-full text-left text-sm border-separate border-spacing-0">
                     <thead className="bg-brand-dark text-xs uppercase font-medium text-stone-500 sticky top-0">
                        <tr>
                           <th className="px-6 py-4 border-b border-brand-border">Fecha</th>
                           <th className="px-6 py-4 border-b border-brand-border">Categoría</th>
                           <th className="px-6 py-4 border-b border-brand-border">Descripción</th>
                           <th className="px-6 py-4 border-b border-brand-border text-right">Costo</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-brand-border text-stone-300">
                        {maintenanceHistory.map((log) => (
                           <tr key={log.id} className="hover:bg-brand-dark/30 transition-colors">
                              <td className="px-6 py-4 font-mono text-stone-400 whitespace-nowrap">{new Date(log.date + 'T00:00:00').toLocaleDateString()}</td>
                              <td className="px-6 py-4"><span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase border ${log.type === 'Mantenimiento' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>{log.type}</span></td>
                              <td className="px-6 py-4 font-medium text-white">{log.description}</td>
                              <td className="px-6 py-4 text-right font-mono font-bold text-white whitespace-nowrap">${log.cost.toLocaleString()}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               {hasMore && (
                  <div className="p-4 flex justify-center border-t border-brand-border">
                     <button onClick={() => setDisplayLimit(prev => prev + 10)} className="text-primary text-xs font-bold uppercase hover:bg-primary/10 px-6 py-2.5 rounded-lg border border-primary/20">Cargar anteriores</button>
                  </div>
               )}
            </div>
         </div>

         {/* MODAL EDITAR DATOS (RESTAURADO) */}
         {isEditModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}>
               <div className="bg-brand-surface w-full max-w-2xl rounded-xl border border-brand-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-dark/50">
                     <h3 className="text-white font-bold text-lg">Editar Datos</h3>
                     <button onClick={() => setIsEditModalOpen(false)} className="text-stone-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                  </div>
                  <form onSubmit={handleUpdateVehicle} className="p-6 space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Patente</label><input name="patente" type="text" defaultValue={vehicle.patente} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white font-mono uppercase" /></div>
                        <div><label className="text-xs font-bold text-stone-500 uppercase mb-1 block">{isGenerator ? 'Horas de Uso' : 'Kilometraje'}</label><input name="odometer" type="number" defaultValue={vehicle.odometer} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white" /></div>
                        <div><label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Modelo</label><input name="model" type="text" defaultValue={vehicle.model} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white" /></div>
                        <div><label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Año</label><input name="year" type="number" defaultValue={vehicle.year} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white" /></div>
                        <div><label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Estado</label><select name="status" defaultValue={vehicle.status} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white"><option>Activo</option><option>En Taller</option><option>Baja</option></select></div>
                        <div><label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Sección</label><select name="section" defaultValue={vehicle.section} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white"><option>Administración</option><option>Cereales</option><option>Agronomía</option><option>Logística</option><option>Hacienda</option><option>Estación de Servicio</option><option>Miel</option><option>Veterinaria</option><option>Ferreteria</option><option>Supermercado</option><option>Balanceado</option></select></div>
                        <div><label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Encargado</label><input name="manager" type="text" defaultValue={vehicle.manager} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white" /></div>
                        {!isGenerator && <div><label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Chofer Asignado</label><input name="assignedDriver" type="text" defaultValue={vehicle.assigned_driver} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white" /></div>}
                     </div>
                     <div className="flex justify-between items-center border-t border-brand-border pt-4">
                        <button type="button" onClick={() => setIsDeleteModalOpen(true)} className="text-red-500 text-xs font-bold uppercase flex items-center gap-1 hover:underline"><span className="material-symbols-outlined text-sm">delete</span> Eliminar Unidad</button>
                        <button type="submit" className="bg-primary text-brand-dark font-bold px-8 py-2 rounded-lg text-sm">Guardar Cambios</button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* MODAL DE ELIMINACIÓN */}
         {isDeleteModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setIsDeleteModalOpen(false)}>
               <div className="bg-brand-surface w-full max-w-sm rounded-xl border border-brand-border shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                     <span className="material-symbols-outlined text-3xl">warning</span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">¿Eliminar esta unidad?</h3>
                  <p className="text-stone-400 text-sm mb-6 leading-relaxed">
                     Esta acción borrará permanentemente el vehículo y todo su historial técnico. Para confirmar, escribe <b className="text-stone-200 uppercase">borrar</b> debajo.
                  </p>

                  <input
                     type="text"
                     value={deleteConfirmText}
                     onChange={(e) => setDeleteConfirmText(e.target.value)}
                     placeholder='Escribe "borrar"'
                     className="w-full bg-brand-dark border border-brand-border rounded-lg h-12 px-4 text-white text-center mb-6 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                  />

                  <div className="flex gap-3">
                     <button onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmText(''); }} className="flex-1 py-3 text-stone-500 font-bold text-xs uppercase hover:text-stone-300 transition-colors">Cancelar</button>
                     <button
                        disabled={deleteConfirmText !== 'borrar'}
                        onClick={handleDeleteVehicle}
                        className="flex-1 bg-rose-600 disabled:opacity-30 text-white rounded-lg font-bold text-xs uppercase transition-all shadow-lg shadow-rose-900/20"
                     >Confirmar</button>
                  </div>
               </div>
            </div>
         )}

         {/* MODAL DE RENOVACIÓN Y TURNOS */}
         {docUpdateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setDocUpdateModal(null)}>
               <div className="bg-brand-surface w-full max-w-md rounded-xl border border-brand-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-dark/50">
                     <h3 className="text-white font-bold text-lg">Gestionar {docUpdateModal.type}</h3>
                     <button onClick={() => setDocUpdateModal(null)} className="text-stone-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                  </div>
                  <div className="p-6 space-y-6">
                     <div>
                        <label className="text-xs font-bold text-blue-400 uppercase mb-2 block tracking-widest">¿Tienes un turno?</label>
                        <input type="date" id="apptDate" defaultValue={docUpdateModal.currentAppt} className="w-full bg-brand-dark border border-blue-400/30 rounded-lg h-12 px-3 text-white focus:ring-1 focus:ring-blue-400" />
                        <p className="text-[10px] text-stone-500 mt-1">La tarjeta cambiará a color azul para indicar que el proceso está iniciado.</p>
                     </div>
                     <div className="h-px bg-brand-border"></div>
                     <div>
                        <label className="text-xs font-bold text-stone-500 uppercase mb-2 block tracking-widest">Nueva fecha de vencimiento</label>
                        <input type="date" id="docDate" defaultValue={docUpdateModal.currentDoc} className="w-full bg-brand-dark border border-brand-border rounded-lg h-12 px-3 text-white focus:ring-1 focus:ring-primary" />
                        <p className="text-[10px] text-stone-500 mt-1">Usa esto solo si ya renovaste el documento.</p>
                     </div>
                     <button
                        onClick={() => {
                           const d = (document.getElementById('docDate') as HTMLInputElement).value;
                           const a = (document.getElementById('apptDate') as HTMLInputElement).value;
                           handleUpdateDoc(d, a);
                        }}
                        className="w-full bg-primary text-brand-dark font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                     >Actualizar</button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default VehicleDetail;