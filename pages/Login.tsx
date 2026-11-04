import { useState, type FormEvent } from 'react';
import { supabase } from '../supabase';
import { Icon, Logo } from '../components/ui';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      // 400 is a wrong email or password; anything else is usually the connection
      setError(error.status === 400 ? 'Email o contraseña incorrectos.' : 'No se pudo ingresar. Revisá la conexión.');
      setLoading(false);
    }
    // On success App.tsx picks up the new session
  };

  return (
    <div className="login">
      <div className="login-art"><p>Desde 1948 al servicio del productor y la comunidad</p></div>
      <form className="login-card" onSubmit={handleLogin}>
        <Logo />
        <h1 className="display">Gestión de Flota</h1>
        <p>Ingresá con tu cuenta de la Cooperativa.</p>
        {error && <p className="form-msg error" role="alert">{error}</p>}
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input className="input" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? 'Ingresando…' : <>Ingresar<Icon name="arrow_forward" /></>}
        </button>
      </form>
      <p className="login-foot">Cooperativa Agropecuaria "El Progreso" de Henderson Ltda.</p>
    </div>
  );
};

export default Login;
