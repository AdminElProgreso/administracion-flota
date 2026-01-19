import React, { useState } from 'react';
import { MaintenanceLog } from '../types';

const Maintenance = () => {
   // Extended Mock Data
   const [logs, setLogs] = useState<MaintenanceLog[]>([
      { id: '1', date: '2023-10-24', vehicleId: '1', vehicleName: 'Toyota Hilux (AB-123-CD)', type: 'Mantenimiento', description: 'Cambio de Aceite, Agua y Filtros. Revisión de fluidos generales.', provider: 'Lubricentro Central', cost: 125000, status: 'Completado' },
      { id: '2', date: '2023-10-22', vehicleId: '2', vehicleName: 'Mercedes Sprinter (JK-992-PL)', type: 'Reparación', description: 'Cambio bomba de agua y correa de distribución.', provider: 'Mecánica "El Tuerca"', cost: 350000, status: 'Completado' },
      { id: '3', date: '2023-10-20', vehicleId: '3', vehicleName: 'Scania R450 (ZZ-111-XX)', type: 'Mantenimiento', description: 'Service 50.000km Oficial. Escaneo de computadora.', provider: 'Concesionario Scania', cost: 850000, status: 'Completado' },
      { id: '4', date: '2023-10-18', vehicleId: '4', vehicleName: 'Ford Ranger (FR-404-OP)', type: 'Reparación', description: 'Parche cubierta trasera derecha e inflado.', provider: 'Gomería Ruta 5', cost: 15000, status: 'Completado' },
   ]);

   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
   const [viewModal, setViewModal] = useState<MaintenanceLog | null>(null);
   const [editModal, setEditModal] = useState<{ isOpen: boolean; data: MaintenanceLog | null; mode: 'create' | 'edit' }>({ isOpen: false, data: null, mode: 'create' });

   const handleOpenCreate = (type: 'Mantenimiento' | 'Reparación') => {
      setIsDropdownOpen(false);
      setEditModal({
         isOpen: true,
         mode: 'create',
         data: {
            id: Math.random().toString(),
            date: new Date().toISOString().split('T')[0],
            vehicleId: '',
            vehicleName: '',
            type: type,
            description: '',
            provider: '',
            cost: 0,
            status: 'Pendiente'
         }
      });
   };

   const handleEdit = (log: MaintenanceLog) => {
      setEditModal({ isOpen: true, data: { ...log }, mode: 'edit' });
   };

   return (
    <div className="p-4 md:p-6 relative min-h-screen pb-20 md:pb-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
           <h2 className="text-2xl font-bold text-white mb-1">Registro Técnico</h2>
           <p className="text-sm text-stone-500">Historial de Mantenimientos y Reparaciones de flota.</p>
        </div>
        <div className="flex gap-2 relative w-full sm:w-auto">
           <button className="flex-1 sm:flex-none justify-center px-4 py-2 text-xs font-medium rounded-md bg-brand-surface border border-brand-border text-white hover:bg-stone-700 flex items-center gap-1 transition-colors">
              <span className="material-symbols-outlined text-[18px]">filter_list</span> Filtrar
           </button>
           
           <div className="relative flex-1 sm:flex-none">
               <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full justify-center px-4 py-2 text-xs font-medium rounded-md bg-primary hover:bg-primary-dark text-brand-dark font-bold flex items-center gap-1 transition-colors shadow-lg shadow-primary/20"
               >
                  <span className="material-symbols-outlined text-[18px]">add</span> Cargar Trabajo
                  <span className="material-symbols-outlined text-[18px]">{isDropdownOpen ? 'expand_less' : 'expand_more'}</span>
               </button>
               
               {isDropdownOpen && (
                  <>
                     <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                     <div className="absolute right-0 mt-2 w-56 bg-brand-surface border border-brand-border rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <button onClick={() => handleOpenCreate('Mantenimiento')} className="w-full text-left px-4 py-3 hover:bg-brand-dark flex items-center gap-3 transition-colors group">
                           <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                              <span className="material-symbols-outlined text-lg">build</span>
                           </div>
                           <div>
                              <span className="block text-sm font-bold text-white">Mantenimiento</span>
                              <span className="block text-[10px] text-stone-500">Preventivo, Service, Aceite...</span>
                           </div>
                        </button>
                        <div className="h-px bg-brand-border mx-4"></div>
                        <button onClick={() => handleOpenCreate('Reparación')} className="w-full text-left px-4 py-3 hover:bg-brand-dark flex items-center gap-3 transition-colors group">
                           <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                              <span className="material-symbols-outlined text-lg">car_crash</span>
                           </div>
                           <div>
                              <span className="block text-sm font-bold text-white">Reparación</span>
                              <span className="block text-[10px] text-stone-500">Roturas, Fallas, Accidentes...</span>
                           </div>
                        </button>
                     </div>
                  </>
               )}
           </div>
        </div>
      </div>

      {/* --- MOBILE/TABLET VIEW: CARDS (Hidden on XL/Desktop) --- */}
      <div className="xl:hidden space-y-4">
        {logs.map((row) => (
           <div key={row.id} className="bg-brand-surface border border-brand-border rounded-xl p-4 shadow-lg flex flex-col gap-3">
              <div className="flex justify-between items-start">
                 <div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border mb-2 ${
                       row.type === 'Mantenimiento' 
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                          : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    }`}>
                       {row.type}
                    </span>
                    <h3 className="text-white font-bold text-sm">{row.vehicleName}</h3>
                 </div>
                 <div className="text-right">
                    <span className="block text-lg font-mono font-bold text-white">${row.cost.toLocaleString()}</span>
                    <span className="text-xs text-stone-500">{new Date(row.date).toLocaleDateString()}</span>
                 </div>
              </div>
              
              <p className="text-sm text-stone-400 line-clamp-2 leading-relaxed bg-brand-dark/50 p-2 rounded border border-brand-border/50">
                 {row.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-brand-border/50 mt-1">
                 <span className="text-xs text-stone-500 truncate max-w-[150px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">store</span>
                    {row.provider}
                 </span>
                 <div className="flex gap-2">
                    <button onClick={() => setViewModal(row)} className="p-2 bg-brand-dark border border-brand-border rounded-lg text-stone-400 hover:text-white transition-colors">
                       <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </button>
                    <button onClick={() => handleEdit(row)} className="p-2 bg-brand-dark border border-brand-border rounded-lg text-stone-400 hover:text-primary transition-colors">
                       <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                 </div>
              </div>
           </div>
        ))}
      </div>

      {/* --- DESKTOP VIEW: TABLE (Hidden on Mobile/Tablet) --- */}
      <div className="hidden xl:block bg-brand-surface border border-brand-border rounded-lg overflow-hidden shadow-xl">
         <table className="w-full text-left">
            <thead>
               <tr className="bg-brand-dark/50 border-b border-brand-border text-stone-400 text-xs uppercase tracking-wider font-medium">
                  <th className="px-6 py-4 font-bold">Fecha</th>
                  <th className="px-6 py-4 font-bold">Vehículo</th>
                  <th className="px-6 py-4 font-bold">Categoría</th>
                  <th className="px-6 py-4 font-bold w-1/3">Descripción del Trabajo</th>
                  <th className="px-6 py-4 font-bold">Lugar / Proveedor</th>
                  <th className="px-6 py-4 font-bold text-right">Costo</th>
                  <th className="px-6 py-4 font-bold text-right">Acciones</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
               {logs.map((row) => (
                  <tr key={row.id} className="hover:bg-brand-dark/30 transition-colors group">
                     <td className="px-6 py-4 text-sm text-white font-mono whitespace-nowrap">{new Date(row.date).toLocaleDateString()}</td>
                     <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded text-xs border border-primary/20 whitespace-nowrap">{row.vehicleName}</span>
                     </td>
                     <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
                           row.type === 'Mantenimiento' 
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                              : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}>
                           <span className={`w-1.5 h-1.5 rounded-full ${row.type === 'Mantenimiento' ? 'bg-blue-400' : 'bg-orange-400'}`}></span>
                           {row.type}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-sm text-white font-medium truncate max-w-xs" title={row.description}>{row.description}</td>
                     <td className="px-6 py-4 text-sm text-stone-400">{row.provider}</td>
                     <td className="px-6 py-4 text-sm font-mono text-white text-right font-bold">${row.cost.toLocaleString()}</td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                           <button onClick={() => setViewModal(row)} className="p-1.5 text-stone-500 hover:text-white hover:bg-stone-700 rounded transition-colors" title="Ver Detalle">
                              <span className="material-symbols-outlined text-[20px]">visibility</span>
                           </button>
                           <button onClick={() => handleEdit(row)} className="p-1.5 text-stone-500 hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Editar">
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                           </button>
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {/* --- VIEW DETAIL MODAL --- */}
      {viewModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setViewModal(null)}>
            <div className="bg-brand-surface w-full max-w-lg rounded-xl border border-brand-border shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
               {/* Header like a ticket */}
               <div className="bg-brand-dark p-6 border-b border-brand-border flex justify-between items-start relative overflow-hidden">
                   <div className={`absolute top-0 right-0 p-4 opacity-5 pointer-events-none`}>
                       <span className="material-symbols-outlined text-[120px]">{viewModal.type === 'Mantenimiento' ? 'build' : 'car_crash'}</span>
                   </div>
                   <div className="relative z-10 max-w-[80%]">
                       <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-2 border ${
                           viewModal.type === 'Mantenimiento' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                       }`}>
                          {viewModal.type}
                       </span>
                       <h2 className="text-xl md:text-2xl font-bold text-white">Detalle de Trabajo</h2>
                       <p className="text-stone-500 text-sm font-mono mt-1">ID: #{viewModal.id.substring(0,6)}</p>
                   </div>
                   <button onClick={() => setViewModal(null)} className="text-stone-500 hover:text-white relative z-10"><span className="material-symbols-outlined">close</span></button>
               </div>

               <div className="p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-stone-900/50 p-4 rounded-lg border border-brand-border gap-2 sm:gap-0">
                     <div>
                        <p className="text-xs text-stone-500 uppercase font-bold mb-1">Vehículo</p>
                        <p className="text-lg font-bold text-primary">{viewModal.vehicleName}</p>
                     </div>
                     <div className="text-left sm:text-right">
                        <p className="text-xs text-stone-500 uppercase font-bold mb-1">Fecha</p>
                        <p className="text-white font-mono">{new Date(viewModal.date).toLocaleDateString()}</p>
                     </div>
                  </div>

                  <div>
                     <p className="text-xs text-stone-500 uppercase font-bold mb-2">Descripción del Servicio</p>
                     <p className="text-stone-300 text-sm leading-relaxed bg-brand-dark p-4 rounded-lg border border-brand-border max-h-40 overflow-y-auto">
                        {viewModal.description}
                     </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <p className="text-xs text-stone-500 uppercase font-bold mb-1">Proveedor / Taller</p>
                        <div className="flex items-center gap-2">
                           <span className="material-symbols-outlined text-stone-600">store</span>
                           <span className="text-white text-sm">{viewModal.provider}</span>
                        </div>
                     </div>
                     <div>
                        <p className="text-xs text-stone-500 uppercase font-bold mb-1">Costo Total</p>
                        <div className="flex items-center gap-2">
                           <span className="material-symbols-outlined text-stone-600">payments</span>
                           <span className="text-white font-bold font-mono text-lg">${viewModal.cost.toLocaleString()}</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-4 bg-brand-dark border-t border-brand-border flex justify-end">
                  <button onClick={() => { handleEdit(viewModal); setViewModal(null); }} className="px-4 py-2 bg-stone-800 hover:bg-stone-700 border border-brand-border text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors">
                     <span className="material-symbols-outlined text-sm">edit</span> Editar Registro
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* --- EDIT / CREATE MODAL --- */}
      {editModal.isOpen && editModal.data && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setEditModal({...editModal, isOpen: false})}>
            <div className="bg-brand-surface w-full max-w-2xl rounded-xl border border-brand-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
               <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-dark/50 flex-shrink-0">
                  <h3 className="text-white font-bold text-lg">{editModal.mode === 'create' ? 'Nuevo Registro' : 'Editar Registro'}</h3>
                  <button onClick={() => setEditModal({...editModal, isOpen: false})} className="text-stone-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
               </div>
               
               <div className="p-6 space-y-6 overflow-y-auto">
                  {/* Top Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Tipo de Trabajo</label>
                        <div className={`px-3 py-2 rounded-lg border flex items-center gap-2 ${
                           editModal.data.type === 'Mantenimiento' 
                           ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                           : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                        }`}>
                           <span className="material-symbols-outlined text-lg">{editModal.data.type === 'Mantenimiento' ? 'build' : 'car_crash'}</span>
                           <span className="font-bold text-sm">{editModal.data.type}</span>
                        </div>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Fecha</label>
                        <input type="date" defaultValue={editModal.data.date} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary" />
                     </div>
                  </div>

                  {/* Vehicle Selection */}
                  <div>
                     <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Vehículo Afectado</label>
                     <select className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary">
                        <option value="">Seleccione un vehículo...</option>
                        <option selected={editModal.data.vehicleName.includes('AB-123-CD')}>Toyota Hilux (AB-123-CD)</option>
                        <option selected={editModal.data.vehicleName.includes('JK-992-PL')}>Mercedes Sprinter (JK-992-PL)</option>
                        <option selected={editModal.data.vehicleName.includes('ZZ-111-XX')}>Scania R450 (ZZ-111-XX)</option>
                        <option selected={editModal.data.vehicleName.includes('FR-404-OP')}>Ford Ranger (FR-404-OP)</option>
                     </select>
                  </div>

                  {/* Description */}
                  <div>
                     <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Descripción Detallada</label>
                     <textarea 
                        defaultValue={editModal.data.description} 
                        rows={3} 
                        className="w-full bg-brand-dark border-brand-border rounded-lg p-3 text-white focus:ring-1 focus:ring-primary resize-none"
                        placeholder="Describa el trabajo realizado, repuestos utilizados, etc."
                     ></textarea>
                  </div>

                  {/* Provider & Cost */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Proveedor / Taller</label>
                        <input type="text" defaultValue={editModal.data.provider} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary" placeholder="Ej. Taller Central" />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Costo ($)</label>
                        <input type="number" defaultValue={editModal.data.cost} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary" placeholder="0.00" />
                     </div>
                  </div>
               </div>

               {/* Actions */}
               <div className="p-6 pt-0 flex justify-end gap-3 flex-shrink-0">
                  <button onClick={() => setEditModal({...editModal, isOpen: false})} className="px-4 py-2 text-stone-400 hover:text-white text-sm font-bold uppercase transition-colors">Cancelar</button>
                  <button className="px-6 py-2 bg-primary hover:bg-primary-dark text-brand-dark font-bold rounded-lg text-sm shadow-lg shadow-primary/20 transition-colors">
                     {editModal.mode === 'create' ? 'Registrar Trabajo' : 'Guardar Cambios'}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Maintenance;