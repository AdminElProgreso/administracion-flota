import React, { useState, useEffect } from 'react';

// Detectar si es iOS (iPhone/iPad)
const isIos = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
};

// Detectar si ya está instalada (Standalone mode)
const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator as any).standalone;

const Settings = () => {
    const [activeTab, setActiveTab] = useState<'general' | 'alerts' | 'notifications' | 'security' | 'data'>('general');
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Escuchar evento de instalación (Solo Android/Desktop)
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });

        // Chequear si ya está instalada
        if (window.matchMedia('(display-mode: standalone)').matches || isInStandaloneMode()) {
            setIsInstalled(true);
        }
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

    // ... (Resto de tus estados: notificationState, thresholds, purgeFrom...)
    const [notificationState, setNotificationState] = useState({
        emailInfo: true, emailAlerts: true, pushUrgent: true, weeklyReport: false
    });
    const [thresholds, setThresholds] = useState({ insurance: 15, vtv: 30, service: 1000 });
    const [purgeFrom, setPurgeFrom] = useState('');
    const [purgeTo, setPurgeTo] = useState('');

    const handleSave = () => {
        // ... (Tu función handleSave original)
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

    const TabButton = ({ id, label, icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${activeTab === id
                    ? 'bg-brand-surface border border-brand-border text-white shadow-lg'
                    : 'text-stone-500 hover:text-stone-300 hover:bg-brand-surface/50'
                }`}
        >
            <span className={`material-symbols-outlined ${activeTab === id ? 'text-primary' : ''}`}>{icon}</span>
            <span className="font-medium text-sm">{label}</span>
        </button>
    );

    const Toggle = ({ label, checked, onChange }: any) => (
        <div className="flex items-center justify-between py-3 border-b border-brand-border last:border-0">
            <span className="text-stone-300 text-sm">{label}</span>
            <button onClick={onChange} className={`w-12 h-6 rounded-full relative transition-colors ${checked ? 'bg-primary' : 'bg-stone-700'}`}>
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
                <div className="w-full lg:w-64 flex-shrink-0 space-y-1">
                    <h3 className="px-4 text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Cuenta</h3>
                    <TabButton id="general" label="General" icon="tune" />
                    <TabButton id="security" label="Seguridad" icon="lock" />
                    <h3 className="px-4 text-xs font-bold text-stone-500 uppercase tracking-widest mt-6 mb-2">Sistema</h3>
                    <TabButton id="alerts" label="Umbrales de Alerta" icon="notifications_active" />
                    <TabButton id="notifications" label="Notificaciones" icon="mail" />
                    <TabButton id="data" label="Gestión de Datos" icon="database" />
                </div>

                <div className="flex-1 bg-brand-surface border border-brand-border rounded-xl shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-8 py-6 border-b border-brand-border bg-brand-dark/20">
                        <h2 className="text-xl font-bold text-white">{getTabTitle()}</h2>
                        <button id="save-btn" onClick={handleSave} className="bg-primary hover:bg-primary-dark text-brand-dark font-bold text-sm px-6 py-2 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">save</span> Guardar Cambios
                        </button>
                    </div>

                    <div className="p-8">
                        {activeTab === 'general' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">

                                {/* --- PANEL DE INSTALACIÓN --- */}
                                {!isInstalled && (
                                    <div className="mb-8 p-4 rounded-xl border border-primary/30 bg-primary/5">
                                        <h3 className="text-primary font-bold text-lg mb-2 flex items-center gap-2">
                                            <span className="material-symbols-outlined">install_mobile</span> Instalar App
                                        </h3>

                                        {/* Caso 1: Android/Desktop con botón automático */}
                                        {deferredPrompt && (
                                            <button
                                                onClick={handleInstallClick}
                                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 animate-pulse transition-all"
                                            >
                                                <span className="material-symbols-outlined">download</span>
                                                Instalar Ahora
                                            </button>
                                        )}

                                        {/* Caso 2: iOS (iPhone) - Instrucciones Manuales */}
                                        {isIos() && (
                                            <div className="text-sm text-stone-300">
                                                <p className="mb-2">Para instalar en iPhone/iPad:</p>
                                                <ol className="list-decimal list-inside space-y-1 ml-1">
                                                    <li>Toca el botón <strong>Compartir</strong> <span className="material-symbols-outlined text-xs inline bg-stone-700 p-1 rounded">ios_share</span> en la barra inferior.</li>
                                                    <li>Desliza hacia abajo y elige <strong>"Agregar a Inicio"</strong> <span className="material-symbols-outlined text-xs inline bg-stone-700 p-1 rounded">add_box</span>.</li>
                                                </ol>
                                            </div>
                                        )}

                                        {/* Caso 3: Android sin botón (Manual) */}
                                        {!deferredPrompt && !isIos() && (
                                            <div className="text-sm text-stone-300">
                                                <p className="mb-2">Si no ves el botón de instalación:</p>
                                                <ol className="list-decimal list-inside space-y-1 ml-1">
                                                    <li>Toca los <strong>3 puntos</strong> <span className="material-symbols-outlined text-xs inline bg-stone-700 p-1 rounded">more_vert</span> del navegador.</li>
                                                    <li>Selecciona <strong>"Instalar aplicación"</strong> o "Agregar a la pantalla principal".</li>
                                                </ol>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ... Resto de tus inputs de empresa ... */}
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="relative group cursor-pointer">
                                        <div className="w-24 h-24 rounded-full bg-stone-800 border-2 border-brand-border flex items-center justify-center text-stone-600 overflow-hidden">
                                            <span className="material-symbols-outlined text-4xl">local_shipping</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">El Progreso S.A.</h3>
                                        <p className="text-stone-400 text-sm">ID Cuenta: #9923-XK</p>
                                    </div>
                                </div>
                                {/* ... inputs de nombre, email, etc ... */}
                            </div>
                        )}

                        {/* ... Resto de tabs (alerts, notifications, etc) sin cambios ... */}
                        {activeTab === 'alerts' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-8 max-w-xl">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-white font-bold text-sm flex items-center gap-2">
                                                <span className="material-symbols-outlined text-blue-500">security</span> Vencimiento de Seguros
                                            </label>
                                            <span className="text-primary font-mono font-bold">{thresholds.insurance} días</span>
                                        </div>
                                        <input type="range" min="5" max="60" step="1" value={thresholds.insurance} onChange={(e) => setThresholds({ ...thresholds, insurance: parseInt(e.target.value) })} className="w-full h-2 bg-brand-dark rounded-lg appearance-none cursor-pointer accent-primary" />
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Asegúrate de mantener el resto de las tabs que ya tenías */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;