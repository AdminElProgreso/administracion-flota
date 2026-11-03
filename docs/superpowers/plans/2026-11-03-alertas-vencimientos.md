# Alertas de vencimientos: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que las pantallas y los avisos push usen una sola regla de vencimientos, con un aviso diario por documento y las preferencias de cada usuario guardadas en la base.

**Architecture:** La lógica pura vive en `supabase/functions/_shared/`, sin dependencias: fechas, estado de cada documento, selección y textos de avisos, y envío. La usan la Edge Function (Deno) y el frontend (Vite). Las pantallas leen las preferencias del usuario con un hook de react-query. La función queda como pegamento: consulta la base, arma los envíos con la lógica compartida y los manda.

**Tech Stack:** React 19, Vite 6, TypeScript 5.8, @tanstack/react-query 5, @supabase/supabase-js 2, Supabase Edge Functions (Deno, `npm:web-push@3.6.7`), Vitest 3.2.4 (nuevo, solo para desarrollo), Deno 2.9.6 vía npx (solo para chequear tipos).

**Spec:** `docs/superpowers/specs/2026-11-03-alertas-vencimientos-design.md`

## Global Constraints

- **Valores por defecto:** Seguro 15, VTV 30, Patente 10 y Turnos 3 días; los cuatro interruptores encendidos.
- **Zona horaria de la función:** `America/Argentina/Buenos_Aires`. La tarea diaria sigue a las 12:00 UTC; no se cambia.
- **Notificaciones:** etiqueta `{idVehiculo}-{tipo}` y URL `/#/fleet/{idVehiculo}`.
- **Unidades de baja:** un vehículo con `status === 'Baja'` nunca genera avisos ni aparece en "Atención Requerida".
- **Turnos:** el turno vigente (fecha ≥ hoy) siempre gana, aunque el documento esté vencido. Un turno pasado no cuenta.
- **Colores:** turno azul, vencido rojo, por vencer amarillo, al día verde, sin fecha gris.
- **Módulos compartidos:** `supabase/functions/_shared/*.ts` no usan APIs de Deno ni de Node, ni paquetes. Entre ellos se importan con ruta relativa y extensión `.ts`. El frontend y los tests los importan sin extensión, como el resto de la app.
- **SQL:** solo agrega columnas, nada destructivo. Lo corre el usuario en Supabase → SQL Editor.
- **Verify JWT:** al subir la función se mantiene el mismo ajuste que tiene hoy.
- **Orden de publicación:** SQL → frontend (push a `main`) → función.
- **Idioma:** los textos de la interfaz y de los avisos van en español.
- **Commits:** cada mensaje termina con la línea `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Archivos que no se commitean:** `supabase/schema.sql` (es de otra tarea) ni `.claude/launch.json`.
- **Datos de producción:** en las pruebas no se renuevan documentos ni se editan vehículos.

## Review Focus

1. Fecha vacía (`''`) guardada desde el modal de la ficha: el documento queda "Sin fecha" y nunca "Vencido". Test en Task 2.
2. Usuario sin fila en `user_settings`: las pantallas y los avisos usan los valores por defecto. Tests en Task 2 y Task 3.
3. Suscripción muerta (404/410) en medio del envío: se borra y el resto de los avisos sale igual. Test en Task 3.
4. Turno hoy (0 días), y turno ya pasado con el documento vencido: sale "Turno de … hoy." y, en el segundo caso, vuelve el aviso de vencido. Tests en Task 2 y Task 3.
5. Vehículo sin patente o con la patente en minúsculas: el aviso dice "(sin patente)" o pone la patente en mayúsculas. Test en Task 3.

---

## Antes de empezar

- [ ] Crear la rama `alertas-vencimientos` desde `main` (superpowers:using-git-worktrees).
- [ ] Commitear el diseño y este plan:

```bash
git add docs/superpowers/specs/2026-11-03-alertas-vencimientos-design.md docs/superpowers/plans/2026-11-03-alertas-vencimientos.md
git commit -m "Agrega diseño y plan de alertas de vencimientos" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 1: Fechas compartidas y Vitest

**Files:**
- Create: `supabase/functions/_shared/dates.ts`
- Create: `vitest.config.ts`
- Modify: `package.json` (devDependency `vitest` y script `test`)
- Test: `tests/dates.test.ts`

**Interfaces:**
- Produces:
  - `AR_TIME_ZONE = 'America/Argentina/Buenos_Aires'`
  - `todayISO(now: Date = new Date(), timeZone?: string): string`: `YYYY-MM-DD` de `now` en `timeZone`; sin zona, en la zona local del entorno.
  - `daysBetween(fromISO: string, toISO: string): number`: días de calendario de `fromISO` a `toISO`; negativo si `toISO` es anterior.
  - `formatDateShort(iso: string): string` devuelve `'20/11'`; `formatDateLong(iso: string): string` devuelve `'20/11/2026'`.

- [ ] **Step 1: Instalar y configurar Vitest**

Correr `npm install -D vitest@3.2.4` y agregar `"test": "vitest run"` a `scripts`. Crear `vitest.config.ts` con `defineConfig` de `vitest/config` y `test: { include: ['tests/**/*.test.ts'], environment: 'node' }`. Es un archivo aparte para que Vitest no cargue el plugin PWA de `vite.config.ts`.

- [ ] **Step 2: Escribir el test que falla**

```ts
import { describe, it, expect } from 'vitest';
import { AR_TIME_ZONE, todayISO, daysBetween, formatDateShort, formatDateLong } from '../supabase/functions/_shared/dates';

describe('daysBetween', () => {
  it('cuenta días de calendario', () => {
    expect(daysBetween('2026-11-03', '2026-11-03')).toBe(0);
    expect(daysBetween('2026-11-03', '2026-11-13')).toBe(10);
    expect(daysBetween('2026-11-03', '2026-11-02')).toBe(-1);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
  });
});

describe('todayISO', () => {
  it('usa la fecha de Argentina aunque en UTC ya sea el día siguiente', () => {
    expect(todayISO(new Date('2026-11-04T00:30:00Z'), AR_TIME_ZONE)).toBe('2026-11-03'); // 21:30 en AR
    expect(todayISO(new Date('2026-11-04T02:59:00Z'), AR_TIME_ZONE)).toBe('2026-11-03'); // 23:59 en AR
    expect(todayISO(new Date('2026-11-04T03:00:00Z'), AR_TIME_ZONE)).toBe('2026-11-04'); // 00:00 en AR
  });
  it('sin zona usa la fecha local', () => {
    expect(todayISO(new Date(2026, 10, 3, 23, 59))).toBe('2026-11-03');
  });
});

describe('formatos', () => {
  it('dd/mm y dd/mm/aaaa', () => {
    expect(formatDateShort('2026-11-20')).toBe('20/11');
    expect(formatDateLong('2026-11-20')).toBe('20/11/2026');
  });
});
```

- [ ] **Step 3: Correrlo y ver que falla**

Run: `npm test`
Expected: FAIL; no encuentra `supabase/functions/_shared/dates`.

- [ ] **Step 4: Implementar `supabase/functions/_shared/dates.ts`**

- `todayISO` con zona: `new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)`. Sin zona: `getFullYear()`, `getMonth()` y `getDate()` locales.
- `daysBetween`: separa año, mes y día, usa `Date.UTC` y divide por `86_400_000`.

- [ ] **Step 5: Verificar**

Run: `npm test` y `npx tsc --noEmit`
Expected: los tests pasan (PASS) y `tsc` no muestra errores.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts supabase/functions/_shared/dates.ts tests/dates.test.ts
git commit -m "Agrega fechas compartidas y Vitest" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Estado de documentos y preferencias

**Files:**
- Create: `supabase/functions/_shared/alerts.ts`
- Create: `tests/fixtures.ts`
- Test: `tests/alerts.test.ts`

**Interfaces:**
- Consumes: `daysBetween` de Task 1 (import `./dates.ts`).
- Produces (todo exportado desde `alerts.ts`):
  - `type DocType = 'Seguro' | 'VTV' | 'Patente'`; `DOC_TYPES: DocType[] = ['Seguro', 'VTV', 'Patente']`
  - `type DocState = 'appointment' | 'expired' | 'expiring' | 'ok' | 'no-date'`: en la interfaz son Turno, Vencido, Por vencer, Al día y Sin fecha.
  - `interface AlertPrefs { thresholds: Record<DocType, number> & { appointments: number }; enabled: Record<DocType, boolean> & { appointments: boolean } }`
  - `DEFAULT_PREFS: AlertPrefs`, con los valores de Global Constraints.
  - `interface UserSettingsRow { user_id: string; insurance_threshold: number | null; vtv_threshold: number | null; patente_threshold: number | null; appointments_threshold: number | null; insurance_alerts: boolean | null; vtv_alerts: boolean | null; patente_alerts: boolean | null; appointment_alerts: boolean | null }`
  - `prefsFromRow(row: Partial<UserSettingsRow> | null | undefined): AlertPrefs`: cada campo nulo o ausente toma el valor por defecto.
  - `rowFromPrefs(userId: string, prefs: AlertPrefs): UserSettingsRow`
  - `interface VehicleDates { id: string; model: string; patente: string | null; status: string; insurance_expiration: string | null; insurance_appointment: string | null; vtv_expiration: string | null; vtv_appointment: string | null; patente_expiration: string | null; patente_appointment: string | null }`. `VehicleRow` de `types.ts` es compatible.
  - `DOC_COLUMNS: Record<DocType, { expiration: keyof VehicleDates; appointment: keyof VehicleDates }>`: Seguro usa `insurance_*`, VTV usa `vtv_*` y Patente usa `patente_*`.
  - `interface DocStatus { type: DocType; state: DocState; expiration: string | null; appointment: string | null; daysToExpiration: number | null; daysToAppointment: number | null; pastAppointment: boolean }`. `expiration` y `appointment` convierten `''` en `null`. `pastAppointment` es true si hay turno con fecha anterior a hoy y el estado es `expiring` o `expired`.
  - `docStatus(type: DocType, expiration: string | null, appointment: string | null, threshold: number, today: string): DocStatus`. Reglas en el orden en que se evalúan:
    1. turno con `daysToAppointment >= 0`: `appointment`;
    2. sin vencimiento: `no-date`;
    3. `daysToExpiration < 0`: `expired`;
    4. `daysToExpiration <= threshold`: `expiring`;
    5. si no: `ok`.
  - `vehicleDocs(vehicle: VehicleDates, prefs: AlertPrefs, today: string): DocStatus[]`: devuelve Seguro, VTV y Patente, en ese orden, cada uno con el umbral de su tipo.
  - `interface AttentionItem { vehicle: VehicleDates; doc: DocStatus }`
  - `attentionList(vehicles: VehicleDates[], prefs: AlertPrefs, today: string): AttentionItem[]`:
    - excluye los vehículos de `Baja` y se queda con los estados `expired`, `expiring` y `appointment`;
    - ordena por estado: primero `expired` por `daysToExpiration` ascendente, después `expiring` por `daysToExpiration` ascendente, al final `appointment` por `daysToAppointment` ascendente.
  - `appointmentAfterRenewal(prevExpiration: string, newExpiration: string, prevAppointment: string, newAppointment: string): string | null`: si cambió el vencimiento y el turno no, devuelve `null`. En cualquier otro caso devuelve `newAppointment`, o `null` si está vacío.
- Produces (tests): `tests/fixtures.ts` exporta `T = '2026-11-03'` y `vehicle(id: string, over?: Partial<VehicleDates>): VehicleDates`. Por defecto: modelo `'TOYOTA HILUX'`, patente `'AA789XX'`, estado `'Activo'` y todas las fechas en `null`.

- [ ] **Step 1: Crear `tests/fixtures.ts`** con `T` y `vehicle()`, como se describe arriba.

- [ ] **Step 2: Escribir el test que falla**

```ts
import { describe, it, expect } from 'vitest';
import { DEFAULT_PREFS, prefsFromRow, rowFromPrefs, docStatus, vehicleDocs, attentionList, appointmentAfterRenewal } from '../supabase/functions/_shared/alerts';
import { T, vehicle } from './fixtures';

describe('docStatus', () => {
  it('por vencer, vencido y al día según el umbral', () => {
    expect(docStatus('VTV', '2026-11-03', null, 30, T)).toMatchObject({ state: 'expiring', daysToExpiration: 0 });
    expect(docStatus('VTV', '2026-12-03', null, 30, T)).toMatchObject({ state: 'expiring', daysToExpiration: 30 });
    expect(docStatus('VTV', '2026-12-04', null, 30, T)).toMatchObject({ state: 'ok', daysToExpiration: 31 });
    expect(docStatus('VTV', '2026-11-02', null, 30, T)).toMatchObject({ state: 'expired', daysToExpiration: -1 });
  });
  it('sin fechas, o con texto vacío, queda sin fecha', () => {
    expect(docStatus('VTV', null, null, 30, T)).toMatchObject({ state: 'no-date', daysToExpiration: null, daysToAppointment: null });
    expect(docStatus('VTV', '', '', 30, T)).toMatchObject({ state: 'no-date', expiration: null, appointment: null });
  });
  it('el turno vigente gana aunque el documento esté vencido', () => {
    expect(docStatus('VTV', '2026-10-29', '2026-11-23', 30, T)).toMatchObject({ state: 'appointment', daysToAppointment: 20, pastAppointment: false });
    expect(docStatus('VTV', '2026-11-10', '2026-11-03', 30, T)).toMatchObject({ state: 'appointment', daysToAppointment: 0 });
    expect(docStatus('VTV', null, '2026-11-20', 30, T)).toMatchObject({ state: 'appointment' });
  });
  it('un turno pasado no cuenta; la nota aparece solo si está por vencer o vencido', () => {
    expect(docStatus('VTV', '2026-10-29', '2026-11-01', 30, T)).toMatchObject({ state: 'expired', pastAppointment: true });
    expect(docStatus('VTV', '2027-05-01', '2026-11-01', 30, T)).toMatchObject({ state: 'ok', pastAppointment: false });
  });
});

describe('preferencias', () => {
  it('sin fila usa los valores por defecto', () => {
    expect(prefsFromRow(null)).toEqual(DEFAULT_PREFS);
    expect(DEFAULT_PREFS).toEqual({
      thresholds: { Seguro: 15, VTV: 30, Patente: 10, appointments: 3 },
      enabled: { Seguro: true, VTV: true, Patente: true, appointments: true },
    });
  });
  it('completa los campos nulos con los valores por defecto', () => {
    const p = prefsFromRow({ vtv_threshold: 45, insurance_threshold: null, patente_alerts: false });
    expect(p.thresholds).toEqual({ Seguro: 15, VTV: 45, Patente: 10, appointments: 3 });
    expect(p.enabled).toEqual({ Seguro: true, VTV: true, Patente: false, appointments: true });
  });
  it('arma la fila de user_settings', () => {
    expect(rowFromPrefs('u1', DEFAULT_PREFS)).toEqual({
      user_id: 'u1', insurance_threshold: 15, vtv_threshold: 30, patente_threshold: 10, appointments_threshold: 3,
      insurance_alerts: true, vtv_alerts: true, patente_alerts: true, appointment_alerts: true,
    });
  });
});

describe('vehicleDocs', () => {
  it('usa el umbral de cada tipo', () => {
    const docs = vehicleDocs(vehicle('v1', { insurance_expiration: '2026-11-23', vtv_expiration: '2026-11-23' }), DEFAULT_PREFS, T);
    expect(docs.map(d => [d.type, d.state])).toEqual([['Seguro', 'ok'], ['VTV', 'expiring'], ['Patente', 'no-date']]);
  });
});

describe('attentionList', () => {
  it('vencidos, después por vencer, después turnos; sin unidades de baja', () => {
    const list = attentionList([
      vehicle('C', { patente_expiration: '2026-11-06' }),
      vehicle('E', { insurance_appointment: '2026-11-13' }),
      vehicle('B', { insurance_expiration: '2026-11-02' }),
      vehicle('G', { status: 'Baja', vtv_expiration: '2026-10-24' }),
      vehicle('F', { vtv_appointment: '2026-11-05' }),
      vehicle('D', { vtv_expiration: '2026-11-03' }),
      vehicle('A', { vtv_expiration: '2026-10-29' }),
    ], DEFAULT_PREFS, T);
    expect(list.map(i => `${i.vehicle.id}-${i.doc.type}`)).toEqual(['A-VTV', 'B-Seguro', 'D-VTV', 'C-Patente', 'F-VTV', 'E-Seguro']);
  });
});

describe('appointmentAfterRenewal', () => {
  it('borra el turno al cambiar el vencimiento si no se cargó uno nuevo', () => {
    expect(appointmentAfterRenewal('2026-11-10', '2027-11-10', '2026-11-05', '2026-11-05')).toBeNull();
    expect(appointmentAfterRenewal('2026-11-10', '2027-11-10', '2026-11-05', '2026-11-20')).toBe('2026-11-20');
    expect(appointmentAfterRenewal('2026-11-10', '2026-11-10', '', '2026-11-20')).toBe('2026-11-20');
    expect(appointmentAfterRenewal('2026-11-10', '2026-11-10', '2026-11-05', '2026-11-05')).toBe('2026-11-05');
    expect(appointmentAfterRenewal('2026-11-10', '2026-11-10', '2026-11-05', '')).toBeNull();
  });
});
```

- [ ] **Step 3: Correrlo y ver que falla**

Run: `npm test`
Expected: FAIL; no encuentra `supabase/functions/_shared/alerts`.

- [ ] **Step 4: Implementar `supabase/functions/_shared/alerts.ts`** con las firmas y reglas de Interfaces. `attentionList` usa un `sort` estable con rango por estado.

- [ ] **Step 5: Verificar**

Run: `npm test` y `npx tsc --noEmit`
Expected: PASS y `tsc` sin errores.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/alerts.ts tests/fixtures.ts tests/alerts.test.ts
git commit -m "Agrega regla única de estado de documentos y preferencias" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Avisos: selección, textos y envío

**Files:**
- Create: `supabase/functions/_shared/notifications.ts`
- Test: `tests/notifications.test.ts`

**Interfaces:**
- Consumes: `DocType`, `DOC_TYPES`, `AlertPrefs`, `UserSettingsRow`, `VehicleDates`, `DOC_COLUMNS`, `docStatus` y `prefsFromRow` de Task 2 (import `./alerts.ts`).
- Produces:
  - `type NotificationKind = 'expiring' | 'expired' | 'appointment'`
  - `interface FleetNotification { vehicleId: string; docType: DocType; kind: NotificationKind; days: number; title: string; body: string; url: string; tag: string }`. `days` son los días que faltan para `expiring` y `appointment`, y los días que pasaron (en positivo) para `expired`.
  - `buildNotification(vehicle: VehicleDates, docType: DocType, kind: NotificationKind, days: number): FleetNotification`
  - `selectNotifications(vehicles: VehicleDates[], prefs: AlertPrefs, today: string): FleetNotification[]`. Recorre los vehículos en el orden recibido y, en cada uno, los documentos en orden `DOC_TYPES`. Saltea los de `Baja`. Por documento:
    - `appointment` con `prefs.enabled.appointments` y `daysToAppointment <= prefs.thresholds.appointments`: aviso `appointment`;
    - `expiring` con `prefs.enabled[tipo]`: aviso `expiring`;
    - `expired` con `prefs.enabled[tipo]`: aviso `expired`;
    - cualquier otro caso: nada.
  - `interface PushSubscriptionRow { id: string; user_id: string; subscription: unknown }`
  - `interface Delivery { subscriptionId: string; subscription: unknown; payload: string }`. `payload` es `JSON.stringify({ title, body, url, tag })`.
  - `planDeliveries(vehicles: VehicleDates[], subscriptions: PushSubscriptionRow[], settingsRows: Partial<UserSettingsRow>[], today: string): Delivery[]`:
    - si un usuario tiene varias filas, gana la última;
    - calcula los avisos una vez por usuario;
    - el orden es por suscripción y, dentro de cada una, por aviso.
  - `sendAll(deliveries: Delivery[], send: (subscription: unknown, payload: string) => Promise<unknown>): Promise<{ sent: number; failed: number; expiredSubscriptionIds: string[] }>`:
    - manda todo en paralelo con `Promise.allSettled`;
    - un rechazo con `statusCode` 404 o 410 marca la suscripción como muerta;
    - los ids de `expiredSubscriptionIds` no se repiten y quedan en el orden en que aparecieron.

Textos, fijados por el spec:

| Dato | Valor |
|---|---|
| Artículo | Seguro → `El seguro`, VTV → `La VTV`, Patente → `La patente` |
| Nombre en títulos y turnos | `seguro`, `VTV`, `patente` |
| Vehículo | `${model} (${patente en mayúsculas o 'sin patente'})` |
| Título `expiring` | `Vencimiento de ${nombre}` |
| Título `expired` | `Seguro vencido`, `VTV vencida`, `Patente vencida` |
| Título `appointment` | `Turno de ${nombre}` |
| Texto `expiring` | `${Artículo} del ${vehículo} vence en N días.` / `vence mañana.` (1) / `vence hoy.` (0) |
| Texto `expired` | `${Artículo} del ${vehículo} venció ayer.` (1) / `venció hace N días.` |
| Texto `appointment` | `Turno de ${nombre} del ${vehículo} en N días.` / `mañana.` (1) / `hoy.` (0) |
| `url` / `tag` | `/#/fleet/${id}` / `${id}-${tipo}` |

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, it, expect } from 'vitest';
import { DEFAULT_PREFS, type AlertPrefs, type VehicleDates } from '../supabase/functions/_shared/alerts';
import { buildNotification, selectNotifications, planDeliveries, sendAll } from '../supabase/functions/_shared/notifications';
import { T, vehicle } from './fixtures';

describe('buildNotification', () => {
  const v = vehicle('v1');
  it('por vencer', () => {
    expect(buildNotification(v, 'VTV', 'expiring', 10)).toEqual({
      vehicleId: 'v1', docType: 'VTV', kind: 'expiring', days: 10,
      title: 'Vencimiento de VTV', body: 'La VTV del TOYOTA HILUX (AA789XX) vence en 10 días.',
      url: '/#/fleet/v1', tag: 'v1-VTV',
    });
    expect(buildNotification(v, 'VTV', 'expiring', 1).body).toBe('La VTV del TOYOTA HILUX (AA789XX) vence mañana.');
    expect(buildNotification(v, 'VTV', 'expiring', 0).body).toBe('La VTV del TOYOTA HILUX (AA789XX) vence hoy.');
    expect(buildNotification(v, 'Patente', 'expiring', 3)).toMatchObject({ title: 'Vencimiento de patente', body: 'La patente del TOYOTA HILUX (AA789XX) vence en 3 días.' });
  });
  it('vencido', () => {
    expect(buildNotification(v, 'VTV', 'expired', 1)).toMatchObject({ title: 'VTV vencida', body: 'La VTV del TOYOTA HILUX (AA789XX) venció ayer.' });
    expect(buildNotification(v, 'VTV', 'expired', 5).body).toBe('La VTV del TOYOTA HILUX (AA789XX) venció hace 5 días.');
    expect(buildNotification(v, 'Seguro', 'expired', 2)).toMatchObject({ title: 'Seguro vencido', body: 'El seguro del TOYOTA HILUX (AA789XX) venció hace 2 días.' });
    expect(buildNotification(v, 'Patente', 'expired', 2).title).toBe('Patente vencida');
  });
  it('turno', () => {
    expect(buildNotification(v, 'VTV', 'appointment', 2)).toMatchObject({ title: 'Turno de VTV', body: 'Turno de VTV del TOYOTA HILUX (AA789XX) en 2 días.' });
    expect(buildNotification(v, 'VTV', 'appointment', 1).body).toBe('Turno de VTV del TOYOTA HILUX (AA789XX) mañana.');
    expect(buildNotification(v, 'VTV', 'appointment', 0).body).toBe('Turno de VTV del TOYOTA HILUX (AA789XX) hoy.');
    expect(buildNotification(v, 'Seguro', 'appointment', 2)).toMatchObject({ title: 'Turno de seguro', body: 'Turno de seguro del TOYOTA HILUX (AA789XX) en 2 días.' });
  });
  it('patente faltante o en minúsculas', () => {
    expect(buildNotification(vehicle('v2', { model: 'FORD F100', patente: null }), 'VTV', 'expiring', 3).body).toBe('La VTV del FORD F100 (sin patente) vence en 3 días.');
    expect(buildNotification(vehicle('v3', { patente: 'ab123cd' }), 'VTV', 'expiring', 3).body).toBe('La VTV del TOYOTA HILUX (AB123CD) vence en 3 días.');
  });
});

describe('selectNotifications', () => {
  const keys = (vs: VehicleDates[], prefs: AlertPrefs = DEFAULT_PREFS) =>
    selectNotifications(vs, prefs, T).map(n => `${n.vehicleId}-${n.docType}-${n.kind}-${n.days}`);
  it('por vencer dentro del umbral, y vencidos todos los días', () => {
    expect(keys([vehicle('a', { vtv_expiration: '2026-11-13' })])).toEqual(['a-VTV-expiring-10']);
    expect(keys([vehicle('a', { vtv_expiration: '2026-12-04' })])).toEqual([]);
    expect(keys([vehicle('a', { vtv_expiration: '2026-09-24' })])).toEqual(['a-VTV-expired-40']);
  });
  it('nada por unidades de baja ni documentos sin fecha', () => {
    expect(keys([vehicle('a', { status: 'Baja', vtv_expiration: '2026-10-01' }), vehicle('b')])).toEqual([]);
  });
  it('con turno vigente solo avisa el turno, dentro de su umbral', () => {
    expect(keys([vehicle('a', { vtv_expiration: '2026-10-29', vtv_appointment: '2026-11-13' })])).toEqual([]);
    expect(keys([vehicle('a', { vtv_expiration: '2026-10-29', vtv_appointment: '2026-11-06' })])).toEqual(['a-VTV-appointment-3']);
    expect(keys([vehicle('a', { vtv_expiration: '2026-10-29', vtv_appointment: '2026-11-03' })])).toEqual(['a-VTV-appointment-0']);
  });
  it('si el turno ya pasó, vuelve el aviso de vencido', () => {
    expect(keys([vehicle('a', { vtv_expiration: '2026-10-29', vtv_appointment: '2026-11-01' })])).toEqual(['a-VTV-expired-5']);
  });
  it('respeta los interruptores', () => {
    const sinVtv: AlertPrefs = { ...DEFAULT_PREFS, enabled: { ...DEFAULT_PREFS.enabled, VTV: false } };
    expect(keys([vehicle('a', { vtv_expiration: '2026-11-13' })], sinVtv)).toEqual([]);
    expect(keys([vehicle('a', { vtv_appointment: '2026-11-05' })], sinVtv)).toEqual(['a-VTV-appointment-2']);
    const sinTurnos: AlertPrefs = { ...DEFAULT_PREFS, enabled: { ...DEFAULT_PREFS.enabled, appointments: false } };
    expect(keys([vehicle('a', { vtv_expiration: '2026-10-29', vtv_appointment: '2026-11-05' })], sinTurnos)).toEqual([]);
  });
});

describe('planDeliveries', () => {
  it('usa las preferencias de cada usuario, o las de defecto si no tiene fila', () => {
    const subs = [
      { id: 's1', user_id: 'u1', subscription: { endpoint: 'e1' } },
      { id: 's2', user_id: 'u1', subscription: { endpoint: 'e2' } },
      { id: 's3', user_id: 'u2', subscription: { endpoint: 'e3' } },
    ];
    const deliveries = planDeliveries([vehicle('v1', { vtv_expiration: '2026-11-13' })], subs, [{ user_id: 'u2', vtv_alerts: false }], T);
    expect(deliveries.map(d => d.subscriptionId)).toEqual(['s1', 's2']);
    expect(deliveries[0].subscription).toEqual({ endpoint: 'e1' });
    expect(JSON.parse(deliveries[0].payload)).toEqual({
      title: 'Vencimiento de VTV', body: 'La VTV del TOYOTA HILUX (AA789XX) vence en 10 días.', url: '/#/fleet/v1', tag: 'v1-VTV',
    });
  });
  it('si un usuario tiene varias filas, gana la última', () => {
    const rows = [{ user_id: 'u1', vtv_alerts: false }, { user_id: 'u1', vtv_alerts: true }];
    const subs = [{ id: 's1', user_id: 'u1', subscription: {} }];
    expect(planDeliveries([vehicle('v1', { vtv_expiration: '2026-11-13' })], subs, rows, T)).toHaveLength(1);
  });
});

describe('sendAll', () => {
  it('manda todo, cuenta las fallas y marca las suscripciones muertas', async () => {
    const deliveries = [
      { subscriptionId: 's1', subscription: 'S1', payload: 'p1' },
      { subscriptionId: 's2', subscription: 'S2', payload: 'p2' },
      { subscriptionId: 's2', subscription: 'S2', payload: 'p3' },
      { subscriptionId: 's3', subscription: 'S3', payload: 'p4' },
    ];
    const send = async (sub: unknown) => {
      if (sub === 'S2') throw Object.assign(new Error('gone'), { statusCode: 410 });
      if (sub === 'S3') throw Object.assign(new Error('boom'), { statusCode: 500 });
    };
    expect(await sendAll(deliveries, send)).toEqual({ sent: 1, failed: 3, expiredSubscriptionIds: ['s2'] });
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `npm test`
Expected: FAIL; no encuentra `supabase/functions/_shared/notifications`.

- [ ] **Step 3: Implementar `supabase/functions/_shared/notifications.ts`** con las firmas, las reglas y la tabla de textos de arriba.

- [ ] **Step 4: Verificar**

Run: `npm test` y `npx tsc --noEmit`
Expected: PASS y `tsc` sin errores.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/notifications.ts tests/notifications.test.ts
git commit -m "Agrega selección, textos y envío de avisos" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Función check-alerts y service worker

**Files:**
- Modify: `supabase/functions/check-alerts/index.ts` (se reescribe entero)
- Modify: `public/sw-push.js:4-36`

**Interfaces:**
- Consumes: `AR_TIME_ZONE` y `todayISO` (Task 1); `planDeliveries` y `sendAll` (Task 3). Se importan con `../_shared/dates.ts` y `../_shared/notifications.ts`.
- Produces: la respuesta HTTP `{ today, deliveries, sent, failed, removedSubscriptions }`. Los avisos que se mandan tienen la forma `{ title, body, url, tag }`, que es la que lee el service worker.

- [ ] **Step 1: Reescribir `index.ts`**

Se mantienen las importaciones de `createClient` (`npm:@supabase/supabase-js@2.39.3`) y `webpush` (`npm:web-push@3.6.7`), el chequeo de las claves VAPID, `setVapidDetails` y el uso de la service key. Lo que hace la función:

1. Consulta tres tablas, y si cualquiera falla tira el error, para que la función responda 500 como hoy:
   - `vehiculos`, con `.select('*').neq('status', 'Baja')`;
   - `push_subscriptions`, con `.select('id, user_id, subscription')`;
   - `user_settings`, con `.select('*').order('updated_at', { ascending: true })`, para que la fila más nueva sea la última.
2. Calcula `today = todayISO(new Date(), AR_TIME_ZONE)` y arma los envíos con `planDeliveries(...)`.
3. Los manda con `sendAll(deliveries, (sub, payload) => webpush.sendNotification(sub as any, payload))`.
4. Si hay `expiredSubscriptionIds`, los borra con `.from('push_subscriptions').delete().in('id', ids)`.
5. Responde el JSON de Interfaces.

- [ ] **Step 2: Usar la etiqueta que manda la función en `public/sw-push.js`**

Agregar `tag: 'fleet-alert'` al objeto `data` por defecto y `data.tag = json.tag || data.tag` en el `try`, y usar `tag: data.tag` en `options`. `renotify: true` se mantiene.

- [ ] **Step 3: Chequear tipos de la función con Deno**

Run (desde `supabase/functions/check-alerts`): `npx --yes deno@2.9.6 check --no-lock --node-modules-dir=none index.ts`
Expected: imprime `Check index.ts` y termina con código 0. `--no-lock` evita que quede un `deno.lock` suelto.

- [ ] **Step 4: Verificar el resto**

Run: `npm test` y `npm run build`
Expected: PASS, y el build termina sin errores.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/check-alerts/index.ts public/sw-push.js
git commit -m "Usa la lógica compartida en check-alerts y una notificación por documento" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Preferencias en la base y pantalla de Ajustes

**Files:**
- Create: `supabase/sql/2026-11-03-user-settings-avisos.sql`
- Create: `lib/useAlertPrefs.ts`
- Modify: `pages/Settings.tsx`; las zonas a tocar están indicadas en los pasos.

**Interfaces:**
- Consumes: `AlertPrefs`, `DEFAULT_PREFS`, `prefsFromRow` y `rowFromPrefs` (Task 2).
- Produces (`lib/useAlertPrefs.ts`):
  - `ALERT_PREFS_KEY = ['alertPrefs'] as const`
  - `useAlertPrefs(): { prefs: AlertPrefs; userId: string | null; isLoading: boolean; error: Error | null }`:
    - `useQuery` con `staleTime` de 5 minutos;
    - sin sesión, devuelve `DEFAULT_PREFS` y `userId: null`;
    - con sesión, lee `user_settings` del usuario con `.order('updated_at', { ascending: false }).limit(1).maybeSingle()` y pasa el resultado por `prefsFromRow`;
    - si la consulta falla, tira el error.
  - `saveAlertPrefs(userId: string, prefs: AlertPrefs): Promise<void>`: hace `upsert({ ...rowFromPrefs(userId, prefs), updated_at: new Date().toISOString() })` y tira el error si falla.

- [ ] **Step 1: Crear el SQL y pedirle al usuario que lo corra**

El archivo tiene, primero, una consulta de control comentada:

```sql
-- select column_name, data_type, is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'user_settings'
-- order by ordinal_position;
```

y después el `ALTER TABLE` del spec, tal cual (las cuatro columnas `*_alerts BOOLEAN NOT NULL DEFAULT true`).

El usuario corre primero la consulta de control en SQL Editor y pega el resultado. Si la tabla no existe, o si le falta `user_id`, `updated_at` o alguna columna `*_threshold`, se frena y se consulta al usuario. Si está todo, el usuario corre el `ALTER TABLE` y lo confirma.

- [ ] **Step 2: Crear `lib/useAlertPrefs.ts`** con la interfaz de arriba.

- [ ] **Step 3: Cambiar el estado y la carga en `pages/Settings.tsx`**
  - **Estado (líneas 177-194):** `notificationState` queda en `{ masterToggle: false }` y se borra `thresholds`.
  - **Nuevo estado:**
    - `const queryClient = useQueryClient()`;
    - `const { prefs: savedPrefs, userId, isLoading: prefsLoading } = useAlertPrefs()`;
    - `const [prefs, setPrefs] = useState<AlertPrefs>(DEFAULT_PREFS)`;
    - `const [prefsLoaded, setPrefsLoaded] = useState(false)`;
    - `const lastSaved = useRef('')`;
    - `const [syncError, setSyncError] = useState<string | null>(null)`.
  - **Efecto de carga:** cuando `!prefsLoading && !prefsLoaded`, hace `setPrefs(savedPrefs)`, guarda `lastSaved.current = JSON.stringify(savedPrefs)` y marca `setPrefsLoaded(true)`.
  - **Efecto de carga inicial (líneas 202-256):** se quitan la lectura de `fleet_thresholds` y `fleet_notifications` y la consulta a `user_settings`. Quedan la detección de la suscripción (`masterToggle`) y lo de la instalación PWA.

- [ ] **Step 4: Cambiar el guardado en `pages/Settings.tsx`**
  - **`persistPrefs(): Promise<boolean>`:**
    - si no hay `userId`, muestra el error de abajo y devuelve `false`;
    - si hay, llama a `saveAlertPrefs`. Si sale bien, actualiza `lastSaved`, limpia `syncError`, invalida `ALERT_PREFS_KEY` y devuelve `true`. Si falla, pone `syncError = 'No se pudo guardar. Revisá la conexión.'` y devuelve `false`.
    - En los dos casos maneja `isSyncing`.
  - **Guardado automático (líneas 258-284):** se reemplaza por un efecto sobre `[prefs, prefsLoaded, userId]`. No hace nada si `!prefsLoaded`, si no hay `userId` o si `JSON.stringify(prefs) === lastSaved.current`. Si no, llama a `persistPrefs()` a los 1000 ms.
  - **`handleSaveGeneral` (líneas 325-337):**
    - se saca `localStorage` y la espera simulada;
    - pone `saveStatus` en `'saving'`, espera `persistPrefs()` y lo pasa a `'success'` o `'error'`; a los 2000 ms vuelve a `'idle'`;
    - `saveStatus` suma el valor `'error'`. En ese estado, el botón (líneas 397-411) muestra el ícono `error`, el texto `Error al guardar` y las clases `bg-rose-600 text-white`.

- [ ] **Step 5: Cambiar los controles en `pages/Settings.tsx`**
  - **Barras de umbrales (líneas 558-593):** leen `prefs.thresholds.Seguro`, `.VTV`, `.Patente` y `.appointments`, y escriben con `setPrefs({ ...prefs, thresholds: { ...prefs.thresholds, X: parseInt(value) } })`. Mínimos y máximos sin cambios.
  - **Interruptores (líneas 626-629):** leen `prefs.enabled.Seguro`, `.VTV`, `.Patente` y `.appointments`. Se borran el divisor y el interruptor "Resumen Semanal" (líneas 630-631).
  - **Error:** `syncError` se muestra (`text-rose-500 text-xs`) junto a "Sincronizando..." en la pestaña de umbrales, y arriba de "Tipos de Alerta".

- [ ] **Step 6: Verificar**

Run: `npx tsc --noEmit`, `npm test` y `npm run build`
Expected: sin errores; PASS; el build termina.

- [ ] **Step 7: Commit**

```bash
git add supabase/sql/2026-11-03-user-settings-avisos.sql lib/useAlertPrefs.ts pages/Settings.tsx
git commit -m "Guarda umbrales e interruptores de avisos en user_settings" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Estilos y etiquetas, y el panel

**Files:**
- Create: `lib/docStyles.ts`
- Modify: `pages/Dashboard.tsx:1-5, 106-213, 251, 330-354`
- Modify: `types.ts:63-71` (se borra la interfaz `Alert`)
- Test: `tests/docStyles.test.ts`

**Interfaces:**
- Consumes: `DocState`, `DocType`, `DocStatus`, `docStatus` y `attentionList` (Task 2); `formatDateShort`, `formatDateLong` y `todayISO` (Task 1); `useAlertPrefs` (Task 5).
- Produces (`lib/docStyles.ts`):
  - `DOC_CHIP_CLASSES: Record<DocState, string>`:
    - appointment: `bg-blue-500/10 text-blue-400 border-blue-500/20`;
    - expired: `bg-rose-500/10 text-rose-500 border-rose-500/20`;
    - expiring: `bg-amber-500/10 text-amber-500 border-amber-500/20`;
    - ok: `bg-emerald-500/10 text-emerald-500/40 border-emerald-500/10`;
    - no-date: `bg-stone-800/30 text-stone-700 border-stone-800/50`.
  - `DOC_CARD_CLASSES: Record<DocState, { text: string; border: string; bg: string }>`:
    - appointment: `text-blue-400` / `border-blue-400/50` / `bg-blue-400/10`;
    - expired: `text-rose-500` / `border-rose-500/50` / `bg-rose-500/10`;
    - expiring: `text-amber-500` / `border-amber-500/50` / `bg-amber-500/10`;
    - ok: `text-emerald-500` / `border-emerald-500/20` / `bg-emerald-500/10`;
    - no-date: `text-stone-500` / `border-brand-border` / `bg-stone-800/30`.
  - `DOC_ICONS: Record<DocType, string>`: Seguro `security`, VTV `verified`, Patente `badge`.
  - `DOC_HEADLINES: Record<DocState, string>`: `Turno programado`, `Vencido`, `Por vencer`, `Al día`, `Sin fecha`.
  - `docLabel(doc: DocStatus, dateFormat: 'short' | 'long' = 'long'): string`.
  - `type CalendarTone = 'red' | 'amber' | 'neutral'` y `CALENDAR_TONE_CLASSES: Record<CalendarTone, string>`:
    - red: `bg-red-500/20 text-red-400 border-red-500/20`;
    - amber: `bg-amber-500/20 text-amber-400 border-amber-500/20`;
    - neutral: `bg-brand-dark/50 text-stone-400 border-brand-border`.
  - `calendarExpirationLabel(daysToExpiration: number, threshold: number): { text: string; tone: CalendarTone }`
  - `calendarAppointmentLabel(daysToAppointment: number): string`

- [ ] **Step 1: Escribir el test que falla**

```ts
import { describe, it, expect } from 'vitest';
import { docStatus } from '../supabase/functions/_shared/alerts';
import { docLabel, calendarExpirationLabel, calendarAppointmentLabel } from '../lib/docStyles';
import { T } from './fixtures';

describe('docLabel', () => {
  it('etiqueta por estado', () => {
    expect(docLabel(docStatus('VTV', '2026-12-04', null, 30, T))).toBe('Al día');
    expect(docLabel(docStatus('VTV', '2026-11-11', null, 30, T))).toBe('Faltan 8 días');
    expect(docLabel(docStatus('VTV', '2026-11-04', null, 30, T))).toBe('Falta 1 día');
    expect(docLabel(docStatus('VTV', '2026-11-03', null, 30, T))).toBe('Vence hoy');
    expect(docLabel(docStatus('VTV', '2026-11-02', null, 30, T))).toBe('Venció ayer');
    expect(docLabel(docStatus('VTV', '2026-10-29', null, 30, T))).toBe('Venció hace 5 días');
    expect(docLabel(docStatus('VTV', null, null, 30, T))).toBe('Sin fecha');
  });
  it('turno en formato largo y corto', () => {
    const doc = docStatus('VTV', '2026-10-29', '2026-11-20', 30, T);
    expect(docLabel(doc)).toBe('Turno: 20/11/2026');
    expect(docLabel(doc, 'short')).toBe('Turno 20/11');
  });
});

describe('calendario', () => {
  it('vencimientos con el umbral del usuario', () => {
    expect(calendarExpirationLabel(-1, 30)).toEqual({ text: 'Vencido', tone: 'red' });
    expect(calendarExpirationLabel(0, 30)).toEqual({ text: 'Vence hoy', tone: 'amber' });
    expect(calendarExpirationLabel(1, 30)).toEqual({ text: 'Falta 1 día', tone: 'amber' });
    expect(calendarExpirationLabel(30, 30)).toEqual({ text: 'Faltan 30 días', tone: 'amber' });
    expect(calendarExpirationLabel(31, 30)).toEqual({ text: 'Próximo', tone: 'neutral' });
  });
  it('turnos', () => {
    expect(calendarAppointmentLabel(0)).toBe('Programado');
    expect(calendarAppointmentLabel(5)).toBe('Programado');
    expect(calendarAppointmentLabel(-1)).toBe('Turno pasado');
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `npm test`
Expected: FAIL; no encuentra `lib/docStyles`.

- [ ] **Step 3: Implementar `lib/docStyles.ts`** con las constantes y firmas de Interfaces.

- [ ] **Step 4: Cambiar `pages/Dashboard.tsx`**
  - **Imports:** se agregan `useAlertPrefs`, `attentionList`, `todayISO`, `docLabel`, `DOC_CHIP_CLASSES`, `DOC_ICONS` y `DOC_HEADLINES`, y se saca `Alert` de `../types`.
  - **Preferencias:** `const { prefs, isLoading: isLoadingPrefs } = useAlertPrefs();`.
  - **`useMemo`:**
    - `const today = todayISO()` reemplaza a `todayStr` (líneas 143-146);
    - `checkAppt` sigue igual, pero compara con `today`;
    - se borran `checkDoc` y `realAlerts` (líneas 175-200);
    - `const attention = attentionList(fleet, prefs, today)`: devuelve `attention` sin cortar en 5, y `stats.alertsCount = attention.length`;
    - el retorno sin flota usa `attention: []`;
    - dependencias: `[fleet, monthlyExpenses, prefs]`.
  - **Carga (línea 251):** también espera `isLoadingPrefs`.
  - **Lista (líneas 330-354):** recorre `attention`.
    - key: `` `${vehicle.id}-${doc.type}` ``;
    - círculo y badge con `DOC_CHIP_CLASSES[doc.state]`; ícono `DOC_ICONS[doc.type]`;
    - título: `` `${doc.type} • ${DOC_HEADLINES[doc.state]}` ``;
    - segunda línea: `` `${vehicle.model} (${vehicle.patente?.toUpperCase() || 'S/P'})` ``, más `' · Turno pasado'` si `doc.pastAppointment`;
    - texto del badge: `docLabel(doc, 'short')`.
  - **`types.ts`:** se borra la interfaz `Alert`.

- [ ] **Step 5: Verificar**

Run: `npm test`, `npx tsc --noEmit` y `npm run build`
Expected: PASS, sin errores; el build termina.

- [ ] **Step 6: Commit**

```bash
git add lib/docStyles.ts tests/docStyles.test.ts pages/Dashboard.tsx types.ts
git commit -m "Panel: Atención Requerida con la regla compartida" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Flota

**Files:**
- Modify: `pages/Fleet.tsx:1-6, 33-40, 123-124, 137, 186-193, 215`

**Interfaces:**
- Consumes: `vehicleDocs` (Task 2), `todayISO` (Task 1), `useAlertPrefs` (Task 5), `DOC_CHIP_CLASSES`, `DOC_ICONS` y `docLabel` (Task 6).

- [ ] **Step 1: Cambiar `pages/Fleet.tsx`**
  - **Preferencias:** `const { prefs, isLoading: isLoadingPrefs } = useAlertPrefs();`.
  - **Estados por vehículo:** `const docsById = useMemo(() => { const today = todayISO(); return new Map((rawVehicles ?? []).map(v => [v.id, vehicleDocs(v, prefs, today)])); }, [rawVehicles, prefs]);`.
  - **Se borran** `getExpirationStatus` y `getDocColorClass` (líneas 123-124).
  - **Círculos (vista mobile en líneas 189-191, escritorio en 215):** se reemplazan por `(docsById.get(v.id) ?? []).map(doc => …)`, que dibuja el mismo círculo con:
    - `key={doc.type}`;
    - `title={`${doc.type}: ${docLabel(doc)}`}`;
    - clases `DOC_CHIP_CLASSES[doc.state]`;
    - ícono `DOC_ICONS[doc.type]`.

    Los generadores siguen sin círculos.
  - **Carga (línea 137):** también espera `isLoadingPrefs`.

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit` y `npm run build`
Expected: sin errores. La pantalla se revisa en Task 10.

- [ ] **Step 3: Commit**

```bash
git add pages/Fleet.tsx
git commit -m "Flota: colores de documentos con la regla compartida" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Ficha del vehículo

**Files:**
- Modify: `pages/VehicleDetail.tsx:1-4, 80-98, 100, 105-155, 201-207, 320-323`

**Interfaces:**
- Consumes: `docStatus`, `appointmentAfterRenewal` y `DocType`/`DocStatus` (Task 2); `todayISO` y `formatDateLong` (Task 1); `useAlertPrefs` (Task 5); `DOC_CARD_CLASSES` y `docLabel` (Task 6).

- [ ] **Step 1: Cambiar `pages/VehicleDetail.tsx`**
  - **Preferencias y carga:** `const { prefs, isLoading: prefsLoading } = useAlertPrefs();`. La pantalla de carga (línea 100) también espera `prefsLoading`.
  - **`handleUpdateDoc` (líneas 80-98):** guarda `{ [fields.doc]: newDocDate || null, [fields.appt]: appointmentAfterRenewal(docUpdateModal.currentDoc, newDocDate, docUpdateModal.currentAppt, newApptDate) }`.
  - **`ExpirationCard` (líneas 105-155):** recibe `{ title, icon, type, doc }: { title: string; icon: string; type: DocType; doc: DocStatus }`.
    - colores: `DOC_CARD_CLASSES[doc.state]`;
    - fecha: `doc.expiration ? formatDateLong(doc.expiration) : 'Sin fecha'`;
    - estado: `docLabel(doc)`, más `' · Turno pasado'` si `doc.pastAppointment`;
    - el clic abre el modal con `currentDoc: doc.expiration || ''` y `currentAppt: doc.appointment || ''`.
  - **Uso (líneas 203-205):** `const today = todayISO()` y, por ejemplo, `doc={docStatus('Seguro', vehicle.insurance_expiration, vehicle.insurance_appointment, prefs.thresholds.Seguro, today)}`. Lo mismo para VTV y Patente.
  - **Modal (debajo de la línea 323):** se agrega `<p className="text-[10px] text-stone-500 mt-1">Si cambiás la fecha y no cargás un turno nuevo, el turno anterior se borra.</p>`.

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit` y `npm run build`
Expected: sin errores. La lógica de `appointmentAfterRenewal` ya tiene tests en Task 2.

- [ ] **Step 3: Commit**

```bash
git add pages/VehicleDetail.tsx
git commit -m "Ficha: estado de documentos y turno al renovar" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Calendario

**Files:**
- Modify: `pages/Calendar.tsx:1-3, 14-75, 77, 278-281`

**Interfaces:**
- Consumes: `daysBetween` y `todayISO` (Task 1); `useAlertPrefs` (Task 5); `calendarExpirationLabel`, `calendarAppointmentLabel`, `CALENDAR_TONE_CLASSES` y `CalendarTone` (Task 6).

- [ ] **Step 1: Cambiar `pages/Calendar.tsx`**
  - **Preferencias:** `const { prefs, isLoading: isLoadingPrefs } = useAlertPrefs();`.
  - **`fetchCalendarData`:**
    - `const today = todayISO()` reemplaza al `Date` de las líneas 21-22;
    - `checkExpiry` arma la etiqueta con `calendarExpirationLabel(daysBetween(today, dateStr), prefs.thresholds[type])` y guarda `status: label.text` y `tone: label.tone`;
    - `checkAppt` guarda `status: calendarAppointmentLabel(daysBetween(today, dateStr))` y `tone: 'neutral'`;
    - se borra la lógica vieja de `status` (líneas 30-33).

    Los colores por tipo (`color`) no cambian.
  - **Efecto (línea 77):** `useEffect(() => { if (!isLoadingPrefs) fetchCalendarData(); }, [currentDate, prefs, isLoadingPrefs]);`.
  - **Etiqueta del panel del día (líneas 278-281):** usa `CALENDAR_TONE_CLASSES[evt.tone as CalendarTone]` en lugar de la comparación con `'Vencido'`.

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit` y `npm run build`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add pages/Calendar.tsx
git commit -m "Calendario: etiquetas con los días del usuario" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Verificación completa

Requisito: el SQL de Task 5 ya está corrido.

- [ ] **Step 1: Chequeos automáticos**

Run: `npm test`, `npx tsc --noEmit`, `npm run build` y el chequeo de Deno de Task 4, Step 3.
Expected: todo pasa.

- [ ] **Step 2: Levantar la app**

Crear `.claude/launch.json` (sin commitear) con el servidor `npm run dev` en el puerto 3000 y abrirlo en el navegador integrado. El usuario inicia sesión con su propia cuenta.

- [ ] **Step 3: Revisar las pantallas, solo mirando**
  - **Panel:** "Atención Requerida" lista vencidos, por vencer y turnos en ese orden, con etiquetas como "Faltan N días" o "Turno dd/mm". El contador de Documentación coincide con la lista.
  - **Flota:** los círculos tienen el color de cada estado y, al pasar el mouse, muestran la etiqueta.
  - **Ficha de un vehículo con fechas:** colores y textos de las tres tarjetas.
  - **Calendario:** las etiquetas "Faltan N días" (en amarillo), "Próximo" y "Programado".
  - **Ancho de celular (375 px):** el panel y Ajustes se ven bien.

- [ ] **Step 4: Probar Ajustes**
  - Mover una barra: aparece "Sincronizando...", y al recargar la página el valor queda.
  - Apagar un interruptor, recargar y ver que quedó apagado.
  - "Guardar Cambios" muestra "Guardado!".
  - Al final, volver todo a los valores que tenía el usuario.

- [ ] **Step 5: Revisión final de la rama** según el método de ejecución elegido. Se corrige lo que encuentre antes de publicar.

---

### Task 11: Publicación

- [ ] **Step 1: Integrar y publicar el frontend**

Confirmar que el SQL de Task 5 está corrido. Con superpowers:finishing-a-development-branch, integrar `alertas-vencimientos` en `main` y correr `git push origin main`; el usuario pidió que el push lo haga Claude. Vercel publica solo. El usuario confirma que la app nueva ya está: en Ajustes ya no aparece "Resumen Semanal".

- [ ] **Step 2: Revisar la configuración actual de la función**

El usuario revisa en el panel de Supabase y lo informa:
- en Edge Functions → `check-alerts`, si "Verify JWT" está activado o no;
- en Integrations → Cron, que exista la tarea que llama a `check-alerts` con horario `0 12 * * *`.

- [ ] **Step 3: El usuario inicia sesión en la CLI**

En su terminal corre `npx --yes supabase@2.72.7 login` y completa el inicio de sesión en el navegador.

- [ ] **Step 4: Subir la función**

Run: `npx --yes supabase@2.72.7 functions deploy check-alerts --project-ref ggiowrgwagsyayudcojc --use-api`. `--use-api` empaqueta la función en Supabase y así no hace falta Docker. Se agrega `--no-verify-jwt` solo si en el Step 2 "Verify JWT" estaba desactivado.
Expected: `Deployed Functions on project ggiowrgwagsyayudcojc: check-alerts`.

- [ ] **Step 5: Prueba real**
  1. El usuario activa las notificaciones en su celular (Ajustes → Notificaciones).
  2. Sube un umbral para que al menos un documento entre en el plazo, por ejemplo VTV a 90 días.
  3. Ejecuta `check-alerts` desde el panel de Supabase (Edge Functions → `check-alerts` → Test) y pega la respuesta. Se espera `sent` ≥ 1.
  4. Confirma que en el celular llegó una notificación por documento, con el texto esperado, y que al tocarla se abre la ficha del vehículo.
  5. Vuelve el umbral a su valor.
