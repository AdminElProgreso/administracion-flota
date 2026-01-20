import React, { useState } from 'react';


// Agrega este estado al principio del componente Settings
const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);

React.useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
    });
}, []);

const handleInstallClick = () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        });
    }
};

// ... luego en el renderizado, dentro de {activeTab === 'general' && (...
// Agrega este botón justo antes de los inputs:

{
    deferredPrompt && (
        <button
            onClick={handleInstallClick}
            className="w-full mb-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 animate-pulse"
        >
            <span className="material-symbols-outlined">download</span>
            Instalar Aplicación en el Celular
        </button>
    )
}

const Settings = () => {
    const [activeTab, setActiveTab] = useState<'general' | 'alerts' | 'notifications' | 'security' | 'data'>('general');

    // Settings States
    const [notificationState, setNotificationState] = useState({
        emailInfo: true,
        emailAlerts: true,
        pushUrgent: true,
        weeklyReport: false
    });

    const [thresholds, setThresholds] = useState({
        insurance: 15,
        vtv: 30,
        service: 1000
    });

    // Data Purge State
    const [purgeFrom, setPurgeFrom] = useState('');
    const [purgeTo, setPurgeTo] = useState('');

    const handleSave = () => {
        // Simulation of a save action
        const btn = document.getElementById('save-btn');
        if (btn) {
            const originalText = btn.innerText;
            btn.innerText = 'Guardado!';
            btn.classList.add('bg-emerald-500', 'text-white');
            btn.classList.remove('bg-primary', 'text-brand-dark');
            setTimeout(() => {
                btn.innerText = originalText;
                btn.classList.remove('bg-emerald-500', 'text-white');
                btn.classList.add('bg-primary', 'text-brand-dark');
            }, 2000);
        }
    };

    const TabButton = ({ id, label, icon }: { id: string; label: string; icon: string }) => (
        <button
            onClick={() => setActiveTab(id as any)}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${activeTab === id
                    ? 'bg-brand-surface border border-brand-border text-white shadow-lg'
                    : 'text-stone-500 hover:text-stone-300 hover:bg-brand-surface/50'
                }`}
        >
            <span className={`material-symbols-outlined ${activeTab === id ? 'text-primary' : ''}`}>{icon}</span>
            <span className="font-medium text-sm">{label}</span>
        </button>
    );

    const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
        <div className="flex items-center justify-between py-3 border-b border-brand-border last:border-0">
            <span className="text-stone-300 text-sm">{label}</span>
            <button
                onClick={onChange}
                className={`w-12 h-6 rounded-full relative transition-colors ${checked ? 'bg-primary' : 'bg-stone-700'}`}
            >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-7' : 'left-1'}`}></div>
            </button>
        </div>
    );

    const getTabTitle = () => {
        switch (activeTab) {
            case 'general': return 'Información General';
            case 'alerts': return 'Configuración de Alertas';
            case 'notifications': return 'Preferencias de Notificación';
            case 'security': return 'Seguridad y Acceso';
            case 'data': return 'Gestión de Datos';
            default: return 'Configuración';
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto pb-24">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">Configuración</h1>
                <p className="text-stone-400 text-sm mt-1">Preferencias del sistema, alertas y seguridad.</p>
            </header>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* SIDEBAR TABS */}
                <div className="w-full lg:w-64 flex-shrink-0 space-y-1">
                    <h3 className="px-4 text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Cuenta</h3>
                    <TabButton id="general" label="General" icon="tune" />
                    <TabButton id="security" label="Seguridad" icon="lock" />

                    <h3 className="px-4 text-xs font-bold text-stone-500 uppercase tracking-widest mt-6 mb-2">Sistema</h3>
                    <TabButton id="alerts" label="Umbrales de Alerta" icon="notifications_active" />
                    <TabButton id="notifications" label="Notificaciones" icon="mail" />
                    <TabButton id="data" label="Gestión de Datos" icon="database" />
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 bg-brand-surface border border-brand-border rounded-xl shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
                    {/* Header Section with Title and Action Button */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-8 py-6 border-b border-brand-border bg-brand-dark/20">
                        <h2 className="text-xl font-bold text-white">{getTabTitle()}</h2>
                        <button
                            id="save-btn"
                            onClick={handleSave}
                            className="bg-primary hover:bg-primary-dark text-brand-dark font-bold text-sm px-6 py-2 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">save</span> Guardar Cambios
                        </button>
                    </div>

                    {/* Tab Contents */}
                    <div className="p-8">
                        {/* --- TAB: GENERAL --- */}
                        {activeTab === 'general' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="relative group cursor-pointer">
                                        <div className="w-24 h-24 rounded-full bg-stone-800 border-2 border-brand-border flex items-center justify-center text-stone-600 overflow-hidden">
                                            <span className="material-symbols-outlined text-4xl">local_shipping</span>
                                        </div>
                                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="material-symbols-outlined text-white">photo_camera</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">El Progreso S.A.</h3>
                                        <p className="text-stone-400 text-sm">ID Cuenta: #9923-XK</p>
                                        <button className="text-primary text-xs font-bold mt-2 hover:underline">Cambiar Logo</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Nombre de la Empresa</label>
                                        <input type="text" defaultValue="Transporte El Progreso" className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Email de Contacto</label>
                                        <input type="email" defaultValue="admin@elprogreso.com" className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Zona Horaria</label>
                                        <select className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary">
                                            <option>(GMT-03:00) Buenos Aires</option>
                                            <option>(GMT-04:00) Santiago</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Moneda por Defecto</label>
                                        <select className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary">
                                            <option>ARS ($) - Peso Argentino</option>
                                            <option>USD (US$) - Dólar Estadounidense</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: ALERTS --- */}
                        {activeTab === 'alerts' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <p className="text-stone-400 text-sm mb-6">Defina con cuántos días de anticipación desea que el sistema marque los vencimientos como "Próximos".</p>

                                <div className="space-y-8 max-w-xl">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-white font-bold text-sm flex items-center gap-2">
                                                <span className="material-symbols-outlined text-blue-500">security</span> Vencimiento de Seguros
                                            </label>
                                            <span className="text-primary font-mono font-bold">{thresholds.insurance} días</span>
                                        </div>
                                        <input
                                            type="range" min="5" max="60" step="1"
                                            value={thresholds.insurance}
                                            onChange={(e) => setThresholds({ ...thresholds, insurance: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-brand-dark rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <p className="text-xs text-stone-500 mt-1">Se emitirá alerta cuando falten menos de {thresholds.insurance} días para vencer.</p>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-white font-bold text-sm flex items-center gap-2">
                                                <span className="material-symbols-outlined text-amber-500">verified</span> Vencimiento de VTV / Técnica
                                            </label>
                                            <span className="text-primary font-mono font-bold">{thresholds.vtv} días</span>
                                        </div>
                                        <input
                                            type="range" min="5" max="90" step="5"
                                            value={thresholds.vtv}
                                            onChange={(e) => setThresholds({ ...thresholds, vtv: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-brand-dark rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-brand-border">
                                        <label className="text-xs font-bold text-stone-500 uppercase mb-2 block">Mantenimiento Preventivo</label>
                                        <div className="flex items-center gap-3">
                                            <span className="text-stone-300 text-sm">Alertar cuando falten</span>
                                            <input
                                                type="number"
                                                value={thresholds.service}
                                                onChange={(e) => setThresholds({ ...thresholds, service: parseInt(e.target.value) })}
                                                className="w-24 bg-brand-dark border-brand-border rounded px-2 py-1 text-center text-white font-bold focus:border-primary"
                                            />
                                            <span className="text-stone-300 text-sm">km para el próximo service.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: NOTIFICATIONS --- */}
                        {activeTab === 'notifications' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2 max-w-xl">
                                    <h3 className="text-primary text-xs font-bold uppercase tracking-wider mb-2 mt-4">Correo Electrónico</h3>
                                    <Toggle
                                        label="Resumen semanal de flota"
                                        checked={notificationState.weeklyReport}
                                        onChange={() => setNotificationState({ ...notificationState, weeklyReport: !notificationState.weeklyReport })}
                                    />
                                    <Toggle
                                        label="Alertas de vencimiento (Seguros, VTV)"
                                        checked={notificationState.emailAlerts}
                                        onChange={() => setNotificationState({ ...notificationState, emailAlerts: !notificationState.emailAlerts })}
                                    />
                                    <Toggle
                                        label="Noticias y actualizaciones del sistema"
                                        checked={notificationState.emailInfo}
                                        onChange={() => setNotificationState({ ...notificationState, emailInfo: !notificationState.emailInfo })}
                                    />

                                    <h3 className="text-primary text-xs font-bold uppercase tracking-wider mb-2 mt-8">Aplicación / Push</h3>
                                    <Toggle
                                        label="Alertas críticas (Unidades detenidas)"
                                        checked={notificationState.pushUrgent}
                                        onChange={() => setNotificationState({ ...notificationState, pushUrgent: !notificationState.pushUrgent })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* --- TAB: SECURITY --- */}
                        {activeTab === 'security' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="max-w-md space-y-6">
                                    <div>
                                        <h3 className="text-white font-bold mb-4">Cambiar Contraseña</h3>
                                        <div className="space-y-3">
                                            <input type="password" placeholder="Contraseña Actual" className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary" />
                                            <input type="password" placeholder="Nueva Contraseña" className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary" />
                                            <input type="password" placeholder="Confirmar Nueva Contraseña" className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary" />
                                        </div>
                                        <button className="mt-4 text-primary text-sm font-bold hover:underline">Actualizar Contraseña</button>
                                    </div>

                                    <div className="h-px bg-brand-border my-6"></div>

                                    <div>
                                        <h3 className="text-white font-bold mb-2">Sesiones Activas</h3>
                                        <div className="bg-brand-dark rounded-lg p-3 border border-brand-border flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-stone-500">desktop_windows</span>
                                                <div>
                                                    <p className="text-xs text-white font-bold">Chrome en Windows</p>
                                                    <p className="text-[10px] text-emerald-500">Sesión Actual • IP: 192.168.1.10</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: DATA --- */}
                        {activeTab === 'data' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-brand-dark border border-brand-border p-6 rounded-xl flex flex-col justify-between h-48 hover:border-stone-500 transition-colors">
                                        <div>
                                            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 mb-3">
                                                <span className="material-symbols-outlined">table_view</span>
                                            </div>
                                            <h3 className="text-white font-bold">Exportar a Excel</h3>
                                            <p className="text-stone-500 text-sm mt-1">Descarga el listado completo de flota y vencimientos en formato .xlsx</p>
                                        </div>
                                        <button className="text-emerald-500 font-bold text-sm text-left hover:underline flex items-center gap-1">
                                            Descargar <span className="material-symbols-outlined text-sm">download</span>
                                        </button>
                                    </div>

                                    <div className="bg-brand-dark border border-brand-border p-6 rounded-xl flex flex-col justify-between h-48 hover:border-stone-500 transition-colors">
                                        <div>
                                            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 mb-3">
                                                <span className="material-symbols-outlined">picture_as_pdf</span>
                                            </div>
                                            <h3 className="text-white font-bold">Reporte Mensual PDF</h3>
                                            <p className="text-stone-500 text-sm mt-1">Generar informe ejecutivo de gastos y mantenimiento.</p>
                                        </div>
                                        <button className="text-blue-500 font-bold text-sm text-left hover:underline flex items-center gap-1">
                                            Generar <span className="material-symbols-outlined text-sm">print</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-rose-500/20">
                                    <h3 className="text-rose-500 font-bold text-sm uppercase tracking-wider mb-4">Zona de Peligro</h3>
                                    <div className="bg-rose-950/10 border border-rose-500/30 rounded-xl p-6">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="p-3 bg-rose-500/10 rounded-lg text-rose-500 flex-shrink-0">
                                                <span className="material-symbols-outlined text-2xl">delete_forever</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-bold text-lg">Purgar Registros Históricos</h4>
                                                <p className="text-stone-400 text-sm mt-1 leading-relaxed">
                                                    Esta acción eliminará permanentemente todos los registros de mantenimiento, reparaciones y logs de actividad comprendidos en el rango de fechas seleccionado.
                                                    <br /><strong className="text-rose-400">Esta acción no se puede deshacer.</strong>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 p-4 bg-black/20 rounded-lg border border-rose-500/10">
                                            <div>
                                                <label className="text-xs font-bold text-rose-300 uppercase mb-1.5 block">Desde (Fecha Inicio)</label>
                                                <input
                                                    type="date"
                                                    value={purgeFrom}
                                                    onChange={(e) => setPurgeFrom(e.target.value)}
                                                    className="w-full bg-brand-dark border-rose-500/30 rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-rose-300 uppercase mb-1.5 block">Hasta (Fecha Fin)</label>
                                                <input
                                                    type="date"
                                                    value={purgeTo}
                                                    onChange={(e) => setPurgeTo(e.target.value)}
                                                    className="w-full bg-brand-dark border-rose-500/30 rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-rose-500 focus:border-rose-500 outline-none transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <button className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-rose-900/20">
                                                <span className="material-symbols-outlined">warning</span> Ejecutar Purga
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;