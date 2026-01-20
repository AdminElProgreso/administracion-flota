import React, { useState } from 'react';
import { supabase } from '../supabase';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError('Credenciales incorrectas o acceso denegado.');
            setLoading(false);
        }
        // Si es exitoso, App.tsx detectará el cambio de sesión automáticamente
    };

    return (
        <div className="min-h-screen bg-[#0c0a09] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#1c1917] border border-[#44403c] rounded-2xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-300">

                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 border border-primary/20">
                        <span className="material-symbols-outlined text-4xl">local_shipping</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">El Progreso</h1>
                    <p className="text-stone-400 text-sm mt-1">Gestión de Flota Privada</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3 rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">error</span>
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Email Corporativo</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#0c0a09] border border-[#44403c] rounded-xl h-12 px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="usuario@elprogreso.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Contraseña</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#0c0a09] border border-[#44403c] rounded-xl h-12 px-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-dark text-[#1c1917] font-bold h-12 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-[#1c1917] border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span>Iniciar Sesión</span>
                                <span className="material-symbols-outlined text-lg">login</span>
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-[#44403c] text-xs mt-6">
                    Acceso restringido únicamente a personal autorizado.
                </p>
            </div>
        </div>
    );
};

export default Login;