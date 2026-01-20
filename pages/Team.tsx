import React, { useState, useEffect } from 'react';
import { TeamMember } from '../types';
import { supabase } from '../supabase';

const Team = () => {
   // 1. Estados para datos reales y carga
   const [members, setMembers] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingMember, setEditingMember] = useState<any>(null);

   // 2. Cargar miembros desde Supabase
   const fetchMembers = async () => {
      setLoading(true);
      const { data, error } = await supabase
         .from('staff')
         .select('*')
         .order('nombre', { ascending: true });

      if (error) {
         console.error('Error cargando equipo:', error);
      } else if (data) {
         // Mapeamos los datos de la base de datos (nombre, rol, seccion) al formato de tu App
         const mappedMembers = data.map(m => ({
            id: m.id,
            name: m.nombre,
            role: m.rol,
            dept: m.seccion,
            email: m.email,
            phone: m.telefono,
            img: m.avatar_url,
            status: m.activo ? 'active' : 'inactive',
            color: m.seccion === 'Logística' ? 'blue' :
               m.seccion === 'Administración' ? 'purple' :
                  m.seccion === 'Cereales' ? 'amber' : 'orange'
         }));
         setMembers(mappedMembers);
      }
      setLoading(false);
   };

   useEffect(() => {
      fetchMembers();
   }, []);

   // 3. Lógica de Guardado (Crear / Editar)
   const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);

      const memberData = {
         nombre: formData.get('name'),
         rol: formData.get('role'),
         email: formData.get('email'),
         seccion: formData.get('dept'),
         activo: formData.get('status') === 'active',
         telefono: editingMember?.phone || '' // Mantenemos el teléfono si existía
      };

      let error;
      if (editingMember) {
         const { error: updErr } = await supabase
            .from('staff')
            .update(memberData)
            .eq('id', editingMember.id);
         error = updErr;
      } else {
         const { error: insErr } = await supabase
            .from('staff')
            .insert([memberData]);
         error = insErr;
      }

      if (error) {
         alert('Error al guardar: ' + error.message);
      } else {
         setIsModalOpen(false);
         fetchMembers();
      }
   };

   // 4. Lógica de Eliminación
   const handleDelete = async () => {
      if (editingMember && window.confirm(`¿Seguro que quieres eliminar a ${editingMember.name}?`)) {
         const { error } = await supabase
            .from('staff')
            .delete()
            .eq('id', editingMember.id);

         if (error) {
            alert('Error al eliminar: ' + error.message);
         } else {
            setIsModalOpen(false);
            fetchMembers();
         }
      }
   };

   const openAddModal = () => {
      setEditingMember(null);
      setIsModalOpen(true);
   };

   const openEditModal = (member: any) => {
      setEditingMember(member);
      setIsModalOpen(true);
   };

   if (loading) return (
      <div className="h-screen flex items-center justify-center bg-background-dark">
         <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
   );

   return (
      <div className="p-6">
         <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div>
               <h1 className="text-3xl font-bold text-white tracking-tight">Equipo y Responsables</h1>
               <p className="text-stone-400 text-sm mt-1">Gestión de personal y responsables de sección.</p>
            </div>
            <button
               onClick={openAddModal}
               className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-brand-dark text-sm font-bold px-5 py-2.5 rounded-lg shadow-lg shadow-primary/20 transition-all"
            >
               <span className="material-symbols-outlined">add</span> Agregar Miembro
            </button>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {members.map((member) => (
               <div key={member.id} className={`group relative flex flex-col items-center p-6 rounded-xl bg-brand-surface border border-brand-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 ${member.status === 'inactive' ? 'opacity-75' : ''}`}>

                  <div className="absolute top-4 left-4 flex gap-2">
                     <div className={`size-3 rounded-full ${member.status === 'inactive' ? 'bg-red-500' : 'bg-emerald-500'} border border-brand-surface shadow-sm`}></div>
                  </div>

                  <button
                     onClick={() => openEditModal(member)}
                     className="absolute top-3 right-3 p-2 text-stone-500 hover:text-white hover:bg-stone-700/50 rounded-lg transition-colors"
                  >
                     <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>

                  <div className="relative mb-4 mt-2">
                     <div className={`size-20 rounded-full bg-cover bg-center border-2 border-stone-600 group-hover:border-primary transition-colors ${!member.img ? 'bg-stone-700 flex items-center justify-center' : ''}`} style={member.img ? { backgroundImage: `url('${member.img}')` } : {}}>
                        {!member.img && <span className="material-symbols-outlined text-3xl text-stone-500">person</span>}
                     </div>
                  </div>

                  <div className="text-center mb-4">
                     <h3 className="text-white text-lg font-bold group-hover:text-primary transition-colors">{member.name}</h3>
                     <p className="text-stone-400 text-sm font-light mt-0.5">{member.role}</p>
                  </div>

                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-6 bg-${member.color}-900/30 text-${member.color}-300 border border-${member.color}-800/50`}>
                     {member.dept}
                  </span>

                  <div className="w-full grid grid-cols-2 gap-3 mt-auto">
                     <a href={`tel:${member.phone}`} className="flex items-center justify-center gap-2 py-2 rounded-lg bg-stone-800 border border-brand-border hover:bg-stone-700 hover:text-white text-stone-400 text-xs font-medium transition-colors">
                        Llamar
                     </a>
                     <a href={`mailto:${member.email}`} className="flex items-center justify-center gap-2 py-2 rounded-lg bg-stone-800 border border-brand-border hover:bg-stone-700 hover:text-white text-stone-400 text-xs font-medium transition-colors">
                        Email
                     </a>
                  </div>
               </div>
            ))}

            <button onClick={openAddModal} className="group flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-stone-700 hover:border-primary/50 hover:bg-stone-800/30 transition-all h-full min-h-[320px]">
               <div className="size-16 rounded-full bg-stone-800 flex items-center justify-center group-hover:bg-primary group-hover:text-brand-dark text-stone-500 transition-colors mb-4">
                  <span className="material-symbols-outlined text-[32px]">add</span>
               </div>
               <span className="text-stone-400 font-medium group-hover:text-white">Agregar Nuevo Miembro</span>
            </button>
         </div>

         {/* Modal Único para Crear y Editar */}
         {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
               <div className="relative w-full max-w-[600px] bg-brand-surface rounded-xl border border-brand-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-6 py-5 border-b border-brand-border bg-brand-surface">
                     <h2 className="text-white text-2xl font-bold tracking-tight">
                        {editingMember ? 'Editar Miembro' : 'Añadir Nuevo Miembro'}
                     </h2>
                     <button onClick={() => setIsModalOpen(false)} className="text-stone-400 hover:text-white"><span className="material-symbols-outlined">close</span></button>
                  </div>

                  <form onSubmit={handleSave}>
                     <div className="p-6 space-y-6">
                        <div className="space-y-4">
                           <h3 className="text-primary text-sm font-bold uppercase tracking-wider">Datos Personales</h3>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="text-stone-300 text-sm font-medium mb-1 block">Nombre Completo</label>
                                 <input name="name" defaultValue={editingMember?.name} required type="text" className="w-full bg-stone-800 border-none rounded-lg h-12 px-4 text-white focus:ring-2 focus:ring-primary" placeholder="Ej. Juan Pérez" />
                              </div>
                              <div>
                                 <label className="text-stone-300 text-sm font-medium mb-1 block">Cargo</label>
                                 <input name="role" defaultValue={editingMember?.role} required type="text" className="w-full bg-stone-800 border-none rounded-lg h-12 px-4 text-white focus:ring-2 focus:ring-primary" placeholder="Ej. Gerente" />
                              </div>
                           </div>
                           <div>
                              <label className="text-stone-300 text-sm font-medium mb-1 block">Correo Electrónico</label>
                              <input name="email" defaultValue={editingMember?.email} type="email" className="w-full bg-stone-800 border-none rounded-lg h-12 px-4 text-white focus:ring-2 focus:ring-primary" placeholder="usuario@elprogreso.com" />
                           </div>
                        </div>

                        <div className="h-px bg-brand-border"></div>

                        <div className="space-y-4">
                           <h3 className="text-primary text-sm font-bold uppercase tracking-wider">Asignación</h3>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <label className="text-stone-300 text-sm font-medium mb-1 block">Departamento</label>
                                 <select name="dept" defaultValue={editingMember?.dept} className="w-full bg-stone-800 border-none rounded-lg h-12 px-4 text-white focus:ring-2 focus:ring-primary">
                                    <option>Logística</option><option>Mantenimiento</option><option>Administración</option><option>Cereales</option><option>Agronomía</option><option>Hacienda</option><option>Estación de Servicio</option>
                                 </select>
                              </div>
                              <div>
                                 <label className="text-stone-300 text-sm font-medium mb-1 block">Estado</label>
                                 <select name="status" defaultValue={editingMember?.status || 'active'} className="w-full bg-stone-800 border-none rounded-lg h-12 px-4 text-white focus:ring-2 focus:ring-primary">
                                    <option value="active">Activo</option>
                                    <option value="inactive">Inactivo</option>
                                 </select>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="p-6 border-t border-brand-border bg-brand-surface flex justify-between gap-4">
                        {editingMember && (
                           <button type="button" onClick={handleDelete} className="h-12 px-6 border border-red-500/30 text-red-500 hover:bg-red-500/10 font-bold rounded-lg transition-colors flex items-center gap-2">
                              <span className="material-symbols-outlined">delete</span> Eliminar
                           </button>
                        )}
                        <button type="submit" className={`h-12 bg-primary hover:bg-primary-dark text-brand-dark font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg ${editingMember ? 'flex-1' : 'w-full'}`}>
                           <span className="material-symbols-outlined">save</span> {editingMember ? 'Guardar Cambios' : 'Crear Miembro'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

export default Team;