import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// Funciones auxiliares para detección de dispositivo
const isIos = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
};

const isInStandaloneMode = () =>
    ('standalone' in window.navigator && (window.navigator as any).standalone) ||
    window.matchMedia('(display-mode: standalone)').matches;

const Settings = () => {
    const [activeTab, setActiveTab] = useState<'general' | 'alerts' | 'notifications' | 'security' | 'data'>('general');

    // --- PUSH NOTIFICATION CONFIG ---
    const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    console.log('--- LLAVE VAPID EN USO:', VAPID_PUBLIC_KEY, '---');

    const urlBase64ToUint8Array = (base64String: string) => {
        if (!base64String) {
            throw new Error('La clave pública VAPID no está configurada.');
        }
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribeUser = async () => {
        if (!('serviceWorker' in navigator)) {
            console.error('Service Worker not supported');
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // FORZAR NUEVA SUSCRIPCIÓN:
            // Desuscribimos la anterior para asegurar que se use la llave VAPID actual
            const oldSubscription = await registration.pushManager.getSubscription();
            if (oldSubscription) {
                console.log('Cleaning old subscription...');
                await oldSubscription.unsubscribe();
            }

            console.log('Creating fresh subscription...');
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            console.log('Subscription object:', JSON.stringify(subscription));

            // GUARDAR SUSCRIPCIÓN EN SUPABASE
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            // Si no hay usuario, usamos un ID persistente basado en el dispositivo o permitimos nulo si la DB lo deja
            // Pero lo ideal es que estén logueados.
            const subscriptionData = {
                user_id: user?.id || '00000000-0000-0000-0000-000000000000', // ID de sistema si no hay login
                subscription: subscription,
                updated_at: new Date()
            };

            console.log('Sending to Supabase:', subscriptionData);

            const { error } = await supabase
                .from('push_subscriptions')
                .upsert(subscriptionData, { onConflict: 'subscription' });

            if (error) {
                console.error('Supabase Error:', error);
                alert('Error al guardar en base de datos: ' + error.message);
                return false;
            }

            alert('¡Dispositivo registrado correctamente!');
            return true;

        } catch (error: any) {
            console.error('Failed to subscribe: ', error);
            if (error.name === 'NotAllowedError') {
                alert('Permiso denegado. Por favor, habilita las notificaciones en la configuración de la App o del navegador.');
            } else {
                alert('Error técnico: ' + error.message);
            }
            return false;
        }
    };

    const handlePushToggle = async () => {
        const newState = !notificationState.masterToggle;

        if (newState) {
            console.log('Requesting notification permission...');
            const currentPermission = Notification.permission;

            if (currentPermission === 'denied') {
                alert('Las notificaciones están bloqueadas en tu navegador. Debes habilitarlas manualmente en la configuración del sitio.');
                return;
            }

            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const success = await subscribeUser();
                if (success) {
                    setNotificationState(prev => ({ ...prev, masterToggle: true }));
                    localStorage.setItem('fleet_notifications', JSON.stringify({ ...notificationState, masterToggle: true }));
                }
            }
        } else {
            setNotificationState(prev => ({ ...prev, masterToggle: false }));
            localStorage.setItem('fleet_notifications', JSON.stringify({ ...notificationState, masterToggle: false }));
            alert('Has desactivado las notificaciones en este dispositivo.');
        }
    };

    const sendTestNotification = async () => {
        if ('serviceWorker' in navigator && notificationState.masterToggle) {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification('Prueba de Notificación', {
                    body: '¡El sistema de alertas funciona correctamente!',
                    icon: '/pwa-192x192.png',
                    badge: '/pwa-192x192.png',
                    vibrate: [200, 100, 200],
                    data: {
                        url: window.location.href
                    }
                } as any);
            } catch (error) {
                console.error('Error sending test notification:', error);
                alert('Error al enviar la notificación de prueba.');
            }
        } else {
            alert('Asegúrate de activar las notificaciones primero y permitir permisos.');
        }
    };


    // --- ESTADOS PARA PWA ---
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    // --- ESTADOS PARA CONTRASEÑA ---
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    // --- OTROS ESTADOS ---
    const [notificationState, setNotificationState] = useState({
        masterToggle: true,
        emailInfo: true,
        emailAlerts: true, // Reused as Insurance Alert for now or generic
        vtvAlerts: true,
        patenteAlerts: true,
        apptAlerts: true,
        pushUrgent: true,
        weeklyReport: false,
    });

    const [thresholds, setThresholds] = useState({
        insurance: 15,
        vtv: 30,
        patente: 10,
        appointments: 3,
        service: 1000
    });

    const [purgeFrom, setPurgeFrom] = useState('');
    const [purgeTo, setPurgeTo] = useState('');

    useEffect(() => {
        // Cargar configuración de LocalStorage
        const savedThresholds = localStorage.getItem('fleet_thresholds');
        const savedNotifications = localStorage.getItem('fleet_notifications');

        if (savedThresholds) setThresholds(JSON.parse(savedThresholds));
        if (savedNotifications) setNotificationState(JSON.parse(savedNotifications));

        // Escuchar el evento de instalación (Android/Chrome)
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // Verificar si ya está instalada
        if (isInStandaloneMode()) {
            setIsInstalled(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
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

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            return;
        }

        setPasswordLoading(true);
        setPasswordMessage({ type: '', text: '' });

        // ACTUALIZACIÓN: Cambiamos la contraseña y marcamos 'password_set' como true
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
            data: { password_set: true }
        });

        if (error) {
            setPasswordMessage({ type: 'error', text: error.message });
        } else {
            setPasswordMessage({ type: 'success', text: '¡Contraseña establecida correctamente!' });
            setNewPassword('');
            setConfirmPassword('');
        }
        setPasswordLoading(false);
    };

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

    const handleSaveGeneral = () => {
        setSaveStatus('saving');

        // Guardar en LocalStorage
        localStorage.setItem('fleet_thresholds', JSON.stringify(thresholds));
        localStorage.setItem('fleet_notifications', JSON.stringify(notificationState));

        // Simular retardo de red
        setTimeout(() => {
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 800);
    };

    const TabButton = ({ id, label, icon }: { id: string; label: string; icon: string }) => (
        <button
            onClick={() => setActiveTab(id as any)}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${activeTab === id
                ? 'bg-brand-surface border border-brand-border text-white shadow-lg'
                : 'text-stone-400 hover:text-stone-200 hover:bg-brand-surface/50'
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
                        {activeTab !== 'security' && (
                            <button
                                id="save-btn"
                                onClick={handleSaveGeneral}
                                disabled={saveStatus !== 'idle'}
                                className={`font-bold text-sm px-6 py-2 rounded-lg shadow-lg transition-all flex items-center gap-2 ${saveStatus === 'success'
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-primary hover:bg-primary-dark text-brand-dark'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    {saveStatus === 'success' ? 'check' : saveStatus === 'saving' ? 'sync' : 'save'}
                                </span>
                                {saveStatus === 'success' ? 'Guardado!' : saveStatus === 'saving' ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        )}
                    </div>

                    <div className="p-8">
                        {activeTab === 'general' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">

                                {/* PANEL DE INSTALACIÓN INTELIGENTE */}
                                {!isInstalled && (
                                    <div className="mb-8 p-5 rounded-xl border border-primary/30 bg-primary/5 shadow-inner">
                                        <h3 className="text-primary font-bold text-lg mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined">install_mobile</span> Instalar en este dispositivo
                                        </h3>

                                        {deferredPrompt && (
                                            <button onClick={handleInstallClick} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 animate-pulse transition-all">
                                                <span className="material-symbols-outlined">download</span> Instalar App Ahora
                                            </button>
                                        )}

                                        {isIos() && (
                                            <div className="text-sm text-stone-300 bg-brand-dark/50 p-4 rounded-lg border border-brand-border">
                                                <p className="mb-3 font-bold text-white flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-sm text-primary">apple</span> Instrucciones para iPhone:
                                                </p>
                                                <ol className="space-y-3">
                                                    <li className="flex items-start gap-2">
                                                        <span className="bg-stone-800 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">1</span>
                                                        <span>Toca el botón <strong>Compartir</strong> <span className="material-symbols-outlined text-sm align-middle bg-stone-700 p-1 rounded ml-1">ios_share</span> en Safari.</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <span className="bg-stone-800 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">2</span>
                                                        <span>Busca y elige <strong>"Agregar a Inicio"</strong> <span className="material-symbols-outlined text-sm align-middle bg-stone-700 p-1 rounded ml-1">add_box</span>.</span>
                                                    </li>
                                                </ol>
                                            </div>
                                        )}

                                        {!deferredPrompt && !isIos() && (
                                            <div className="text-xs text-stone-500 mt-2 italic">
                                                Si no ves el botón, usa la opción "Instalar aplicación" desde el menú de tu navegador.
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-6 mb-8">
                                    <div className="w-24 h-24 rounded-full bg-stone-800 border-2 border-brand-border flex items-center justify-center text-stone-600">
                                        <span className="material-symbols-outlined text-4xl">local_shipping</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">El Progreso S.A.</h3>
                                        <p className="text-stone-400 text-sm italic">Sistema de Gestión de Flota</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Empresa</label>
                                        <input type="text" defaultValue="Transporte El Progreso" className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Email Administrador</label>
                                        <input type="email" defaultValue="admin@elprogreso.com" className="w-full bg-brand-dark border-brand-border rounded-lg h-10 px-3 text-white focus:ring-1 focus:ring-primary outline-none" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: SECURITY (ACTUALIZADA) --- */}
                        {activeTab === 'security' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="max-w-md">
                                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                                        <div>
                                            <h3 className="text-white font-bold mb-2 text-lg">Definir Contraseña</h3>
                                            <p className="text-stone-400 text-sm mb-6 leading-relaxed">
                                                Has accedido mediante una invitación segura. Por favor, establece una contraseña para tus próximos ingresos.
                                            </p>

                                            {passwordMessage.text && (
                                                <div className={`mb-6 p-4 rounded-xl text-sm font-bold border ${passwordMessage.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    } flex items-center gap-3`}>
                                                    <span className="material-symbols-outlined">
                                                        {passwordMessage.type === 'error' ? 'report' : 'check_circle'}
                                                    </span>
                                                    {passwordMessage.text}
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Nueva Contraseña</label>
                                                    <input
                                                        type="password"
                                                        placeholder="Mínimo 6 caracteres"
                                                        required
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="w-full bg-brand-dark border-brand-border rounded-xl h-12 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">Confirmar Contraseña</label>
                                                    <input
                                                        type="password"
                                                        placeholder="Repite la contraseña"
                                                        required
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        className="w-full bg-brand-dark border-brand-border rounded-xl h-12 px-4 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={passwordLoading}
                                            className="w-full bg-primary hover:bg-primary-dark text-brand-dark font-bold h-12 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {passwordLoading ? (
                                                <span className="w-5 h-5 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></span>
                                            ) : (
                                                <>
                                                    <span>Guardar Contraseña</span>
                                                    <span className="material-symbols-outlined">lock_reset</span>
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: ALERTS --- */}
                        {activeTab === 'alerts' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <p className="text-stone-400 text-sm mb-6">Configura con cuánta antelación quieres recibir avisos de vencimientos.</p>
                                <div className="space-y-8 max-w-xl">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-white font-bold text-sm flex items-center gap-2">
                                                <span className="material-symbols-outlined text-blue-500">security</span> Seguros
                                            </label>
                                            <span className="text-primary font-mono font-bold">{thresholds.insurance} días</span>
                                        </div>
                                        <input type="range" min="5" max="60" value={thresholds.insurance} onChange={(e) => setThresholds({ ...thresholds, insurance: parseInt(e.target.value) })} className="w-full h-2 bg-brand-dark rounded-lg appearance-none cursor-pointer accent-primary" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-white font-bold text-sm flex items-center gap-2">
                                                <span className="material-symbols-outlined text-amber-500">verified</span> VTV
                                            </label>
                                            <span className="text-primary font-mono font-bold">{thresholds.vtv} días</span>
                                        </div>
                                        <input type="range" min="5" max="90" value={thresholds.vtv} onChange={(e) => setThresholds({ ...thresholds, vtv: parseInt(e.target.value) })} className="w-full h-2 bg-brand-dark rounded-lg appearance-none cursor-pointer accent-primary" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-white font-bold text-sm flex items-center gap-2">
                                                <span className="material-symbols-outlined text-white">badge</span> Patente / Impuestos
                                            </label>
                                            <span className="text-primary font-mono font-bold">{thresholds.patente} días</span>
                                        </div>
                                        <input type="range" min="5" max="60" value={thresholds.patente} onChange={(e) => setThresholds({ ...thresholds, patente: parseInt(e.target.value) })} className="w-full h-2 bg-brand-dark rounded-lg appearance-none cursor-pointer accent-primary" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <label className="text-white font-bold text-sm flex items-center gap-2">
                                                <span className="material-symbols-outlined text-purple-500">event</span> Turnos Programados
                                            </label>
                                            <span className="text-primary font-mono font-bold">{thresholds.appointments} días</span>
                                        </div>
                                        <input type="range" min="1" max="30" value={thresholds.appointments} onChange={(e) => setThresholds({ ...thresholds, appointments: parseInt(e.target.value) })} className="w-full h-2 bg-brand-dark rounded-lg appearance-none cursor-pointer accent-primary" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: NOTIFICATIONS --- */}
                        {activeTab === 'notifications' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-6 max-w-xl">
                                    <div className="bg-brand-dark/30 p-4 rounded-xl border border-brand-border">
                                        <Toggle
                                            label="Activar Notificaciones Push"
                                            checked={notificationState.masterToggle}
                                            onChange={handlePushToggle}
                                        />
                                        <p className="text-xs text-stone-500 mt-2 px-1">Al desactivar esta opción, no recibirás ninguna notificación en tu dispositivo.</p>

                                        {notificationState.masterToggle && (
                                            <div className="mt-4 flex justify-end">
                                                <button
                                                    onClick={sendTestNotification}
                                                    className="bg-brand-dark hover:bg-stone-800 text-stone-300 hover:text-primary text-xs font-bold py-2 px-4 rounded-lg border border-stone-700 transition-all flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                                                    Probar Notificación
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {notificationState.masterToggle && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3 px-1">Tipos de Alerta</h4>
                                            <Toggle label="Vencimiento de Seguros" checked={notificationState.emailAlerts} onChange={() => setNotificationState({ ...notificationState, emailAlerts: !notificationState.emailAlerts })} />
                                            <Toggle label="Vencimiento de VTV" checked={notificationState.vtvAlerts} onChange={() => setNotificationState({ ...notificationState, vtvAlerts: !notificationState.vtvAlerts })} />
                                            <Toggle label="Vencimiento de Patentes" checked={notificationState.patenteAlerts} onChange={() => setNotificationState({ ...notificationState, patenteAlerts: !notificationState.patenteAlerts })} />
                                            <Toggle label="Recordatorio de Turnos" checked={notificationState.apptAlerts} onChange={() => setNotificationState({ ...notificationState, apptAlerts: !notificationState.apptAlerts })} />
                                            <div className="border-t border-brand-border my-2"></div>
                                            <Toggle label="Resumen Semanal" checked={notificationState.weeklyReport} onChange={() => setNotificationState({ ...notificationState, weeklyReport: !notificationState.weeklyReport })} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* --- TAB: DATA --- */}
                        {activeTab === 'data' && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-brand-dark border border-brand-border rounded-xl flex flex-col justify-between h-40">
                                    <span className="material-symbols-outlined text-emerald-500 text-3xl">table_view</span>
                                    <div>
                                        <p className="text-white font-bold">Exportar Excel</p>
                                        <p className="text-stone-500 text-xs mt-1">Listado completo de flota.</p>
                                    </div>
                                    <button className="text-emerald-500 text-xs font-bold text-left hover:underline uppercase">Descargar</button>
                                </div>
                                <div className="p-4 bg-brand-dark border border-brand-border rounded-xl flex flex-col justify-between h-40">
                                    <span className="material-symbols-outlined text-blue-500 text-3xl">picture_as_pdf</span>
                                    <div>
                                        <p className="text-white font-bold">Reporte Mensual</p>
                                        <p className="text-stone-500 text-xs mt-1">Resumen ejecutivo de gastos.</p>
                                    </div>
                                    <button className="text-blue-500 text-xs font-bold text-left hover:underline uppercase">Generar</button>
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