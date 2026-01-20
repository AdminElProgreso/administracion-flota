import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Vehicle } from '../types';

const mockVehicles: Vehicle[] = [
<<<<<<< HEAD
   {
      id: '1',
      type: 'car',
      patente: 'AB-123-CD',
      model: 'Toyota Hilux SRV',
      year: 2022,
      section: 'Agronomía',
      status: 'En Taller',
      odometer: 124500,
      manager: 'Roberto Gómez',
      assignedDriver: 'Juan Pérez',
      insuranceExpiration: '2023-12-15',
      vtvExpiration: '2023-11-20',
      patenteExpiration: '2024-01-10',
      alerts: ['VTV Próxima']
   },
   {
      id: '2',
      type: 'truck',
      patente: 'JK-992-PL',
      model: 'Mercedes Sprinter',
      year: 2021,
      section: 'Cereales',
      status: 'Activo',
      odometer: 89200,
      manager: 'Carlos Ruiz',
      insuranceExpiration: '2024-02-28',
      vtvExpiration: '2024-03-15',
      patenteExpiration: '2024-02-01',
      alerts: []
   },
   {
      id: '3',
      type: 'truck',
      patente: 'ZZ-111-XX',
      model: 'Scania R450',
      year: 2023,
      section: 'Logística',
      status: 'Activo',
      odometer: 45100,
      manager: 'Roberto Gómez',
      assignedDriver: 'Miguel Angel',
      insuranceExpiration: '2023-10-30',
      vtvExpiration: '2024-05-20',
      patenteExpiration: '2023-12-01',
      alerts: ['Seguro Vencido']
   },
   {
      id: '4',
      type: 'generator',
      model: 'Caterpillar C4.4',
      year: 2020,
      section: 'Estación de Servicio',
      status: 'Activo',
      odometer: 3200, // Hours
      manager: 'Carlos Ruiz',
      alerts: []
   },
];

const Fleet = () => {
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [newVehicleType, setNewVehicleType] = useState<'car' | 'truck' | 'generator'>('car');

   // Helper to check expiration status visually
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

         {/* --- MOBILE VIEW: CARDS (Visible on mobile, hidden on LG) --- */}
         <div className="lg:hidden space-y-4">
            {mockVehicles.map((v) => {
               const insStatus = getExpirationStatus(v.insuranceExpiration);
               const vtvStatus = getExpirationStatus(v.vtvExpiration);
               const isGenerator = v.type === 'generator';

               return (
                  <div key={v.id} className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-lg relative overflow-hidden">
                     {/* Header */}
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded-lg bg-brand-dark border border-brand-border flex items-center justify-center text-stone-500">
                              <span className="material-symbols-outlined text-2xl">{getIconByType(v.type)}</span>
                           </div>
                           <div>
                              <h3 className="text-white font-bold text-lg leading-tight">{v.model}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                 {v.patente && (
                                    <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">{v.patente}</span>
                                 )}
                                 <span className="text-stone-500 text-xs font-mono">{v.year}</span>
                              </div>
                           </div>
                        </div>
                        <span className={`flex-shrink-0 w-3 h-3 rounded-full shadow-lg shadow-black/50 ${v.status === 'Activo' ? 'bg-emerald-500' : 'bg-amber-500'}`} title={v.status}></span>
                     </div>

                     {/* Info Grid */}
                     <div className="space-y-3 mb-5 bg-brand-dark/30 rounded-lg p-3 border border-brand-border/50">
                        <div className="flex justify-between items-center border-b border-brand-border/50 pb-2 last:border-0 last:pb-0">
                           <span className="text-stone-500 text-xs uppercase font-bold">Sección</span>
                           <span className={`text-xs font-bold px-2 py-0.5 rounded ${v.section === 'Agronomía' ? 'bg-emerald-500/10 text-emerald-400' :
                                 v.section === 'Cereales' ? 'bg-primary/10 text-primary' :
                                    'bg-blue-500/10 text-blue-400'
                              }`}>{v.section}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-brand-border/50 pb-2 last:border-0 last:pb-0">
                           <span className="text-stone-500 text-xs uppercase font-bold">Encargado</span>
                           <span className="text-stone-300 text-sm font-medium">{v.manager}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-brand-border/50 pb-2 last:border-0 last:pb-0">
                           <span className="text-stone-500 text-xs uppercase font-bold">Uso</span>
                           <span className="text-stone-300 font-mono text-sm font-bold">{v.odometer.toLocaleString()} {isGenerator ? 'Hrs' : 'km'}</span>
                        </div>
                     </div>

                     {/* Footer Action */}
                     <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                           {!isGenerator && (
                              <>
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${insStatus === 'expired' ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' :
                                       insStatus === 'warning' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' :
                                          'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 text-opacity-40'
                                    }`} title="Estado Seguro">
                                    <span className="material-symbols-outlined text-sm">security</span>
                                 </div>
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${vtvStatus === 'expired' ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' :
                                       vtvStatus === 'warning' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' :
                                          'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 text-opacity-40'
                                    }`} title="Estado VTV">
                                    <span className="material-symbols-outlined text-sm">verified</span>
                                 </div>
                              </>
                           )}
                        </div>
                        <Link to={`/fleet/${v.id}`} className="px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-sm text-stone-300 font-bold hover:text-white hover:border-stone-500 transition-colors flex items-center gap-1">
                           Ver Ficha <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </Link>
                     </div>
                  </div>
               );
            })}
         </div>

         {/* --- DESKTOP VIEW: TABLE (Hidden on Mobile) --- */}
         <div className="hidden lg:block bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-2xl">
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
                     {mockVehicles.map((v) => {
                        const insStatus = getExpirationStatus(v.insuranceExpiration);
                        const vtvStatus = getExpirationStatus(v.vtvExpiration);
                        const isGenerator = v.type === 'generator';

                        return (
                           <tr key={v.id} className="hover:bg-brand-dark/50 transition-colors group">
                              <td className="px-6 py-4">
                                 <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded bg-brand-dark flex flex-shrink-0 items-center justify-center text-stone-500 border border-brand-border">
                                       <span className="material-symbols-outlined text-xl">{getIconByType(v.type)}</span>
                                    </div>
                                    <div>
                                       {v.patente ? (
                                          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 mb-1 inline-block">{v.patente}</span>
                                       ) : (
                                          <span className="font-mono text-xs font-bold text-stone-500 bg-stone-800 px-1.5 py-0.5 rounded border border-stone-700 mb-1 inline-block">S/PATENTE</span>
                                       )}
                                       <div className="text-sm font-bold text-stone-200">{v.model}</div>
                                       <div className="text-xs text-stone-500">{v.year}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col gap-1">
                                    <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${v.section === 'Agronomía' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                          v.section === 'Cereales' ? 'bg-primary/10 text-primary border-primary/20' :
                                             'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                       }`}>
                                       {v.section}
                                    </span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                       <span className="material-symbols-outlined text-stone-500 text-[14px]">person</span>
                                       <span className="text-xs text-stone-300 font-medium" title="Encargado">{v.manager}</span>
                                    </div>
                                    {v.assignedDriver && v.assignedDriver !== v.manager && (
                                       <div className="flex items-center gap-1.5">
                                          <span className="material-symbols-outlined text-stone-600 text-[14px]">sports_motorsports</span>
                                          <span className="text-xs text-stone-500" title="Chofer">{v.assignedDriver}</span>
                                       </div>
                                    )}
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 {isGenerator ? (
                                    <span className="text-[10px] uppercase font-bold text-stone-600">No Requiere</span>
                                 ) : (
                                    <div className="flex gap-2">
                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${insStatus === 'expired' ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' :
                                             insStatus === 'warning' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' :
                                                'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 text-opacity-40'
                                          }`} title={`Seguro: ${v.insuranceExpiration}`}>
                                          <span className="material-symbols-outlined text-sm">security</span>
                                       </div>
                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${vtvStatus === 'expired' ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' :
                                             vtvStatus === 'warning' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' :
                                                'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 text-opacity-40'
                                          }`} title={`VTV: ${v.vtvExpiration}`}>
                                          <span className="material-symbols-outlined text-sm">verified</span>
                                       </div>
                                    </div>
                                 )}
                              </td>
                              <td className="px-6 py-4">
                                 <div className="font-mono text-sm text-stone-300">
                                    {v.odometer.toLocaleString()} {isGenerator ? 'Hrs' : 'km'}
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${v.status === 'Activo' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                       'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'Activo' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                    {v.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <Link to={`/fleet/${v.id}`} className="text-stone-500 hover:text-white transition-colors mr-2">
                                    <span className="material-symbols-outlined">visibility</span>
                                 </Link>
                              </td>
                           </tr>
                        )
                     })}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Add Vehicle Modal */}
         {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
               <div className="relative w-full max-w-4xl bg-brand-surface rounded-xl border border-brand-border shadow-2xl flex flex-col max-h-[95vh]">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-brand-border">
                     <div>
                        <h3 className="text-xl font-bold text-white">Alta de Activo</h3>
                        <p className="text-xs text-stone-400">Seleccione el tipo y complete los datos</p>
                     </div>
                     <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8">
                     {/* TYPE SELECTOR */}
                     <div className="grid grid-cols-3 gap-4 mb-8">
                        <button
                           onClick={() => setNewVehicleType('car')}
                           className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${newVehicleType === 'car' ? 'border-primary bg-primary/10 text-white' : 'border-brand-border bg-brand-dark/30 text-stone-500 hover:border-stone-500'}`}
                        >
                           <span className={`material-symbols-outlined text-3xl mb-2 ${newVehicleType === 'car' ? 'text-primary' : ''}`}>directions_car</span>
                           <span className="text-xs font-bold uppercase">Auto / Camioneta</span>
                        </button>
                        <button
                           onClick={() => setNewVehicleType('truck')}
                           className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${newVehicleType === 'truck' ? 'border-primary bg-primary/10 text-white' : 'border-brand-border bg-brand-dark/30 text-stone-500 hover:border-stone-500'}`}
                        >
                           <span className={`material-symbols-outlined text-3xl mb-2 ${newVehicleType === 'truck' ? 'text-primary' : ''}`}>local_shipping</span>
                           <span className="text-xs font-bold uppercase">Camión</span>
                        </button>
                        <button
                           onClick={() => setNewVehicleType('generator')}
                           className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${newVehicleType === 'generator' ? 'border-primary bg-primary/10 text-white' : 'border-brand-border bg-brand-dark/30 text-stone-500 hover:border-stone-500'}`}
                        >
                           <span className={`material-symbols-outlined text-3xl mb-2 ${newVehicleType === 'generator' ? 'text-primary' : ''}`}>electric_bolt</span>
                           <span className="text-xs font-bold uppercase">Grupo Electrógeno</span>
                        </button>
                     </div>

                     <div className={`grid grid-cols-1 ${newVehicleType === 'generator' ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-8`}>

                        {/* LEFT COLUMN: BASIC DATA */}
                        <div className="space-y-6">
                           <h4 className="text-primary font-bold text-sm uppercase tracking-wider border-b border-brand-border pb-2">1. Datos y Responsables</h4>

                           <div className="grid grid-cols-2 gap-4">
                              {newVehicleType !== 'generator' && (
                                 <div className="col-span-1">
                                    <label className="text-xs text-stone-400 mb-1 block">Patente <span className="text-red-500">*</span></label>
                                    <input className="w-full bg-brand-dark border-brand-border rounded-lg text-white font-mono uppercase text-center h-10 border focus:border-primary focus:ring-0" placeholder="AA 000 BB" />
                                 </div>
                              )}
                              <div className={newVehicleType === 'generator' ? 'col-span-2' : 'col-span-1'}>
                                 <label className="text-xs text-stone-400 mb-1 block">
                                    {newVehicleType === 'generator' ? 'Horas de Uso Actual' : 'Kilometraje Actual'}
                                 </label>
                                 <input className="w-full bg-brand-dark border-brand-border rounded-lg text-white h-10 px-3 border focus:border-primary focus:ring-0" type="number" placeholder="0" />
                              </div>
                              <div className="col-span-2">
                                 <label className="text-xs text-stone-400 mb-1 block">Modelo y Año</label>
                                 <input className="w-full bg-brand-dark border-brand-border rounded-lg text-white h-10 px-3 border focus:border-primary focus:ring-0" placeholder={newVehicleType === 'generator' ? "Ej. Caterpillar C4.4" : "Ej. Toyota Hilux 2023"} />
                              </div>
                           </div>

                           <div className="bg-brand-dark/30 p-4 rounded-lg border border-brand-border">
                              <div className="mb-3">
                                 <label className="text-xs text-stone-400 mb-1 block">Sección Operativa <span className="text-red-500">*</span></label>
                                 <select className="w-full bg-brand-surface border-brand-border rounded-lg text-white h-10 px-3 border focus:border-primary focus:ring-0">
                                    <option>Administración</option>
                                    <option>Cereales</option>
                                    <option>Agronomía</option>
                                    <option>Logística</option>
                                    <option>Estación de Servicio</option>
                                 </select>
                              </div>
                              <div className="mb-3">
                                 <label className="text-xs text-stone-400 mb-1 block">Encargado de Sección <span className="text-red-500">*</span></label>
                                 <input className="w-full bg-brand-surface border-brand-border rounded-lg text-white h-10 px-3 border focus:border-primary focus:ring-0" placeholder="Nombre del responsable" />
                              </div>
                              {newVehicleType !== 'generator' && (
                                 <div>
                                    <label className="text-xs text-stone-400 mb-1 block">Chofer Asignado (Opcional)</label>
                                    <input className="w-full bg-brand-surface border-brand-border rounded-lg text-white h-10 px-3 border focus:border-primary focus:ring-0" placeholder="Si es distinto al encargado" />
                                 </div>
                              )}
                           </div>
                        </div>

                        {/* RIGHT COLUMN: DOCUMENTATION (Hidden for Generators) */}
                        {newVehicleType !== 'generator' && (
                           <div className="space-y-6">
                              <h4 className="text-primary font-bold text-sm uppercase tracking-wider border-b border-brand-border pb-2">2. Documentación y Vencimientos</h4>

                              <div className="space-y-4">
                                 <div className="bg-brand-dark/30 p-4 rounded-lg border border-brand-border hover:border-emerald-500/30 transition-colors">
                                    <div className="flex items-center gap-2 mb-3">
                                       <span className="material-symbols-outlined text-emerald-500">verified</span>
                                       <span className="text-white font-bold text-sm">VTV / Revisión Técnica</span>
                                    </div>
                                    <label className="text-xs text-stone-500 mb-1 block">Fecha de Vencimiento</label>
                                    <input type="date" className="w-full bg-brand-surface border-brand-border rounded-lg text-white h-10 px-3 border focus:border-emerald-500 focus:ring-0" />
                                 </div>

                                 <div className="bg-brand-dark/30 p-4 rounded-lg border border-brand-border hover:border-blue-500/30 transition-colors">
                                    <div className="flex items-center gap-2 mb-3">
                                       <span className="material-symbols-outlined text-blue-500">security</span>
                                       <span className="text-white font-bold text-sm">Seguro Automotor</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                       <div>
                                          <label className="text-xs text-stone-500 mb-1 block">Compañía</label>
                                          <input className="w-full bg-brand-surface border-brand-border rounded-lg text-white h-10 px-3 border focus:border-blue-500 focus:ring-0" placeholder="Ej. La Segunda" />
                                       </div>
                                       <div>
                                          <label className="text-xs text-stone-500 mb-1 block">Vencimiento Póliza</label>
                                          <input type="date" className="w-full bg-brand-surface border-brand-border rounded-lg text-white h-10 px-3 border focus:border-blue-500 focus:ring-0" />
                                       </div>
                                    </div>
                                 </div>

                                 <div className="bg-brand-dark/30 p-4 rounded-lg border border-brand-border hover:border-white/30 transition-colors">
                                    <div className="flex items-center gap-2 mb-3">
                                       <span className="material-symbols-outlined text-white">badge</span>
                                       <span className="text-white font-bold text-sm">Patente / Impuestos</span>
                                    </div>
                                    <label className="text-xs text-stone-500 mb-1 block">Próximo Vencimiento</label>
                                    <input type="date" className="w-full bg-brand-surface border-brand-border rounded-lg text-white h-10 px-3 border focus:border-white focus:ring-0" />
                                 </div>
                              </div>
                           </div>
=======
  { 
    id: '1', 
    type: 'car',
    patente: 'AB-123-CD', 
    model: 'Toyota Hilux SRV', 
    year: 2022, 
    section: 'Agronomía', 
    status: 'En Taller', 
    odometer: 124500, 
    manager: 'Roberto Gómez',
    assignedDriver: 'Juan Pérez',
    insuranceExpiration: '2023-12-15',
    vtvExpiration: '2023-11-20', 
    patenteExpiration: '2024-01-10',
    alerts: ['VTV Próxima'] 
  },
  { 
    id: '2', 
    type: 'truck',
    patente: 'JK-992-PL', 
    model: 'Mercedes Sprinter', 
    year: 2021, 
    section: 'Cereales', 
    status: 'Activo', 
    odometer: 89200, 
    manager: 'Carlos Ruiz',
    insuranceExpiration: '2024-02-28',
    vtvExpiration: '2024-03-15',
    patenteExpiration: '2024-02-01',
    alerts: [] 
  },
  { 
    id: '3', 
    type: 'truck',
    patente: 'ZZ-111-XX', 
    model: 'Scania R450', 
    year: 2023, 
    section: 'Logística', 
    status: 'Activo', 
    odometer: 45100, 
    manager: 'Roberto Gómez',
    assignedDriver: 'Miguel Angel',
    insuranceExpiration: '2023-10-30', 
    vtvExpiration: '2024-05-20',
    patenteExpiration: '2023-12-01',
    alerts: ['Seguro Vencido'] 
  },
  { 
    id: '4', 
    type: 'generator',
    model: 'Caterpillar C4.4', 
    year: 2020, 
    section: 'Estación de Servicio', 
    status: 'Activo', 
    odometer: 3200, // Hours
    manager: 'Carlos Ruiz',
    alerts: [] 
  },
];

const Fleet = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVehicleType, setNewVehicleType] = useState<'car' | 'truck' | 'generator'>('car');

  // Helper to check expiration status visually
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
     switch(type) {
        case 'car': return 'directions_car';
        case 'truck': return 'local_shipping';
        case 'generator': return 'electric_bolt';
        default: return 'directions_car';
     }
  };

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

      {/* --- MOBILE VIEW: CARDS (Visible on mobile, hidden on LG) --- */}
      <div className="lg:hidden space-y-4">
         {mockVehicles.map((v) => {
            const insStatus = getExpirationStatus(v.insuranceExpiration);
            const vtvStatus = getExpirationStatus(v.vtvExpiration);
            const isGenerator = v.type === 'generator';
            
            return (
               <div key={v.id} className="bg-brand-surface border border-brand-border rounded-xl p-5 shadow-lg relative overflow-hidden">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-brand-dark border border-brand-border flex items-center justify-center text-stone-500">
                           <span className="material-symbols-outlined text-2xl">{getIconByType(v.type)}</span>
                        </div>
                        <div>
                           <h3 className="text-white font-bold text-lg leading-tight">{v.model}</h3>
                           <div className="flex items-center gap-2 mt-1">
                              {v.patente && (
                                 <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">{v.patente}</span>
                              )}
                              <span className="text-stone-500 text-xs font-mono">{v.year}</span>
                           </div>
                        </div>
                     </div>
                     <span className={`flex-shrink-0 w-3 h-3 rounded-full shadow-lg shadow-black/50 ${v.status === 'Activo' ? 'bg-emerald-500' : 'bg-amber-500'}`} title={v.status}></span>
                  </div>

                  {/* Info Grid */}
                  <div className="space-y-3 mb-5 bg-brand-dark/30 rounded-lg p-3 border border-brand-border/50">
                     <div className="flex justify-between items-center border-b border-brand-border/50 pb-2 last:border-0 last:pb-0">
                        <span className="text-stone-500 text-xs uppercase font-bold">Sección</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                           v.section === 'Agronomía' ? 'bg-emerald-500/10 text-emerald-400' :
                           v.section === 'Cereales' ? 'bg-primary/10 text-primary' :
                           'bg-blue-500/10 text-blue-400'
                        }`}>{v.section}</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-brand-border/50 pb-2 last:border-0 last:pb-0">
                        <span className="text-stone-500 text-xs uppercase font-bold">Encargado</span>
                        <span className="text-stone-300 text-sm font-medium">{v.manager}</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-brand-border/50 pb-2 last:border-0 last:pb-0">
                        <span className="text-stone-500 text-xs uppercase font-bold">Uso</span>
                        <span className="text-stone-300 font-mono text-sm font-bold">{v.odometer.toLocaleString()} {isGenerator ? 'Hrs' : 'km'}</span>
                     </div>
                  </div>

                  {/* Footer Action */}
                  <div className="flex items-center justify-between">
                     <div className="flex gap-2">
                        {!isGenerator && (
                           <>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                                 insStatus === 'expired' ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' :
                                 insStatus === 'warning' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' :
                                 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 text-opacity-40'
                              }`} title="Estado Seguro">
                                 <span className="material-symbols-outlined text-sm">security</span>
                              </div>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                                 vtvStatus === 'expired' ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' :
                                 vtvStatus === 'warning' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' :
                                 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 text-opacity-40'
                              }`} title="Estado VTV">
                                 <span className="material-symbols-outlined text-sm">verified</span>
                              </div>
                           </>
                        )}
                     </div>
                     <Link to={`/fleet/${v.id}`} className="px-4 py-2 bg-brand-dark border border-brand-border rounded-lg text-sm text-stone-300 font-bold hover:text-white hover:border-stone-500 transition-colors flex items-center gap-1">
                        Ver Ficha <span className="material-symbols-outlined text-sm">chevron_right</span>
                     </Link>
                  </div>
               </div>
            );
         })}
      </div>

      {/* --- DESKTOP VIEW: TABLE (Hidden on Mobile) --- */}
      <div className="hidden lg:block bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-2xl">
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
              {mockVehicles.map((v) => {
                const insStatus = getExpirationStatus(v.insuranceExpiration);
                const vtvStatus = getExpirationStatus(v.vtvExpiration);
                const isGenerator = v.type === 'generator';
                
                return (
                <tr key={v.id} className="hover:bg-brand-dark/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded bg-brand-dark flex flex-shrink-0 items-center justify-center text-stone-500 border border-brand-border">
                        <span className="material-symbols-outlined text-xl">{getIconByType(v.type)}</span>
                      </div>
                      <div>
                        {v.patente ? (
                           <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 mb-1 inline-block">{v.patente}</span>
                        ) : (
                           <span className="font-mono text-xs font-bold text-stone-500 bg-stone-800 px-1.5 py-0.5 rounded border border-stone-700 mb-1 inline-block">S/PATENTE</span>
                        )}
                        <div className="text-sm font-bold text-stone-200">{v.model}</div>
                        <div className="text-xs text-stone-500">{v.year}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${
                        v.section === 'Agronomía' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        v.section === 'Cereales' ? 'bg-primary/10 text-primary border-primary/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {v.section}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="material-symbols-outlined text-stone-500 text-[14px]">person</span>
                        <span className="text-xs text-stone-300 font-medium" title="Encargado">{v.manager}</span>
                      </div>
                      {v.assignedDriver && v.assignedDriver !== v.manager && (
                         <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-stone-600 text-[14px]">sports_motorsports</span>
                            <span className="text-xs text-stone-500" title="Chofer">{v.assignedDriver}</span>
                         </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     {isGenerator ? (
                        <span className="text-[10px] uppercase font-bold text-stone-600">No Requiere</span>
                     ) : (
                        <div className="flex gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                            insStatus === 'expired' ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' :
                            insStatus === 'warning' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' :
                            'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 text-opacity-40'
                            }`} title={`Seguro: ${v.insuranceExpiration}`}>
                            <span className="material-symbols-outlined text-sm">security</span>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                            vtvStatus === 'expired' ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' :
                            vtvStatus === 'warning' ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' :
                            'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 text-opacity-40'
                            }`} title={`VTV: ${v.vtvExpiration}`}>
                            <span className="material-symbols-outlined text-sm">verified</span>
                            </div>
                        </div>
                     )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm text-stone-300">
                        {v.odometer.toLocaleString()} {isGenerator ? 'Hrs' : 'km'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      v.status === 'Activo' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${v.status === 'Activo' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/fleet/${v.id}`} className="text-stone-500 hover:text-white transition-colors mr-2">
                      <span className="material-symbols-outlined">visibility</span>
                    </Link>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-4xl bg-brand-surface rounded-xl border border-brand-border shadow-2xl flex flex-col max-h-[95vh]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-brand-border">
               <div>
                  <h3 className="text-xl font-bold text-white">Alta de Activo</h3>
                  <p className="text-xs text-stone-400">Seleccione el tipo y complete los datos</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8">
               {/* TYPE SELECTOR */}
               <div className="grid grid-cols-3 gap-4 mb-8">
                  <button 
                    onClick={() => setNewVehicleType('car')}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${newVehicleType === 'car' ? 'border-primary bg-primary/10 text-white' : 'border-brand-border bg-brand-dark/30 text-stone-500 hover:border-stone-500'}`}
                  >
                     <span className={`material-symbols-outlined text-3xl mb-2 ${newVehicleType === 'car' ? 'text-primary' : ''}`}>directions_car</span>
                     <span className="text-xs font-bold uppercase">Auto / Camioneta</span>
                  </button>
                  <button 
                    onClick={() => setNewVehicleType('truck')}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${newVehicleType === 'truck' ? 'border-primary bg-primary/10 text-white' : 'border-brand-border bg-brand-dark/30 text-stone-500 hover:border-stone-500'}`}
                  >
                     <span className={`material-symbols-outlined text-3xl mb-2 ${newVehicleType === 'truck' ? 'text-primary' : ''}`}>local_shipping</span>
                     <span className="text-xs font-bold uppercase">Camión</span>
                  </button>
                  <button 
                    onClick={() => setNewVehicleType('generator')}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${newVehicleType === 'generator' ? 'border-primary bg-primary/10 text-white' : 'border-brand-border bg-brand-dark/30 text-stone-500 hover:border-stone-500'}`}
                  >
                     <span className={`material-symbols-outlined text-3xl mb-2 ${newVehicleType === 'generator' ? 'text-primary' : ''}`}>electric_bolt</span>
                     <span className="text-xs font-bold uppercase">Grupo Electrógeno</span>
                  </button>
               </div>

               <div className={`grid grid-cols-1 ${newVehicleType === 'generator' ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-8`}>
                  
                  {/* LEFT COLUMN: BASIC DATA */}
                  <div className="space-y-6">
                     <h4 className="text-primary font-bold text-sm uppercase tracking-wider border-b border-brand-border pb-2">1. Datos y Responsables</h4>
                     
                     <div className="grid grid-cols-2 gap-4">
                        {newVehicleType !== 'generator' && (
                            <div className="col-span-1">
                                <label className="text-xs text-stone-400 mb-1 block">Patente <span className="text-red-500">*</span></label>
                                <input className="w-full bg-brand-dark border-brand-border rounded-lg text-white font-mono uppercase text-center h-10 border focus:border-primary focus:ring-0" placeholder="AA 000 BB" />
                            </div>
                        )}
                        <div className={newVehicleType === 'generator' ? 'col-span-2' : 'col-span-1'}>
                            <label className="text-xs text-stone-400 mb-1 block">
                                {newVehicleType === 'generator' ? 'Horas de Uso Actual' : 'Kilometraje Actual'}
                            </label>
                            <input className="w-full bg-brand-dark border-brand-border rounded-lg text-white h-10 px-3 border focus:border-primary focus:ring-0" type="number" placeholder="0" />
                        </div>
                        <div className="col-span-2">
                           <label className="text-xs text-stone-400 mb-1 block">Modelo y Año</label>
                           <input className="w-full bg-brand-dark border-brand-border rounded-lg text-white h-10 px-3 border focus:border-primary focus:ring-0" placeholder={newVehicleType === 'generator' ? "Ej. Caterpillar C4.4" : "Ej. Toyota Hilux 2023"} />
                        </div>
                     </div>

                     <div className="bg-brand-dark/30 p-4 rounded-lg border border-brand-border">
                        <div className="mb-3">
                           <label className="text-xs text-stone-400 mb-1 block">Sección Operativa <span className="text-red-500">*</span></label>
                           <select className="w-full bg-brand-surface border-brand-border rounded-lg text-white h-10 px-3 border focus:border-primary focus:ring-0">
                              <option>Administración</option>
                              <option>Cereales</option>
                              <option>Agronomía</option>
                              <option>Logística</option>
                              <option>Estación de Servicio</option>
                           </select>
                        </div>
                        <div className="mb-3">
                           <label className="text-xs text-stone-400 mb-1 block">Encargado de Sección <span className="text-red-500">*</span></label>
                           <input className="w-full bg-brand-surface border-brand-border rounded-lg text-white h-10 px-3 border focus:border-primary focus:ring-0" placeholder="Nombre del responsable" />
                        </div>
                        {newVehicleType !== 'generator' && (
                            <div>
                                <label className="text-xs text-stone-400 mb-1 block">Chofer Asignado (Opcional)</label>
                                <input className="w-full bg-brand-surface border-brand-border rounded-lg text-white h-10 px-3 border focus:border-primary focus:ring-0" placeholder="Si es distinto al encargado" />
                            </div>
>>>>>>> deb7f818e20d2a2309454e8cc0c5e517d83245a7
                        )}
                     </div>
                  </div>

<<<<<<< HEAD
                  <div className="p-6 border-t border-brand-border flex justify-end gap-3 bg-brand-surface rounded-b-xl">
                     <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-stone-400 hover:text-white font-bold uppercase">Cancelar</button>
                     <button className="px-8 py-2 bg-primary text-brand-dark rounded-lg font-bold text-sm uppercase shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors">
                        Guardar Activo
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
=======
                  {/* RIGHT COLUMN: DOCUMENTATION (Hidden for Generators) */}
                  {newVehicleType !== 'generator' && (
                    <div className="space-y-6">
                        <h4 className="text-primary font-bold text-sm uppercase tracking-wider border-b border-brand-border pb-2">2. Documentación y Vencimientos</h4>
                        
                        <div className="space-y-4">
                            <div className="bg-brand-dark/30 p-4 rounded-lg border border-brand-border hover:border-emerald-500/30 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-emerald-500">verified</span>
                                <span className="text-white font-bold text-sm">VTV / Revisión Técnica</span>
                            </div>
                            <label className="text-xs text-stone-500 mb-1 block">Fecha de Vencimiento</label>
                            <input type="date" className="w-full bg-brand-surface border-brand-border rounded-lg text-white h-10 px-3 border focus:border-emerald-500 focus:ring-0" />
                            </div>

                            <div className="bg-brand-dark/30 p-4 rounded-lg border border-brand-border hover:border-blue-500/30 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-blue-500">security</span>
                                <span className="text-white font-bold text-sm">Seguro Automotor</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-stone-500 mb-1 block">Compañía</label>
                                    <input className="w-full bg-brand-surface border-brand-border rounded-lg text-white h-10 px-3 border focus:border-blue-500 focus:ring-0" placeholder="Ej. La Segunda" />
                                </div>
                                <div>
                                    <label className="text-xs text-stone-500 mb-1 block">Vencimiento Póliza</label>
                                    <input type="date" className="w-full bg-brand-surface border-brand-border rounded-lg text-white h-10 px-3 border focus:border-blue-500 focus:ring-0" />
                                </div>
                            </div>
                            </div>

                            <div className="bg-brand-dark/30 p-4 rounded-lg border border-brand-border hover:border-white/30 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-white">badge</span>
                                <span className="text-white font-bold text-sm">Patente / Impuestos</span>
                            </div>
                            <label className="text-xs text-stone-500 mb-1 block">Próximo Vencimiento</label>
                            <input type="date" className="w-full bg-brand-surface border-brand-border rounded-lg text-white h-10 px-3 border focus:border-white focus:ring-0" />
                            </div>
                        </div>
                    </div>
                  )}
               </div>
            </div>

            <div className="p-6 border-t border-brand-border flex justify-end gap-3 bg-brand-surface rounded-b-xl">
               <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-stone-400 hover:text-white font-bold uppercase">Cancelar</button>
               <button className="px-8 py-2 bg-primary text-brand-dark rounded-lg font-bold text-sm uppercase shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors">
                  Guardar Activo
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
>>>>>>> deb7f818e20d2a2309454e8cc0c5e517d83245a7
};

export default Fleet;