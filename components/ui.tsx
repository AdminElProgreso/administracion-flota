import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { DocStatus } from '../supabase/functions/_shared/alerts';
import type { VehicleStatus } from '../types';
import { STATE_CLASS, docLabel } from '../lib/docStyles';
import { plateText } from '../lib/format';
import { STATUS_INFO } from '../lib/vehicles';

// Same URL as in vite.config.ts (cached by the service worker); replaced by the official file when available
export const LOGO_URL = 'https://elprogresocoop.com.ar/public/img/logo_nav.png';

export function Icon({ name, fill = false, className = '' }: { name: string; fill?: boolean; className?: string }) {
  return <span className={`ms${fill ? ' fill' : ''}${className ? ` ${className}` : ''}`} aria-hidden="true">{name}</span>;
}

export function Logo({ className = 'logo' }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="logo-fallback">El Progreso</span>;
  return <img className={className} src={LOGO_URL} alt="Cooperativa Agropecuaria El Progreso de Henderson Ltda." onError={() => setFailed(true)} />;
}

export function Plate({ value, large = false }: { value: string | null | undefined; large?: boolean }) {
  const text = plateText(value);
  return text ? <span className={`plate${large ? ' lg' : ''}`} title="Patente">{text}</span> : <span className="noplate">Sin patente</span>;
}

export function StatusPill({ status }: { status: VehicleStatus }) {
  const info = STATUS_INFO[status] ?? STATUS_INFO['Activo'];
  return <span className={`pill ${info.cls}`}>{info.label}</span>;
}

export function DocBadge({ doc }: { doc: DocStatus }) {
  return <span className={`badge ${STATE_CLASS[doc.state]}`}>{docLabel(doc)}</span>;
}

export function EmptyState({ icon, title, text, children }: { icon: string; title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="card empty">
      <Icon name={icon} />
      <b>{title}</b>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="card empty error-state" role="alert">
      <Icon name="cloud_off" />
      <b>No se pudieron cargar los datos.</b>
      <p>Revisá la conexión y probá de nuevo.</p>
      <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}><Icon name="refresh" />Reintentar</button>
    </div>
  );
}

export function Loading() {
  return <div className="loading" role="status">Cargando…</div>;
}

export function Kpi({ icon, label, value, sub, to }: { icon: string; label: string; value: ReactNode; sub: string; to: string }) {
  return (
    <Link className="kpi" to={to}>
      <span className="kpi-icon"><Icon name={icon} /></span>
      {/* Long amounts ('$ 10.000.000') get a smaller size so they fit a half-width card on the phone */}
      <span className={`kpi-value display num${typeof value === 'string' && value.length >= 12 ? ' long' : ''}`}>{value}</span>
      <span className="kpi-label">{label}</span>
      <span className="kpi-sub">{sub}</span>
    </Link>
  );
}

export function Chip({ pressed, count, onClick, children }: { pressed: boolean; count?: number; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="chip" aria-pressed={pressed} onClick={onClick}>
      {children}
      {count !== undefined && <small>{count}</small>}
    </button>
  );
}

export function Switch({ checked, onChange, label, disabled = false }: { checked: boolean; onChange: (next: boolean) => void; label: string; disabled?: boolean }) {
  return <button type="button" className="switch" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)} />;
}

export function Stepper({ value, min, max, onChange, label, disabled = false }: { value: number; min: number; max: number; onChange: (next: number) => void; label: string; disabled?: boolean }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" aria-label="Un día menos" disabled={disabled || value <= min} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <output className="num" aria-live="polite">{value}</output>
      <button type="button" aria-label="Un día más" disabled={disabled || value >= max} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, block = false, className = '' }: {
  value: T;
  options: { value: T; label: string; icon?: string }[];
  onChange: (next: T) => void;
  block?: boolean;
  className?: string;
}) {
  return (
    <div className={`seg${block ? ' seg-block' : ''}${className ? ` ${className}` : ''}`} role="group">
      {options.map(o => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PageHead({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="page-head">
      <div><p className="eyebrow">{eyebrow}</p><h1 className="display page-title">{title}</h1></div>
      {action}
    </div>
  );
}

export function SectionHead({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="sec-head"><h2>{title}</h2>{children}</div>;
}
