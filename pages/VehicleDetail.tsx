import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Vehicle } from '../types';

const VehicleDetail = () => {
  const { id } = useParams();

  // State for the vehicle data to allow edits
  const [vehicle, setVehicle] = useState<Vehicle>({
    id: '1',
    type: 'car',
    patente: 'AB-123-CD',
    model: 'Toyota Hilux SRV',
    year: 2022,
    section: 'Agronomía',
    manager: 'Roberto Gómez',
    assignedDriver: 'Juan Pérez',
    odometer: 124500,
    insuranceExpiration: '2023-12-15',
    vtvExpiration: '2023-11-20', // Alert
    patenteExpiration: '2024-01-10',
    status: 'En Taller',
    alerts: [],
    // @ts-ignore - Adding maintenance history to local state for demo purposes, though not in Vehicle interface type strictly
    maintenanceHistory: [
       { date: '2023-10-15', type: 'Mantenimiento', description: 'Cambio de Aceite y Filtros (10k)', provider: 'Lubricentro El Eje', cost: 145000 },
       { date: '2023-09-02', type: 'Reparación', description: 'Cambio Pastillas de Freno', provider: 'Frenos Sur', cost: 85000 },
    ]
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [docUpdateModal, setDocUpdateModal] = useState<{ isOpen: boolean; type: string; current: string } | null>(null);

  const handleUpdateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    // Logic to save vehicle data would go here
    setIsEditModalOpen(false);
  };

  const handleUpdateDoc = (newDate: string) => {
    if (docUpdateModal?.type === 'Seguro') setVehicle({...vehicle, insuranceExpiration: newDate});
    if (docUpdateModal?.type === 'VTV') setVehicle({...vehicle, vtvExpiration: newDate});
    if (docUpdateModal?.type === 'Patente') setVehicle({...vehicle, patenteExpiration: newDate});
    setDocUpdateModal(null);
  };

  const isGenerator = vehicle.type === 'generator';

  const getIconByType = (type: string) => {
    switch(type) {
       case 'car': return 'directions_car';
       case 'truck': return 'local_shipping';
       case 'generator': return 'electric_bolt';
       default: return 'directions_car';
    }
 };

  const ExpirationCard = ({ title, date, icon, colorClass, borderClass, textClass, type }: any) => {
     if (!date) return null;
     const daysLeft = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
     const isExpired = daysLeft < 0;

     return (
        <button 
           onClick={() => setDocUpdateModal({ isOpen: true, type, current: date })}
           className={`w-full text-left bg-brand-surface border ${borderClass} rounded-lg p-4 flex items-center justify-between relative overflow-hidden group hover:bg-brand-dark/30 transition-all`}
        >
           <div className={`absolute right-0 top-0 p-4 opacity-10 ${textClass}`}>
              <span className="material-symbols-outlined text-6xl">{icon}</span>
           </div>
           
           <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-[1px]">
               <div className="bg-brand-surface border border-brand-border px-4 py-2 rounded-full shadow-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-sm">edit_calendar</span>
                  <span className="text-xs font-bold text-white uppercase">Renovar</span>
               </div>
           </div>

           <div className="relative z-10">
              <p className="text-xs text-stone-400 uppercase font-bold tracking-wider mb-1">{title}</p>
              <p className={`text-lg font-mono font-bold ${textClass}`}>{new Date(date).toLocaleDateString()}</p>
              <p className={`text-[10px] mt-1 font-medium ${isExpired ? 'text-rose-500' : 'text-stone-500'}`}>
                 {isExpired ? `Vencido hace ${Math.abs(daysLeft)} días` : `Vence en ${daysLeft} días`}
              </p>
           </div>
           <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorClass} ${textClass}`}>
              <span className="material-symbols-outlined">{icon}</span>
           </div>
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
        <span className="text-primary font-medium">{vehicle.patente || vehicle.model}</span>
      </nav>

      {/* Top Header: Identity & Responsibles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
         <div className="lg:col-span-8 bg-brand-surface border border-brand-border rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="w-full md:w-auto flex flex-col items-center">
               <div className="w-32 h-32 rounded-lg bg-stone-900 border border-brand-border flex items-center justify-center text-stone-600 mb-3">
                  <span className="material-symbols-outlined text-6xl">{getIconByType(vehicle.type)}</span>
               </div>
               {vehicle.patente && (
                  <div className="px-3 py-1 bg-primary text-brand-dark font-mono font-bold text-lg rounded">{vehicle.patente}</div>
               )}
            </div>
            <div className="flex-1 w-full text-center md:text-left">
               <div className="mb-6">
                  <h1 className="text-3xl font-bold text-white mb-1">{vehicle.model}</h1>
                  <p className="text-stone-400">{vehicle.year} • {vehicle.odometer.toLocaleString()} {isGenerator ? 'Hrs' : 'km'}</p>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-brand-dark/50 p-3 rounded border border-brand-border flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-400">
                        <span className="material-symbols-outlined">badge</span>
                     </div>
                     <div>
                        <p className="text-[10px] uppercase text-stone-500 font-bold">Encargado de Sección</p>
                        <p className="text-white font-medium">{vehicle.manager}</p>
                     </div>
                  </div>
                  {!isGenerator && vehicle.assignedDriver && (
                    <div className="bg-brand-dark/50 p-3 rounded border border-brand-border flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center text-stone-400">
                            <span className="material-symbols-outlined">sports_motorsports</span>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-stone-500 font-bold">Chofer Asignado</p>
                            <p className="text-white font-medium">{vehicle.assignedDriver}</p>
                        </div>
                    </div>
                  )}
               </div>
            </div>
         </div>

         <div className="lg:col-span-4 flex flex-col gap-4">
             {/* Status Card */}
             <div className="flex-1 bg-brand-surface border border-brand-border rounded-xl p-6 flex flex-col justify-center items-center text-center relative overflow-hidden">
                <div className={`absolute inset-0 opacity-5 ${vehicle.status === 'Activo' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                <h3 className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-2">Estado Actual</h3>
                <span className={`text-2xl font-bold mb-1 ${vehicle.status === 'Activo' ? 'text-emerald-500' : 'text-amber-500'}`}>{vehicle.status}</span>
                <p className="text-stone-500 text-xs">Actualizado hace 2h</p>
             </div>
             
             {/* Quick Actions */}
             <button 
                onClick={() => setIsEditModalOpen(true)}
                className="w-full bg-primary hover:bg-primary-dark text-brand-dark font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/10"
             >
                <span className="material-symbols-outlined">edit_document</span> Editar Datos
             </button>
         </div>
      </div>

      {/* Critical Documents Section - HIDDEN FOR GENERATORS */}
      {!isGenerator && (
        <>
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">folder_shared</span> Estado de Documentación
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <ExpirationCard 
                    title="Seguro Automotor" 
                    date={vehicle.insuranceExpiration} 
                    icon="security" 
                    type="Seguro"
                    colorClass="bg-emerald-500/10" 
                    borderClass="border-emerald-500/20" 
                    textClass="text-emerald-500" 
                />
                <ExpirationCard 
                    title="VTV / Técnica" 
                    date={vehicle.vtvExpiration} 
                    icon="verified" 
                    type="VTV"
                    colorClass="bg-amber-500/10" 
                    borderClass="border-amber-500/50" 
                    textClass="text-amber-500" 
                />
                <ExpirationCard 
                    title="Patente" 
                    date={vehicle.patenteExpiration} 
                    icon="badge" 
                    type="Patente"
                    colorClass="bg-emerald-500/10" 
                    borderClass="border-emerald-500/20" 
                    textClass="text-emerald-500" 
                />
            </div>
        </>
      )}

      {/* Maintenance & Repairs Log */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden flex flex-col">
         <div className="p-4 border-b border-brand-border bg-brand-dark/30 flex justify-between items-center">
            <h2 className="text-white font-bold flex items-center gap-2">
               <span className="material-symbols-outlined text-stone-400">build</span> 
               Mantenimientos y Reparaciones
            </h2>
            <button className="bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold py-1.5 px-4 rounded border border-brand-border flex items-center gap-2 transition-colors">
               <span className="material-symbols-outlined text-sm">add</span> Nuevo Registro
            </button>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-brand-dark text-xs uppercase font-medium text-stone-500">
                  <tr>
                     <th className="px-6 py-4">Fecha</th>
                     <th className="px-6 py-4">Categoría</th>
                     <th className="px-6 py-4">Descripción del Trabajo</th>
                     <th className="px-6 py-4">Proveedor / Lugar</th>
                     <th className="px-6 py-4 text-right">Costo</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-brand-border text-stone-300">
                  {/* @ts-ignore */}
                  {vehicle.maintenanceHistory.map((log, idx) => (
                     <tr key={idx} className="hover:bg-brand-dark/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-stone-400">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                           <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                              log.type === 'Mantenimiento' 
                                 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                 : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                           }`}>
                              {log.type}
                           </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-white">{log.description}</td>
                        <td className="px-6 py-4 text-stone-400">{log.provider}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-white">${log.cost.toLocaleString()}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* EDIT VEHICLE MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}>
           <div className="bg-brand-surface w-full max-w-2xl rounded-xl border border-brand-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-dark/50">
                  <h3 className="text-white font-bold text-lg">Editar Datos del Activo</h3>
                  <button onClick={() => setIsEditModalOpen(false)} className="text-stone-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
               </div>
               <form onSubmit={handleUpdateVehicle} className="p-6">
                  {/* Type Selector in Edit Mode */}
                  <div className="flex gap-4 mb-6">
                     <button type="button" onClick={() => setVehicle({...vehicle, type: 'car'})} className={`flex-1 py-2 rounded border transition-colors flex flex-col items-center gap-1 ${vehicle.type === 'car' ? 'bg-primary/20 border-primary text-white' : 'border-brand-border text-stone-500'}`}>
                        <span className="material-symbols-outlined">directions_car</span>
                        <span className="text-[10px] uppercase font-bold">Auto</span>
                     </button>
                     <button type="button" onClick={() => setVehicle({...vehicle, type: 'truck'})} className={`flex-1 py-2 rounded border transition-colors flex flex-col items-center gap-1 ${vehicle.type === 'truck' ? 'bg-primary/20 border-primary text-white' : 'border-brand-border text-stone-500'}`}>
                        <span className="material-symbols-outlined">local_shipping</span>
                        <span className="text-[10px] uppercase font-bold">Camión</span>
                     </button>
                     <button type="button" onClick={() => setVehicle({...vehicle, type: 'generator'})} className={`flex-1 py-2 rounded border transition-colors flex flex-col items-center gap-1 ${vehicle.type === 'generator' ? 'bg-primary/20 border-primary text-white' : 'border-brand-border text-stone-500'}`}>
                        <span className="material-symbols-outlined">electric_bolt</span>
                        <span className="text-[10px] uppercase font-bold">Generador</span>
                     </button>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Modelo</label>
                            <input type="text" defaultValue={vehicle.model} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Año</label>
                            <input type="number" defaultValue={vehicle.year} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">
                                {vehicle.type === 'generator' ? 'Horas de Uso' : 'Odómetro (Km)'}
                            </label>
                            <input type="number" defaultValue={vehicle.odometer} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Estado</label>
                            <select defaultValue={vehicle.status} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary">
                            <option>Activo</option>
                            <option>En Taller</option>
                            <option>Baja</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="border-t border-brand-border pt-4">
                        <h4 className="text-primary text-xs font-bold uppercase tracking-wider mb-4">Responsables</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                            <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Sección</label>
                            <select defaultValue={vehicle.section} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary">
                                <option>Agronomía</option>
                                <option>Cereales</option>
                                <option>Logística</option>
                                <option>Administración</option>
                            </select>
                            </div>
                            <div>
                            <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Encargado de Sección</label>
                            <input type="text" defaultValue={vehicle.manager} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary" />
                            </div>
                            {vehicle.type !== 'generator' && (
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Chofer Asignado</label>
                                    <input type="text" defaultValue={vehicle.assignedDriver} className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary" />
                                </div>
                            )}
                        </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                     <button type="submit" className="bg-primary hover:bg-primary-dark text-brand-dark font-bold px-6 py-2 rounded-lg text-sm transition-colors">Guardar Cambios</button>
                  </div>
               </form>
           </div>
        </div>
      )}

      {/* RENEW DOCUMENT MODAL */}
      {docUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setDocUpdateModal(null)}>
           <div className="bg-brand-surface w-full max-w-sm rounded-xl border border-brand-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
               <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-dark/50">
                  <h3 className="text-white font-bold text-lg">Renovar {docUpdateModal.type}</h3>
                  <button onClick={() => setDocUpdateModal(null)} className="text-stone-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
               </div>
               <div className="p-6">
                  <p className="text-sm text-stone-400 mb-4">La fecha actual de vencimiento es <strong className="text-white">{new Date(docUpdateModal.current).toLocaleDateString()}</strong>. Seleccione la nueva fecha de vigencia.</p>
                  
                  <div className="mb-6">
                     <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Nueva Fecha de Vencimiento</label>
                     <input 
                        type="date" 
                        id="newDateInput"
                        className="w-full bg-brand-dark border-brand-border rounded-lg h-12 px-3 text-white focus:ring-1 focus:ring-primary" 
                     />
                  </div>

                  <button 
                     onClick={() => {
                        const input = document.getElementById('newDateInput') as HTMLInputElement;
                        if(input.value) handleUpdateDoc(input.value);
                     }}
                     className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                     <span className="material-symbols-outlined">update</span> Confirmar Renovación
                  </button>
               </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default VehicleDetail;