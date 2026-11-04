import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import { DEFAULT_PREFS, type AlertPrefs, type DocType } from '../supabase/functions/_shared/alerts';
import { useToast } from '../components/Toast';
import { Icon, PageHead, Stepper, Switch } from '../components/ui';
import { initials, passwordProblem, passwordUpdateMessage, pushSupportNote } from '../lib/account';
import { isDeviceSubscribed, pushSupport, showTestNotification, subscribeDevice, unsubscribeDevice } from '../lib/push';
import { logout } from '../lib/session';
import { ALERT_PREFS_KEY, saveAlertPrefs, useAlertPrefs } from '../lib/useAlertPrefs';
import { useInstallPrompt } from '../lib/useInstallPrompt';

type PrefKey = DocType | 'appointments';

const STEPS: { key: PrefKey; icon: string; label: string; max: number }[] = [
  { key: 'Seguro', icon: 'shield', label: 'Seguro', max: 60 },
  { key: 'VTV', icon: 'fact_check', label: 'VTV', max: 90 },
  { key: 'Patente', icon: 'receipt_long', label: 'Patente', max: 60 },
  { key: 'appointments', icon: 'event', label: 'Turnos', max: 30 },
];

const KINDS: { key: PrefKey; label: string }[] = [
  { key: 'Seguro', label: 'Vencimiento de seguros' },
  { key: 'VTV', label: 'Vencimiento de VTV' },
  { key: 'Patente', label: 'Vencimiento de patentes' },
  { key: 'appointments', label: 'Recordatorio de turnos' },
];

// Thresholds and switches of the alerts: loaded once from user_settings and saved 1 s after the last change.
// Nothing is saved before they arrive, so the defaults never overwrite what is stored.
function useEditablePrefs() {
  const queryClient = useQueryClient();
  const { prefs: savedPrefs, userId, loadState, refetch } = useAlertPrefs();
  const [prefs, setPrefs] = useState<AlertPrefs>(DEFAULT_PREFS);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const lastSaved = useRef('');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);

  useEffect(() => {
    if (prefsLoaded) return;
    if (loadState === 'ready') {
      setPrefs(savedPrefs);
      lastSaved.current = JSON.stringify(savedPrefs);
      setSyncError(null);
      setPrefsLoaded(true);
    } else if (loadState === 'error') {
      setSyncError('No se pudieron cargar tus ajustes. Revisá la conexión.');
    }
  }, [prefsLoaded, loadState, savedPrefs]);

  const persistPrefs = async (): Promise<boolean> => {
    if (!userId || !prefsLoaded) {
      setSyncError('No se pudo guardar. Revisá la conexión.');
      return false;
    }
    setSaving(true);
    try {
      await saveAlertPrefs(userId, prefs);
      lastSaved.current = JSON.stringify(prefs);
      setSyncError(null);
      setSavedOnce(true);
      void queryClient.invalidateQueries({ queryKey: ALERT_PREFS_KEY });
      return true;
    } catch (e) {
      console.error('Alert prefs save error', e);
      setSyncError('No se pudo guardar. Revisá la conexión.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!prefsLoaded || !userId || JSON.stringify(prefs) === lastSaved.current) return;
    const timer = setTimeout(persistPrefs, 1000);
    return () => clearTimeout(timer);
    // persistPrefs reads the same prefs this effect depends on
  }, [prefs, prefsLoaded, userId]);

  // Before loading, retrying reloads; after, it saves again what failed
  const retry = () => (prefsLoaded ? void persistPrefs() : void refetch());

  return { prefs, setPrefs, prefsLoaded, userId, syncError, saving, savedOnce, retry };
}

function Section({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <section className="card set">
      <h2 className="set-title"><Icon name={icon} />{title}</h2>
      {children}
    </section>
  );
}

function SaveStatus({ saving, error, savedOnce, onRetry }: { saving: boolean; error: string | null; savedOnce: boolean; onRetry: () => void }) {
  if (saving) return <p className="set-status" role="status">Guardando…</p>;
  if (error) {
    return (
      <p className="set-status error" role="alert">
        <Icon name="error" />{error}
        <button type="button" className="link" onClick={onRetry}>Reintentar</button>
      </p>
    );
  }
  return <p className="set-status" role="status">{savedOnce ? <><Icon name="check_circle" />Cambios guardados</> : 'Los cambios se guardan solos.'}</p>;
}

function DeviceSwitch({ userId }: { userId: string | null }) {
  const toast = useToast();
  const support = pushSupport();
  const note = pushSupportNote(support);
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    isDeviceSubscribed().then(s => { if (alive) setSubscribed(s); }, () => { if (alive) setSubscribed(false); });
    return () => { alive = false; };
  }, []);

  const toggle = async (next: boolean) => {
    if (!userId) return;
    setBusy(true);
    try {
      if (next) {
        await subscribeDevice(userId);
        toast('Listo: este celular recibe los avisos');
      } else {
        await unsubscribeDevice();
        toast('Este celular ya no recibe avisos', 'info');
      }
      setSubscribed(next);
    } catch (e) {
      console.error('Push toggle error', e);
      // lib/push explains its own failures; the browser's come in English
      const ours = e instanceof Error && !(e instanceof DOMException);
      toast(ours ? e.message : next ? 'No se pudo activar en este celular. Probá de nuevo.' : 'No se pudo desactivar. Probá de nuevo.', 'error');
      setSubscribed(await isDeviceSubscribed().catch(() => false));
    } finally {
      setBusy(false);
    }
  };

  const test = () => showTestNotification().catch(e => {
    console.error('Test notification error', e);
    toast('No se pudo mostrar la prueba.', 'error');
  });

  return <>
    <div className="set-row">
      <span className="set-label">Recibir avisos en este celular</span>
      <Switch
        checked={subscribed === true}
        disabled={support !== 'ok' || subscribed === null || busy || !userId}
        label="Recibir avisos en este celular"
        onChange={next => void toggle(next)}
      />
    </div>
    {note && <p className="note warn"><Icon name="info" />{note}</p>}
    <div className="set-row">
      <span className="set-label">Ver cómo llega un aviso</span>
      <button type="button" className="btn btn-ghost btn-sm" disabled={subscribed !== true} onClick={() => void test()}><Icon name="send" />Probar</button>
    </div>
  </>;
}

function PasswordForm({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem(password, confirm);
    if (problem) { toast(problem, 'error'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password, data: { password_set: true } });
      if (error) {
        console.error('Password update error', error);
        toast(passwordUpdateMessage(error), 'error');
        return;
      }
      toast('Contraseña guardada');
      onDone();
    } catch (err) {
      console.error('Password update error', err);
      toast(passwordUpdateMessage({}), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="set-form" onSubmit={submit}>
      <label className="field"><span>Contraseña nueva</span><input className="input" type="password" autoComplete="new-password" placeholder="Al menos 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} /></label>
      <label className="field"><span>Repetila</span><input className="input" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
      <div className="set-actions">
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Guardando…' : 'Guardar contraseña'}</button>
      </div>
    </form>
  );
}

function InstallCard() {
  const { canInstall, install, installed, ios } = useInstallPrompt();
  return (
    <Section icon="install_mobile" title="La app en tu celular">
      {installed ? (
        <p className="set-help"><Icon name="check_circle" className="ok" /> Ya está instalada en este dispositivo.</p>
      ) : <>
        <p className="set-help">Instalala para abrirla como una app y recibir los avisos aunque no la tengas abierta.</p>
        {canInstall && <div className="set-actions"><button type="button" className="btn btn-primary btn-sm" onClick={() => void install()}><Icon name="download" />Instalar</button></div>}
        {!canInstall && ios && (
          <ol className="ios-steps">
            <li>En Safari, tocá <b>Compartir</b> <Icon name="ios_share" />.</li>
            <li>Elegí <b>Agregar a inicio</b> <Icon name="add_box" />.</li>
          </ol>
        )}
        {!canInstall && !ios && <p className="set-help">Si no aparece el botón, usá "Instalar aplicación" en el menú del navegador.</p>}
      </>}
    </Section>
  );
}

export default function Settings() {
  const { prefs, setPrefs, prefsLoaded, userId, syncError, saving, savedOnce, retry } = useEditablePrefs();
  const [email, setEmail] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!alive) return;
      setEmail(session?.user.email ?? null);
      // Accounts that came in with an invitation link still have no password of their own
      const missing = Boolean(session && !session.user.user_metadata?.password_set);
      setNeedsPassword(missing);
      if (missing) setShowPassword(true);
    });
    return () => { alive = false; };
  }, []);

  const setThreshold = (key: PrefKey, value: number) => setPrefs(p => ({ ...p, thresholds: { ...p.thresholds, [key]: value } }));
  const setEnabled = (key: PrefKey, on: boolean) => setPrefs(p => ({ ...p, enabled: { ...p.enabled, [key]: on } }));

  const alerts = (
    <Section key="alerts" icon="notifications_active" title="Avisos de vencimiento">
      <p className="set-help">Desde cuántos días antes te avisamos. Desde ese día te llega un aviso diario hasta que el documento se renueve. Si cargás un turno, solo te recordamos el turno.</p>
      {STEPS.map(s => {
        const value = prefs.thresholds[s.key];
        return (
          <div key={s.key} className="set-row">
            <span className="set-label"><Icon name={s.icon} />{s.label}</span>
            <Stepper value={value} min={1} max={s.max} disabled={!prefsLoaded} label={`Días de aviso: ${s.label}`} onChange={n => setThreshold(s.key, n)} />
            <span className="set-unit">{value === 1 ? 'día antes' : 'días antes'}</span>
          </div>
        );
      })}
      <SaveStatus saving={saving} error={syncError} savedOnce={savedOnce} onRetry={retry} />
    </Section>
  );

  const device = (
    <Section key="device" icon="smartphone" title="Notificaciones en este celular">
      <DeviceSwitch userId={userId} />
      <p className="set-sub">Qué avisos querés recibir</p>
      {KINDS.map(k => (
        <div key={k.key} className="set-row">
          <span className="set-label">{k.label}</span>
          <Switch checked={prefs.enabled[k.key]} disabled={!prefsLoaded} label={k.label} onChange={on => setEnabled(k.key, on)} />
        </div>
      ))}
    </Section>
  );

  const account = (
    <Section key="account" icon="person" title="Cuenta">
      <div className="set-account">
        <span className="avatar">{initials(email) || <Icon name="person" />}</span>
        <div><b>{email ?? '—'}</b><div className="set-account-sub">Sesión iniciada</div></div>
      </div>
      {needsPassword && <p className="note warn"><Icon name="key" />Entraste con una invitación: elegí una contraseña para los próximos ingresos.</p>}
      {showPassword && <PasswordForm onDone={() => { setShowPassword(false); setNeedsPassword(false); }} />}
      <div className="set-actions">
        {!showPassword && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowPassword(true)}><Icon name="key" />Cambiar contraseña</button>}
        <button type="button" className="btn btn-danger btn-sm" onClick={() => void logout()}><Icon name="logout" />Cerrar sesión</button>
      </div>
    </Section>
  );

  // Coming from the "Configurá tu contraseña" notice, the account goes first
  const sections = needsPassword ? [account, alerts, device] : [alerts, device, account];

  return (
    <div className="screen">
      <PageHead eyebrow="Tu cuenta y tus avisos" title="Ajustes" />
      <div className="settings-grid">
        {sections}
        <InstallCard />
      </div>
    </div>
  );
}
