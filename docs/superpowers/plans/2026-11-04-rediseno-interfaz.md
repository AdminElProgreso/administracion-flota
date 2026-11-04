# Rediseño de la interfaz: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar toda la interfaz por la del prototipo aprobado, sin perder ninguna función actual.

**Architecture:**
- **Estilos:** CSS propio llevado del prototipo a `styles/`. Se elimina Tailwind.
- **Lógica:** la de presentación va en funciones puras de `lib/`, con tests.
- **Datos:** por hooks de react-query en `lib/data.ts`.
- **Componentes:** los chicos se reúsan desde `components/`, las hojas (formularios) se abren desde cualquier pantalla con `useSheets()`, y las páginas conservan sus rutas.

**Tech Stack:** React 19, Vite 6, TypeScript 5.8, react-router-dom 7 (HashRouter), @tanstack/react-query 5, @supabase/supabase-js 2, vite-plugin-pwa 1, Vitest 3.2.4.

**Spec:** `docs/superpowers/specs/2026-11-04-rediseno-interfaz-design.md` · **Visual:** `docs/propuesta/interfaz.html`

## Global Constraints

- **Fuente visual:** el prototipo `docs/propuesta/interfaz.html` manda en colores, tipografías, componentes, textos y comportamiento. Donde este plan no lo especifica, se copia del prototipo.
- **Tokens de color:** los de `:root` del prototipo, sin cambios. Verde `#0F7A37`/`#00A351`, sol `#F2D300`, naranja `#E85122`, carbón `#1B1B1B`, papel `#F6F5F1`.
- **Tipografías:** Bebas Neue (títulos), Barlow (texto), Barlow Condensed (rótulos) e íconos Material Symbols Rounded, todas de Google Fonts.
- **Corte de escritorio:** `@media (min-width: 900px)`. Hasta 899 px es el diseño de celular.
- **Sin Tailwind:** ni el CDN ni clases de Tailwind en el código nuevo.
- **Rutas:** se conservan `/`, `/fleet`, `/fleet/:id`, `/calendar`, `/maintenance` y `/settings`, más `*` que redirige a `/`.
- **Valores de la base:** el estado es `'Activo' | 'En Taller' | 'Baja'` y se muestra "Activo", "En taller" y "De baja". Las secciones son `DEFAULT_SECTIONS` más las que ya existan en la base.
- **Textos:** en español rioplatense, con voseo ("Ingresá", "Revisá", "Configurá"). Nunca `alert()`: los mensajes van en avisos (toast).
- **Datos incompletos:** un dato vacío se muestra "—", y una patente vacía, "Sin patente". Nunca aparece `null`, `undefined` ni `NaN`.
- **Fuera de alcance:** no se tocan `supabase/functions/` ni la base de datos.
- **Datos de producción:** en las pruebas no se escriben sin un OK explícito del usuario.
- **Commits:** cada mensaje termina con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Nunca se agregan `.claude/` ni `supabase/schema.sql`.

## Review Focus

1. **Textos largos a 375 px** (modelo, proveedor, sección, nombres): se cortan con elipsis o pasan de línea, y nunca desbordan a lo ancho. Verificación en Task 14.
2. **Falla de red al cargar vehículos o trabajos:** se ve un error con "Reintentar", nunca "Todo en orden" ni una lista vacía. Tests de `loadView` en Task 2 y verificación en Task 14.
3. **Doble toque en "Guardar":** se guarda una sola vez, porque el botón queda deshabilitado mientras la mutación está en curso. Pasos en Tasks 8, 9, 10 y 12.
4. **Unidades con datos vacíos** (sin año, sin km, sin sección, sin patente): se ve "—" o "Sin patente". Tests de `orDash` y `plateText` en Task 2.
5. **Enlace de una notificación a un vehículo borrado** (`/#/fleet/<id inexistente>`): se ve "Vehículo no encontrado" con un botón para volver a Vehículos. Paso en Task 10 y verificación en Task 14.

---

## Antes de empezar

- [ ] Crear la rama `rediseno-interfaz` desde `main`. Commitear el spec, este plan y el prototipo:

```bash
git add docs/superpowers/specs/2026-11-04-rediseno-interfaz-design.md docs/superpowers/plans/2026-11-04-rediseno-interfaz.md docs/propuesta/interfaz.html
git commit -m "Agrega diseño, plan y prototipo del rediseño" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 1: Base visual

**Files:**
- Create: `styles/base.css`, `styles/components.css`, `styles/layout.css`, `styles/screens.css`
- Modify: `index.html`, `index.tsx`, `vite.config.ts`
- Delete: `public/manifest.json` (el plugin genera `manifest.webmanifest`)

- [ ] **Step 1: Pasar el CSS del prototipo a los cuatro archivos**

Se copia el bloque `<style>` de `docs/propuesta/interfaz.html` y se reparte así:
- `base.css`: `:root`, reset, `.ms`, `.display`, `.eyebrow`, `.num` y foco.
- `components.css`: card, lista y filas, badge y `st-*`, pill, patente, botones, campos, seg, chips, búsqueda, switch, stepper, empty, sheet y scrim, toast, kpi, `qa`, `types` y `note`.
- `layout.css`: `.app`, sidebar, `.main`, topbar, tabbar, fab, `.page-head`, `.sec` y las reglas de escritorio del shell.
- `screens.css`: hero, kpis, home-grid, vehículos, ficha, agenda, taller, ajustes e ingreso.

Al copiar se hacen estos cambios:
- `@container app (min-width:900px)` pasa a `@media (min-width: 900px)`.
- No se copian `.deck`, `.stage`, `.device`, `.sb` ni el marco de teléfono.
- Lo que era `position:absolute` dentro del teléfono pasa a `position:fixed`: tabbar, scrim, sheet, toast y push.
- `.main` ya no es contenedor de scroll: desplaza la ventana. `.sidebar` va con `position:sticky; top:0; height:100dvh`.
- `.app{min-height:100dvh}`, y `body{background:var(--papel)}`.
- Se agregan:
  - `.tabbar{bottom:max(12px, env(safe-area-inset-bottom))}`;
  - `.loading` (spinner de 32 px con `@keyframes spin`) y `.error-state` (como `.empty`, con el ícono en `var(--bad)`);
  - una animación de entrada `@keyframes sheet-up` para `.sheet.open` en el celular.

- [ ] **Step 2: Limpiar `index.html`**

Se quitan:
- `class="dark"`;
- el `<script src="https://cdn.tailwindcss.com">` con su configuración;
- el `<style>` oscuro, el `importmap` y `<link rel="stylesheet" href="/index.css">`;
- `<link rel="manifest" href="/manifest.json">`;
- las fuentes Space Grotesk, Noto Sans y Material Symbols Outlined.

Quedan:
- `<meta name="theme-color" content="#0F7A37">`, `<title>El Progreso · Gestión de Flota</title>`, `<link rel="icon" href="/favicon.ico">` y `<link rel="apple-touch-icon" href="/pwa-192x192.png">`;
- los dos `<link>` de Google Fonts del prototipo, con sus `preconnect`.

- [ ] **Step 3: `index.tsx` y `vite.config.ts`**

En `index.tsx`: se importan los cuatro CSS en el orden base → components → layout → screens, y se borra el registro manual de `/sw.js`. Lo registra el plugin.

En `vite.config.ts`:
- en el manifiesto, `theme_color: '#0F7A37'` y `background_color: '#F6F5F1'`;
- se borra el bloque `define` de `GEMINI_API_KEY`;
- se agrega `workbox.runtimeCaching`:
  - `fonts.googleapis.com` con `StaleWhileRevalidate` (cache `google-fonts-css`);
  - `fonts.gstatic.com` con `CacheFirst` (cache `google-fonts-files`, `maxEntries: 30`, un año, `cacheableResponse.statuses: [0, 200]`);
  - la URL del logo con `StaleWhileRevalidate` (cache `logo`, `statuses: [0, 200]`).

- [ ] **Step 4: Verificar**

Run: `npx tsc --noEmit`, `npm test` y `npm run build`
Expected: sin errores; 33/33 PASS; build ok. Las páginas viejas se ven sin estilos hasta que se reescriben, y es esperado.

- [ ] **Step 5: Commit** `"Base visual del rediseño: estilos propios, fuentes y PWA"` con los archivos de este task, incluido el borrado de `public/manifest.json`.

---

### Task 2: Formatos, textos de estado y carga

**Files:**
- Create: `lib/format.ts`, `lib/loadView.ts`
- Modify: `lib/docStyles.ts` (se reescribe), `tests/docStyles.test.ts` (se reescribe)
- Test: `tests/format.test.ts`, `tests/loadView.test.ts`

**Interfaces:**
- Produces (`lib/format.ts`):
  - `plateText(p: string | null | undefined): string | null`
  - `orDash(v: string | number | null | undefined): string`
  - `money(n: number): string` y `num(n: number): string`, con separador de miles es-AR y sin decimales
  - `cap(s: string): string`
  - `greeting(d: Date): string`
  - `longDate(iso: string): string`
  - `MONTHS: string[]` (en minúscula) y `MONTHS_SHORT: string[]` (`'ENE'…'DIC'`)
- Produces (`lib/loadView.ts`): `type LoadView = 'loading' | 'error' | 'ready'` y `loadView(...queries: { data: unknown; error: unknown }[]): LoadView`. Es `ready` si todas las consultas tienen datos; `error` si alguna tiene error y no tiene datos; si no, `loading`.
- Produces (`lib/docStyles.ts`):
  - `STATE_CLASS: Record<DocState, string>`: appointment → `st-appt`, expired → `st-bad`, expiring → `st-warn`, ok → `st-ok`, no-date → `st-none`.
  - `DOC_ICONS: Record<DocType, string>`: Seguro `shield`, VTV `fact_check`, Patente `receipt_long`.
  - `docLabel(doc: DocStatus): string` y `docTitle(doc: DocStatus): string`.
  - Se eliminan `DOC_CHIP_CLASSES`, `DOC_CARD_CLASSES`, `DOC_HEADLINES`, `CALENDAR_TONE_CLASSES`, `CalendarTone`, `calendarExpirationLabel` y `calendarAppointmentLabel`.

- [ ] **Step 1: Tests que fallan**

```ts
// tests/format.test.ts
import { describe, it, expect } from 'vitest';
import { plateText, orDash, money, num, greeting, longDate } from '../lib/format';

describe('format', () => {
  it('patente Mercosur, vieja o vacía', () => {
    expect(plateText('AA236JS')).toBe('AA 236 JS');
    expect(plateText(' ab 123 cd ')).toBe('AB 123 CD');
    expect(plateText('JRS506')).toBe('JRS 506');
    expect(plateText('JRS 506')).toBe('JRS 506');
    expect(plateText('X1')).toBe('X1');
    expect(plateText('')).toBeNull();
    expect(plateText(null)).toBeNull();
  });
  it('dato vacío como guion', () => {
    expect(orDash(null)).toBe('—');
    expect(orDash(undefined)).toBe('—');
    expect(orDash('  ')).toBe('—');
    expect(orDash(Number.NaN)).toBe('—');
    expect(orDash(2019)).toBe('2019');
    expect(orDash('RAFA')).toBe('RAFA');
  });
  it('plata y números en formato argentino', () => {
    expect(money(483500)).toBe('$ 483.500');
    expect(money(98500.4)).toBe('$ 98.500');
    expect(money(0)).toBe('$ 0');
    expect(num(210400)).toBe('210.400');
  });
  it('saludo según la hora', () => {
    expect(greeting(new Date(2026, 10, 4, 4, 59))).toBe('Buenas noches');
    expect(greeting(new Date(2026, 10, 4, 5, 0))).toBe('Buen día');
    expect(greeting(new Date(2026, 10, 4, 12, 0))).toBe('Buenas tardes');
    expect(greeting(new Date(2026, 10, 4, 20, 0))).toBe('Buenas noches');
  });
  it('fecha larga', () => {
    expect(longDate('2026-11-04')).toBe('Miércoles 4 de noviembre');
    expect(longDate('2026-11-01')).toBe('Domingo 1 de noviembre');
  });
});
```

```ts
// tests/loadView.test.ts
import { describe, it, expect } from 'vitest';
import { loadView } from '../lib/loadView';

describe('loadView', () => {
  it('distingue cargando, error y listo', () => {
    expect(loadView({ data: [], error: null })).toBe('ready');
    expect(loadView({ data: undefined, error: null })).toBe('loading');
    expect(loadView({ data: undefined, error: new Error('red') })).toBe('error');
    expect(loadView({ data: [1], error: new Error('refetch') })).toBe('ready');
    expect(loadView({ data: [], error: null }, { data: undefined, error: null })).toBe('loading');
    expect(loadView({ data: [], error: null }, { data: undefined, error: new Error('x') })).toBe('error');
  });
});
```

```ts
// tests/docStyles.test.ts (reemplaza el archivo entero)
import { describe, it, expect } from 'vitest';
import { docStatus } from '../supabase/functions/_shared/alerts';
import { docLabel, docTitle } from '../lib/docStyles';
import { T } from './fixtures';

describe('docLabel', () => {
  it('vencimientos', () => {
    expect(docLabel(docStatus('VTV', '2026-12-04', null, 30, T))).toBe('Al día');
    expect(docLabel(docStatus('VTV', '2026-11-11', null, 30, T))).toBe('Vence en 8 días');
    expect(docLabel(docStatus('VTV', '2026-11-04', null, 30, T))).toBe('Vence mañana');
    expect(docLabel(docStatus('VTV', '2026-11-03', null, 30, T))).toBe('Vence hoy');
    expect(docLabel(docStatus('VTV', '2026-11-02', null, 30, T))).toBe('Venció ayer');
    expect(docLabel(docStatus('VTV', '2026-10-29', null, 30, T))).toBe('Venció hace 5 días');
    expect(docLabel(docStatus('VTV', null, null, 30, T))).toBe('Sin fecha');
  });
  it('turnos', () => {
    expect(docLabel(docStatus('VTV', '2026-10-29', '2026-11-03', 30, T))).toBe('Turno hoy');
    expect(docLabel(docStatus('VTV', '2026-10-29', '2026-11-04', 30, T))).toBe('Turno mañana');
    expect(docLabel(docStatus('VTV', '2026-10-29', '2026-11-20', 30, T))).toBe('Turno el 20/11');
  });
});

describe('docTitle', () => {
  it('con género y estado', () => {
    expect(docTitle(docStatus('Seguro', '2026-10-29', null, 15, T))).toBe('Seguro vencido');
    expect(docTitle(docStatus('VTV', '2026-10-29', null, 30, T))).toBe('VTV vencida');
    expect(docTitle(docStatus('Patente', '2026-10-29', null, 10, T))).toBe('Patente vencida');
    expect(docTitle(docStatus('VTV', '2026-11-10', null, 30, T))).toBe('VTV por vencer');
    expect(docTitle(docStatus('Patente', null, '2026-11-10', 10, T))).toBe('Turno de Patente');
    expect(docTitle(docStatus('Seguro', '2027-06-01', null, 15, T))).toBe('Seguro');
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `npm test`
Expected: FAIL en `format` y `loadView` (no existe el módulo) y en `docStyles` (`docTitle` no existe y los textos son los viejos).

- [ ] **Step 3: Implementar**

- `plateText`:
  - pasa a mayúsculas y saca los espacios;
  - si matchea `/^[A-Z]{2}\d{3}[A-Z]{2}$/`, devuelve `AA 236 JS`;
  - si matchea `/^[A-Z]{3}\d{3}$/`, devuelve `JRS 506`;
  - si no, el texto en mayúsculas tal cual; si queda vacío, `null`.
- `greeting`: de 5 a 11:59 "Buen día", de 12 a 19:59 "Buenas tardes" y el resto "Buenas noches".
- `longDate`: `cap(díaDeLaSemana) + ' ' + día + ' de ' + mes`, calculado con `Date.UTC` sobre la fecha ISO.
- `docLabel`, en orden:
  1. appointment: "Turno hoy", "Turno mañana" o `Turno el ${formatDateShort}`;
  2. expired: "Venció ayer" o "Venció hace N días";
  3. expiring: "Vence hoy", "Vence mañana" o "Vence en N días";
  4. ok: "Al día";
  5. no-date: "Sin fecha".
- `docTitle`: expired → `${tipo} vencido|vencida`, femenino para VTV y Patente; expiring → `${tipo} por vencer`; appointment → `Turno de ${tipo}`; si no, el tipo.

- [ ] **Step 4: Verificar**

Run: `npm test` y `npx tsc --noEmit`
Expected: PASS. `tsc` va a marcar errores en las páginas viejas que usan lo eliminado de `docStyles`. Se corrigen agregando `// @ts-nocheck` como primera línea de cada página vieja que falle. Cada página nueva lo saca al reescribirse.

- [ ] **Step 5: Commit** `"Formatos, textos de estado y estado de carga"`.

---

### Task 3: Agenda y gasto mensual

**Files:**
- Create: `lib/agenda.ts`, `lib/spend.ts`
- Test: `tests/agenda.test.ts`, `tests/spend.test.ts`

**Interfaces:**
- Consumes: `VehicleDates`, `AlertPrefs`, `DocStatus`, `vehicleDocs` y `docStatus` (alerts.ts); `docTitle` (Task 2); `parse`/`daysBetween` de `supabase/functions/_shared/dates`.
- Produces (`lib/agenda.ts`):
  - `interface AgendaEvent { date: string; vehicle: VehicleDates; doc: DocStatus; kind: 'expiration' | 'appointment' }`
  - `agendaEvents(vehicles: VehicleDates[], prefs: AlertPrefs, today: string): { overdue: AgendaEvent[]; upcoming: AgendaEvent[] }`. Saltea `Baja`. Por documento:
    - appointment → evento de turno en `upcoming`;
    - expired → `overdue`;
    - expiring u ok con vencimiento → `upcoming`;
    - no-date → nada.

    Las dos listas van ordenadas por fecha ascendente.
  - `eventDays(e: AgendaEvent): number`
  - `eventTitle(e: AgendaEvent): string`
  - `agendaWhen(days: number): string`
  - `groupByMonth<T extends { date: string }>(items: T[]): { key: string; year: number; month: number; items: T[] }[]`
  - `monthCells(year: number, month: number): (number | null)[]`, con la semana empezando el lunes
  - `eventsByDay(events: AgendaEvent[], year: number, month: number): Map<number, AgendaEvent[]>`
- Produces (`lib/spend.ts`):
  - `interface MonthSpend { key: string; label: string; total: number; count: number }`
  - `monthlySpend(works: { date: string; cost: number | null }[], today: string, months?: number): MonthSpend[]`, del mes más viejo al actual (6 por defecto)
  - `averageSpend(m: MonthSpend[]): number`

- [ ] **Step 1: Tests que fallan**

```ts
// tests/agenda.test.ts
import { describe, it, expect } from 'vitest';
import { DEFAULT_PREFS } from '../supabase/functions/_shared/alerts';
import { agendaEvents, eventTitle, agendaWhen, groupByMonth, monthCells, eventDays } from '../lib/agenda';
import { T, vehicle } from './fixtures';

describe('agendaEvents', () => {
  const vs = [
    vehicle('A', { vtv_expiration: '2026-10-29' }),
    vehicle('B', { vtv_expiration: '2026-10-29', vtv_appointment: '2026-11-06' }),
    vehicle('C', { insurance_expiration: '2026-11-20' }),
    vehicle('D', { status: 'Baja', vtv_expiration: '2026-10-01' }),
    vehicle('E', { patente_expiration: '2026-11-05' }),
  ];
  const key = (e: any) => `${e.vehicle.id}-${e.doc.type}-${e.kind}`;
  it('separa vencidos y próximos, sin unidades de baja', () => {
    const { overdue, upcoming } = agendaEvents(vs, DEFAULT_PREFS, T);
    expect(overdue.map(key)).toEqual(['A-VTV-expiration']);
    expect(upcoming.map(key)).toEqual(['E-Patente-expiration', 'B-VTV-appointment', 'C-Seguro-expiration']);
    expect(upcoming.map(eventDays)).toEqual([2, 3, 17]);
  });
  it('títulos', () => {
    const { overdue, upcoming } = agendaEvents(vs, DEFAULT_PREFS, T);
    expect(eventTitle(overdue[0])).toBe('VTV vencida');
    expect(upcoming.map(eventTitle)).toEqual(['Vence la patente', 'Turno de VTV', 'Vence el seguro']);
  });
});

describe('agenda: textos y meses', () => {
  it('cuándo', () => {
    expect([0, 1, 5, -1, -3].map(agendaWhen)).toEqual(['Hoy', 'Mañana', 'En 5 días', 'Ayer', 'Hace 3 días']);
  });
  it('agrupa por mes en orden', () => {
    const g = groupByMonth([{ date: '2026-11-05' }, { date: '2026-11-20' }, { date: '2026-12-01' }]);
    expect(g.map(x => [x.key, x.year, x.month, x.items.length])).toEqual([['2026-11', 2026, 11, 2], ['2026-12', 2026, 12, 1]]);
  });
  it('grilla del mes empezando el lunes', () => {
    const nov = monthCells(2026, 11);
    expect(nov.slice(0, 7)).toEqual([null, null, null, null, null, null, 1]);
    expect(nov.length).toBe(36);
    expect(monthCells(2026, 2).length).toBe(34);
  });
});
```

```ts
// tests/spend.test.ts
import { describe, it, expect } from 'vitest';
import { monthlySpend, averageSpend } from '../lib/spend';

describe('monthlySpend', () => {
  const works = [
    { date: '2026-11-02', cost: 385000 }, { date: '2026-11-01', cost: 98500 }, { date: '2026-11-01', cost: null },
    { date: '2026-10-30', cost: 45000 }, { date: '2026-06-12', cost: 190000 }, { date: '2026-05-30', cost: 999 },
  ];
  it('últimos 6 meses, del más viejo al actual', () => {
    const m = monthlySpend(works, '2026-11-03');
    expect(m.map(x => x.key)).toEqual(['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']);
    expect(m.map(x => x.label)).toEqual(['JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV']);
    expect(m.map(x => x.total)).toEqual([190000, 0, 0, 0, 45000, 483500]);
    expect(m.map(x => x.count)).toEqual([1, 0, 0, 0, 1, 3]);
    expect(averageSpend(m)).toBe(119750);
  });
  it('cruza el año', () => {
    expect(monthlySpend([], '2026-02-10', 3).map(x => x.key)).toEqual(['2025-12', '2026-01', '2026-02']);
  });
});
```

- [ ] **Step 2: Correr y ver que fallan.** Run: `npm test`. Expected: FAIL; no existen `lib/agenda` ni `lib/spend`.

- [ ] **Step 3: Implementar.** Textos de `eventTitle`:
  - turno: `Turno de ${tipo}`;
  - vencido: `docTitle`;
  - próximo: "Vence la VTV", "Vence el seguro" o "Vence la patente".

- [ ] **Step 4: Verificar.** Run: `npm test`. Expected: PASS.

- [ ] **Step 5: Commit** `"Lógica de agenda y gasto mensual"`.

---

### Task 4: Vehículos, trabajos y cambios a guardar

**Files:**
- Create: `lib/vehicles.ts`, `lib/works.ts`, `lib/patches.ts`
- Modify: `types.ts`, `tests/fixtures.ts`
- Test: `tests/vehicles.test.ts`, `tests/works.test.ts`, `tests/patches.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  - `type VehicleType = 'car' | 'truck' | 'generator' | 'tractor'` y `type VehicleStatus = 'Activo' | 'En Taller' | 'Baja'`.
  - `interface VehicleRow`, con las columnas actuales:
    - `id`, `tipo: VehicleType`, `patente: string | null`, `model: string`, `year: number | null`, `section: string | null`;
    - `status: VehicleStatus`, `odometer: number | null`, `manager: string | null`, `assigned_driver: string | null`;
    - las seis columnas `*_expiration` y `*_appointment: string | null`;
    - `created_at?: string`.
  - `type WorkType = 'Mantenimiento' | 'Reparación'`.
  - `interface WorkRow { id: string; date: string; vehicle_id: string; type: WorkType; description: string | null; provider: string | null; cost: number | null; status: string | null }`.

  Se eliminan `Vehicle`, `MaintenanceLog` y `TeamMember`. Las páginas viejas siguen con `@ts-nocheck` hasta reescribirse.
- Produces (`lib/vehicles.ts`):
  - `TYPE_INFO: Record<VehicleType, { label: string; icon: string; unit: 'km' | 'h' }>`: car "Camioneta / auto" `directions_car` km; truck "Camión" `local_shipping` km; tractor "Tractor" `agriculture` h; generator "Generador" `bolt` h.
  - `STATUS_INFO: Record<VehicleStatus, { label: string; cls: string }>`: Activo → `s-active`; En Taller → "En taller" `s-shop`; Baja → "De baja" `s-off`.
  - `type VehicleFilter = 'todos' | 'activos' | 'taller' | 'baja'`.
  - `filterVehicles<T extends VehicleRow>(list: T[], filter: VehicleFilter, query: string): T[]`. La búsqueda no distingue mayúsculas, espacios ni acentos, y mira modelo, patente, chofer, encargado y sección. Con `todos`, las unidades de baja van al final.
  - `countByFilter(list: VehicleRow[]): Record<VehicleFilter, number>`.
  - `DEFAULT_SECTIONS = ['Administración', 'Agronomía', 'Balanceado', 'Cereales', 'Estación de Servicio', 'Ferreteria', 'Hacienda', 'Logística', 'Miel', 'Supermercado', 'Veterinaria']`.
  - `sectionOptions(vehicles: VehicleRow[]): string[]`: las de defecto más las existentes no vacías, sin repetir, en orden alfabético `es`.
  - `interface VehicleForm { tipo: VehicleType; patente: string; model: string; year: string; odometer: string; section: string; manager: string; driver: string; status: VehicleStatus; insurance_expiration: string; vtv_expiration: string; patente_expiration: string }`.
  - `vehicleFromForm(f: VehicleForm): Omit<VehicleRow, 'id' | 'created_at' | 'vtv_appointment' | 'insurance_appointment' | 'patente_appointment'>`:
    - recorta espacios y pasa a mayúsculas modelo, patente (sin espacios), encargado y chofer;
    - un texto vacío queda `null`;
    - año y km se convierten a entero, y si no son números quedan `null`;
    - en un generador, patente, chofer y fechas quedan `null`.
- Produces (`lib/works.ts`):
  - `interface WorkForm { vehicle_id: string; type: WorkType; date: string; description: string; provider: string; cost: string }`.
  - `parseCost(text: string): number | null`.
  - `workFromForm(f: WorkForm): Omit<WorkRow, 'id'>`. Si la descripción está vacía, tira `Error('Contá qué se hizo')`. El costo `null` se guarda como 0, y `status: 'Completado'`.
- Produces (`lib/patches.ts`):
  - `renewPatch(type: DocType, newExpiration: string): Record<string, string | null>`.
  - `appointmentPatch(type: DocType, appointment: string | null): Record<string, string | null>`.
- Produces (`tests/fixtures.ts`): `vrow(id: string, over?: Partial<VehicleRow>): VehicleRow`. Por defecto: tipo car, patente `'AA789XX'`, modelo `'TOYOTA HILUX'`, año 2020, sección `'Cereales'`, estado `'Activo'`, km 1000, encargado `'RAFA'`, chofer `'NICO'` y fechas `null`.

- [ ] **Step 1: Tests que fallan**

```ts
// tests/vehicles.test.ts
import { describe, it, expect } from 'vitest';
import { filterVehicles, countByFilter, sectionOptions, vehicleFromForm, type VehicleForm } from '../lib/vehicles';
import { vrow } from './fixtures';

const list = [
  vrow('a', { status: 'Baja', model: 'FIAT 147' }),
  vrow('b', { model: 'RANGER', patente: 'AA236JS', section: 'Agronomía', assigned_driver: 'NICO' }),
  vrow('c', { status: 'En Taller', model: 'FORD F-4000' }),
];
const ids = (l: { id: string }[]) => l.map(v => v.id);

describe('filterVehicles', () => {
  it('por estado, con las bajas al final en Todos', () => {
    expect(ids(filterVehicles(list, 'todos', ''))).toEqual(['b', 'c', 'a']);
    expect(ids(filterVehicles(list, 'activos', ''))).toEqual(['b']);
    expect(ids(filterVehicles(list, 'taller', ''))).toEqual(['c']);
    expect(ids(filterVehicles(list, 'baja', ''))).toEqual(['a']);
  });
  it('búsqueda sin mayúsculas, espacios ni acentos', () => {
    expect(ids(filterVehicles(list, 'todos', 'aa 236'))).toEqual(['b']);
    expect(ids(filterVehicles(list, 'todos', 'agronomia'))).toEqual(['b']);
    expect(ids(filterVehicles(list, 'todos', 'nico'))).toEqual(['b']);
    expect(ids(filterVehicles(list, 'todos', 'xyz'))).toEqual([]);
  });
  it('cuenta por filtro', () => {
    expect(countByFilter(list)).toEqual({ todos: 3, activos: 1, taller: 1, baja: 1 });
  });
});

describe('sectionOptions', () => {
  it('suma las secciones que ya existen, sin vacías ni repetidas', () => {
    const opts = sectionOptions([vrow('x', { section: 'Agronomia' }), vrow('y', { section: 'Logística' }), vrow('z', { section: null })]);
    expect(opts).toContain('Agronomia');
    expect(opts).toContain('Agronomía');
    expect(opts.filter(s => s === 'Logística')).toHaveLength(1);
    expect(opts).not.toContain('');
  });
});

describe('vehicleFromForm', () => {
  const base: VehicleForm = { tipo: 'car', patente: ' ab 123 cd ', model: ' hilux srv ', year: '', odometer: '12a', section: 'Cereales', manager: 'rafa', driver: '', status: 'Activo', insurance_expiration: '2027-01-10', vtv_expiration: '', patente_expiration: '' };
  it('normaliza textos y números', () => {
    expect(vehicleFromForm(base)).toEqual({
      tipo: 'car', patente: 'AB123CD', model: 'HILUX SRV', year: null, odometer: null, section: 'Cereales',
      manager: 'RAFA', assigned_driver: null, status: 'Activo',
      insurance_expiration: '2027-01-10', vtv_expiration: null, patente_expiration: null,
    });
  });
  it('un generador no lleva patente, chofer ni fechas', () => {
    const g = vehicleFromForm({ ...base, tipo: 'generator', year: '2006', odometer: '2300', driver: 'JUAN' });
    expect(g).toMatchObject({ tipo: 'generator', patente: null, assigned_driver: null, year: 2006, odometer: 2300, insurance_expiration: null });
  });
});
```

```ts
// tests/works.test.ts
import { describe, it, expect } from 'vitest';
import { parseCost, workFromForm } from '../lib/works';

describe('works', () => {
  it('costo con formato argentino', () => {
    expect(parseCost('$ 385.000')).toBe(385000);
    expect(parseCost('98500')).toBe(98500);
    expect(parseCost('1.234,50')).toBe(1235);
    expect(parseCost('')).toBeNull();
    expect(parseCost('abc')).toBeNull();
  });
  it('arma el trabajo y exige descripción', () => {
    expect(workFromForm({ vehicle_id: 'v1', type: 'Reparación', date: '2026-11-04', description: ' Cambio de embrague ', provider: '', cost: '' }))
      .toEqual({ vehicle_id: 'v1', type: 'Reparación', date: '2026-11-04', description: 'Cambio de embrague', provider: null, cost: 0, status: 'Completado' });
    expect(() => workFromForm({ vehicle_id: 'v1', type: 'Mantenimiento', date: '2026-11-04', description: '  ', provider: '', cost: '' })).toThrow('Contá qué se hizo');
  });
});
```

```ts
// tests/patches.test.ts
import { describe, it, expect } from 'vitest';
import { renewPatch, appointmentPatch } from '../lib/patches';

describe('patches', () => {
  it('renovar borra el turno', () => {
    expect(renewPatch('VTV', '2027-11-04')).toEqual({ vtv_expiration: '2027-11-04', vtv_appointment: null });
    expect(renewPatch('Seguro', '2027-01-10')).toEqual({ insurance_expiration: '2027-01-10', insurance_appointment: null });
  });
  it('cargar o quitar turno', () => {
    expect(appointmentPatch('Patente', '2026-11-20')).toEqual({ patente_appointment: '2026-11-20' });
    expect(appointmentPatch('Patente', '')).toEqual({ patente_appointment: null });
  });
});
```

- [ ] **Step 2: Correr y ver que fallan.** Run: `npm test`. Expected: FAIL; no existen los módulos.

- [ ] **Step 3: Implementar.**
  - Acentos: con `normalize('NFD').replace(/[̀-ͯ]/g, '')`.
  - Patches: con `DOC_COLUMNS` de alerts.ts.
  - `parseCost`: saca todo lo que no sea dígito, punto ni coma; borra los puntos de miles; cambia la coma por punto; redondea. Si no queda un número, `null`.

- [ ] **Step 4: Verificar.** Run: `npm test` y `npx tsc --noEmit`. Expected: PASS y sin errores. Si alguna página vieja falla, `@ts-nocheck` como en Task 2.

- [ ] **Step 5: Commit** `"Lógica de vehículos, trabajos y cambios a guardar"`.

---

### Task 5: Datos, notificaciones del dispositivo e instalación

**Files:**
- Create: `lib/data.ts`, `lib/push.ts`, `lib/useInstallPrompt.ts`

**Interfaces:**
- Produces (`lib/data.ts`):
  - `VEHICLES_KEY = ['vehicles'] as const` y `WORKS_KEY = ['works'] as const`.
  - `useVehicles()`: `UseQueryResult<VehicleRow[], Error>`, con `select('*').order('created_at', { ascending: false })`.
  - `useWorks()`: `UseQueryResult<WorkRow[], Error>`, con `select('*').order('date', { ascending: false }).limit(1000)`.
  - `useUpdateVehicle()`: `useMutation` de `{ id: string; patch: Record<string, unknown> }`. Hace `update(patch).eq('id', id).select('id')` y, si vuelven 0 filas, tira `Error('No se pudo guardar el cambio.')`.
  - `useCreateVehicle()`: `useMutation` de `Partial<VehicleRow>` que devuelve `VehicleRow`, con `insert(v).select().single()`.
  - `useDeleteVehicle()`: `useMutation` de `string`. Primero borra `mantenimientos` por `vehicle_id` y, si falla, tira el error. Después borra el vehículo con `.select('id')`; si vuelven 0 filas, tira `Error('No se pudo eliminar la unidad.')`.
  - `useSaveWork()`: `useMutation` de `{ id?: string; values: Omit<WorkRow, 'id'> }`. Con `id` hace update; sin `id`, insert.
  - `useDeleteWork()`: `useMutation` de `string`.

  Todas las mutaciones invalidan `VEHICLES_KEY` y/o `WORKS_KEY` al terminar bien.
- Produces (`lib/push.ts`):
  - `type PushSupport = 'ok' | 'ios-install' | 'unsupported' | 'blocked'`. Sin `serviceWorker`, `PushManager` o `Notification` es `unsupported`, salvo en un iPhone sin instalar, que es `ios-install`. Con `Notification.permission === 'denied'` es `blocked`.
  - `pushSupport(): PushSupport` y `isDeviceSubscribed(): Promise<boolean>`.
  - `subscribeDevice(userId: string): Promise<void>`. Pide permiso; si se lo niegan, tira `Error('Permiso denegado: habilitá las notificaciones en el navegador.')`. Desuscribe la suscripción anterior, suscribe con `VITE_VAPID_PUBLIC_KEY` y hace upsert en `push_subscriptions` (`onConflict: 'subscription'`). Nunca usa un `user_id` de relleno.
  - `unsubscribeDevice(): Promise<void>`: borra la fila (`filter('subscription', 'cs', JSON.stringify(sub))`) y desuscribe. No falla si no había suscripción.
  - `showTestNotification(): Promise<void>`: título "Prueba de notificación", texto "Así te van a llegar los avisos de la flota." e ícono `/pwa-192x192.png`.
- Produces (`lib/useInstallPrompt.ts`): `useInstallPrompt(): { canInstall: boolean; install: () => Promise<void>; installed: boolean; ios: boolean }`, sobre `beforeinstallprompt` y `display-mode: standalone`.

- [ ] **Step 1: Escribir los tres archivos** con las interfaces de arriba. La lógica de push sale de la que hoy está en `pages/Settings.tsx`, sin `alert()`: los errores se tiran para que la pantalla los muestre.
- [ ] **Step 2: Verificar.** Run: `npx tsc --noEmit`, `npm test` y `npm run build`. Expected: sin errores y PASS.
- [ ] **Step 3: Commit** `"Capa de datos, notificaciones del dispositivo e instalación"`.

---

### Task 6: Componentes base

**Files:**
- Create: `components/ui.tsx`, `components/rows.tsx`, `components/Sheet.tsx`, `components/Toast.tsx`

**Interfaces:**
- Produces (`components/ui.tsx`):
  - `LOGO_URL = 'https://elprogresocoop.com.ar/public/img/logo_nav.png'`
  - `Icon({ name, fill?, className? })`
  - `Logo({ className? })`: si la imagen falla, muestra `<span class="logo-fallback">El Progreso</span>`
  - `Plate({ value, large? })`: sin valor muestra "Sin patente"
  - `StatusPill({ status: VehicleStatus })` y `DocBadge({ doc: DocStatus })`
  - `EmptyState({ icon, title, text })` y `ErrorState({ onRetry })`: "No se pudieron cargar los datos." / "Revisá la conexión y probá de nuevo." / botón "Reintentar"
  - `Loading()`
  - `Kpi({ icon, label, value, sub, to })`: un `Link`
  - `Chip({ pressed, count?, onClick, children })`
  - `Switch({ checked, onChange, label, disabled? })`: `role="switch"` y `aria-checked`
  - `Stepper({ value, min, max, onChange, label })`
  - `Segmented<T extends string>({ value, options: { value: T; label: string; icon?: string }[], onChange, block? })`
  - `PageHead({ eyebrow, title, action? })` y `SectionHead({ title, children? })`
- Produces (`components/rows.tsx`):
  - `AttentionRow({ item: AttentionItem })`: `Link` a `/fleet/:id`
  - `WorkItem({ work: WorkRow, vehicle?: VehicleRow, showVehicle?: boolean, onClick: () => void })`
  - `EventRow({ event: AgendaEvent })`: `Link` a `/fleet/:id`
- Produces (`components/Sheet.tsx`): `Sheet({ open, onClose, title, subtitle?, children, footer? })`.
  - Se monta con un portal en `document.body` y no se renderiza cerrado.
  - Se cierra con Escape o tocando el fondo.
  - Bloquea el scroll del `body` mientras está abierto.
  - Al abrir pone el foco en el primer `input` o `select`.
  - `aria-modal`, con `aria-label` igual a `title`.
- Produces (`components/Toast.tsx`): `ToastProvider({ children })` y `useToast(): (message: string, kind?: 'ok' | 'error' | 'info') => void`. Usa los íconos `check_circle`, `error` e `info`, se cierra a los 2600 ms y anuncia con `role="status"`.

- [ ] **Step 1: Escribir los componentes** con el marcado y las clases del prototipo.
- [ ] **Step 2: Verificar.** Run: `npx tsc --noEmit` y `npm run build`. Expected: sin errores.
- [ ] **Step 3: Commit** `"Componentes base del rediseño"`.

---

### Task 7: Estructura, navegación, ingreso y acciones rápidas

**Files:**
- Create: `components/AppShell.tsx`, `components/sheets/SheetsProvider.tsx`, `components/sheets/QuickSheet.tsx`
- Modify: `App.tsx` (se reescribe), `pages/Login.tsx` (se reescribe)

**Interfaces:**
- Consumes: `useVehicles`, `useAlertPrefs`, `attentionList`, `todayISO`, `unsubscribeDevice` y los componentes de Task 6.
- Produces (`SheetsProvider.tsx`):
  - `type SheetRequest = { kind: 'quick' } | { kind: 'renew' | 'appointment'; vehicleId?: string; docType?: DocType } | { kind: 'work'; vehicleId?: string; work?: WorkRow } | { kind: 'vehicle'; vehicle?: VehicleRow }`
  - `SheetsProvider({ children })`
  - `useSheets(): { open: (r: SheetRequest) => void; close: () => void }`

  `renew`, `appointment`, `work` y `vehicle` muestran `EmptyState` hasta que existan sus hojas (Tasks 8 a 10).
- Produces (`AppShell.tsx`): `AppShell({ children, onLogout })`.
  - **Barra lateral (900 px o más):** logo, "Gestión de Flota", Inicio, Vehículos, Agenda (con contador), Taller, "Nuevo registro", Ajustes, Salir y el lema.
  - **Barra superior (celular):** logo, campana con contador que lleva a `/calendar` y engranaje que lleva a `/settings`.
  - **Barra inferior (celular):** Inicio, Vehículos, botón "+", Agenda y Taller.
  - El contador es `attentionList(vehicles, prefs, todayISO()).length`; si es 0, no se muestra.

- [ ] **Step 1: `App.tsx`**
  - Envuelve la app con `QueryClientProvider`, `ToastProvider`, `HashRouter` y `SheetsProvider`.
  - Sin sesión muestra `Login`; con sesión, `AppShell` con las rutas de Global Constraints y `*` → `<Navigate to="/" replace />`.
  - `onLogout` hace `unsubscribeDevice()`, ignorando errores, y después `supabase.auth.signOut()`. Se mantiene el `queryClient.clear()` en `SIGNED_OUT`.
- [ ] **Step 2: `Login.tsx`** como el ingreso del prototipo.
  - `signInWithPassword`.
  - Error: "Email o contraseña incorrectos."
  - El botón dice "Ingresando…" y queda deshabilitado mientras espera.
- [ ] **Step 3: `QuickSheet`** con las cuatro opciones del prototipo. Cada una llama a `open()` con su tipo: `work`, `renew`, `appointment` y `vehicle`.
- [ ] **Step 4: Verificar.** Run: `npx tsc --noEmit`, `npm test` y `npm run build`, y abrir el servidor de desarrollo. Expected: sin errores y PASS. El ingreso y la estructura se ven como en el prototipo; las páginas viejas pueden verse sin estilos.
- [ ] **Step 5: Commit** `"Estructura, navegación, ingreso y acciones rápidas"`.

---

### Task 8: Inicio y hoja de documentos

**Files:**
- Create: `components/sheets/DocSheet.tsx`
- Modify: `pages/Dashboard.tsx` (se reescribe), `components/sheets/SheetsProvider.tsx`

**Interfaces:**
- Consumes: `useVehicles`, `useWorks`, `useAlertPrefs`, `useUpdateVehicle`, `attentionList`, `docStatus`, `renewPatch`, `appointmentPatch`, `loadView`, `greeting`, `longDate`, `money`, `monthlySpend`, `addYears` (se agrega a `lib/format.ts`: `addYears(iso, n)`), `todayISO` y `formatDateLong`.

- [ ] **Step 1: `DocSheet({ kind: 'renew' | 'appointment', vehicleId?, docType? })`** como las hojas del prototipo.
  - Si no vienen vehículo y documento, se eligen: vehículos que no son generador ni están de baja, y Seguro, VTV o Patente.
  - **Renovar:** propone `addYears(max(vencimiento, hoy), 1)`; si hay turno, avisa que se borra; guarda `renewPatch`. Aviso: "Seguro renovado", "VTV renovada" o "Patente renovada", más "hasta el dd/mm/aaaa".
  - **Turno:** propone el turno actual o hoy; muestra el aviso del prototipo; guarda `appointmentPatch`. Si ya hay turno, ofrece "Quitar turno", que hace `appointmentPatch(t, null)`.
  - Mientras `isPending`, "Guardar" queda deshabilitado y dice "Guardando…". Un error se muestra con `toast(e.message, 'error')`.
- [ ] **Step 2: `Dashboard.tsx`** como el Inicio del prototipo.
  - `loadView(vehicles, works, prefs)`: con `error`, `ErrorState` con un `refetch` de las tres consultas; con `loading`, `Loading`.
  - Saludo con `greeting(new Date())` y fecha con `longDate(todayISO())`.
  - Indicadores:
    - "Operativos": unidades con estado `Activo`, con "de N en la flota";
    - "En taller": la cantidad y los modelos;
    - `Gasto de ${mes}`: el último `monthlySpend`, con la cantidad de trabajos;
    - "Próximo vencimiento": "Hoy", "Mañana", "N días" o "—".
  - "Para hoy": turnos de hoy, con "Registrar renovación" que abre `renew`.
  - "Necesitan atención": `AttentionRow`, o vacío con "Todo en orden".
  - "Últimos trabajos": 4 `WorkItem`; al tocar uno se abre la hoja `work` con ese trabajo.
  - Si `user_metadata.password_set` falta, un aviso "Configurá tu contraseña" con un enlace a `/settings`.
- [ ] **Step 3: Verificar.** Run: `npx tsc --noEmit`, `npm test` y `npm run build`. En el navegador, con la sesión del usuario: el Inicio a 375 px y a 1280 px se ve como el prototipo, con datos reales. Se abre la hoja de renovar y se cancela, sin guardar.
- [ ] **Step 4: Commit** `"Inicio y hoja de documentos"`.

---

### Task 9: Vehículos y hoja de vehículo

**Files:**
- Create: `components/sheets/VehicleSheet.tsx`
- Modify: `pages/Fleet.tsx` (se reescribe), `components/sheets/SheetsProvider.tsx`

- [ ] **Step 1: `VehicleSheet({ vehicle? })`**
  - Con `vehicle` es "Editar datos"; sin `vehicle`, "Agregar un vehículo".
  - Tipo en mosaicos (`TYPE_INFO`) y los campos del prototipo; "Horas de uso" para tractor y generador.
  - Sección: un `select` con `sectionOptions(vehicles)`, que en la edición conserva el valor actual.
  - Estado: solo en la edición, con `STATUS_INFO`.
  - Fechas de seguro, VTV y patente: solo en el alta, opcionales y ocultas para generadores.
  - Guarda con `vehicleFromForm` y `useCreateVehicle` o `useUpdateVehicle`, con "Guardar" deshabilitado mientras guarda. Modelo y sección son obligatorios; si faltan, aviso "Completá modelo y sección".
  - Después del alta, navega a la ficha nueva.
- [ ] **Step 2: `Fleet.tsx`** como Vehículos del prototipo.
  - Búsqueda en vivo, chips con `countByFilter` y `filterVehicles`.
  - Tarjetas `Link` a `/fleet/:id`. Generadores con "No lleva seguro, VTV ni patente"; la unidad, con `TYPE_INFO[tipo].unit`.
  - Estados de error, carga y "Sin resultados".
- [ ] **Step 3: Verificar** como en Task 8: tsc, test, build y el navegador a 375 y 1280 px. Se abre "Agregar" y se cancela.
- [ ] **Step 4: Commit** `"Vehículos y hoja de vehículo"`.

---

### Task 10: Ficha del vehículo y hoja de trabajo

**Files:**
- Create: `components/sheets/WorkSheet.tsx`
- Modify: `pages/VehicleDetail.tsx` (se reescribe), `components/sheets/SheetsProvider.tsx`

- [ ] **Step 1: `WorkSheet({ vehicleId?, work? })`**
  - Con `work` es "Editar trabajo"; sin `work`, "Registrar un trabajo".
  - Campos del prototipo; la fecha propuesta es `todayISO()`, que es local.
  - Guarda con `workFromForm` y `useSaveWork`, con "Guardar" deshabilitado mientras guarda. El error de descripción vacía va como aviso.
  - En la edición hay "Borrar trabajo" con confirmación en dos pasos: el botón cambia a "Sí, borrar" y llama a `useDeleteWork`.
- [ ] **Step 2: `VehicleDetail.tsx`** como la ficha del prototipo.
  - Busca la unidad con `useVehicles`. Si cargó y no existe, `EmptyState` "Vehículo no encontrado" / "Puede que la hayan eliminado." con un botón "Ver vehículos". Si falló la carga, `ErrorState`.
  - Datos con `orDash`; documentos (salvo generadores) con `docStatus` y los umbrales del usuario, y los botones que abren `renew` y `appointment`.
  - Historial con `WorkItem`, que abre `work` en edición, y el total del año.
  - Zona de baja:
    - si no está de baja, "Dar de baja", con dos pasos y `useUpdateVehicle`, que pone `status: 'Baja'`;
    - si está de baja, "Reactivar" (`status: 'Activo'`) y "Eliminar definitivamente". Este último pide escribir BORRAR, sin distinguir mayúsculas y recortando espacios, llama a `useDeleteVehicle` y vuelve a `/fleet`.
- [ ] **Step 3: Verificar** como en Task 8, más `/#/fleet/no-existe`, que tiene que mostrar "Vehículo no encontrado". No se guarda nada.
- [ ] **Step 4: Commit** `"Ficha del vehículo y hoja de trabajo"`.

---

### Task 11: Agenda

**Files:**
- Modify: `pages/Calendar.tsx` (se reescribe)

- [ ] **Step 1: `Calendar.tsx`** como la Agenda del prototipo.
  - Usa `agendaEvents`, `groupByMonth`, `EventRow`, `agendaWhen`, `monthCells` y `eventsByDay`.
  - `Segmented` Lista / Mes, que se oculta en escritorio; ahí se ven las dos vistas.
  - Navegación de meses; día elegido (hoy, o el día 1 al cambiar de mes) con su lista o "Sin vencimientos ni turnos este día."
  - Estados de error y carga.
- [ ] **Step 2: Verificar** como en Task 8.
- [ ] **Step 3: Commit** `"Agenda"`.

---

### Task 12: Taller

**Files:**
- Modify: `pages/Maintenance.tsx` (se reescribe)

- [ ] **Step 1: `Maintenance.tsx`** como el Taller del prototipo.
  - Tarjeta de gasto con `monthlySpend` y `averageSpend`.
  - Chips Todos / Mantenimiento / Reparación.
  - Lista agrupada por mes con su total; cada fila abre `WorkSheet` en edición.
  - "Registrar" abre `work`.
  - Si un trabajo no tiene su vehículo, la fila dice "Unidad eliminada".
  - Estados de error, carga y vacío.
- [ ] **Step 2: Verificar** como en Task 8.
- [ ] **Step 3: Commit** `"Taller"`.

---

### Task 13: Ajustes

**Files:**
- Modify: `pages/Settings.tsx` (se reescribe)

- [ ] **Step 1: `Settings.tsx`** como los Ajustes del prototipo.
  - **Preferencias:** se conserva la lógica de carga y guardado actual: `prefsLoadStatus`, `prefsLoaded`, `lastSaved`, `persistPrefs`, el guardado automático a los 1000 ms y los controles deshabilitados hasta cargar.
  - **Pasos de los avisos:** `Stepper` con mínimo 1 y máximos de 60 (Seguro), 90 (VTV), 60 (Patente) y 30 (Turnos).
  - **Notificaciones del celular:**
    - el interruptor usa `isDeviceSubscribed` y `subscribeDevice(userId)` / `unsubscribeDevice`;
    - según `pushSupport()` muestra un texto: `ios-install` → "Instalá la app para recibir avisos en el iPhone."; `blocked` → "Las notificaciones están bloqueadas en este navegador."; `unsupported` → "Este navegador no permite notificaciones.";
    - "Probar" llama a `showTestNotification`;
    - los cuatro interruptores por tipo van con `prefs.enabled`.
  - **Cuenta:**
    - email de la sesión;
    - "Cambiar contraseña": dos campos, mínimo 6 caracteres, que tienen que coincidir; `updateUser({ password, data: { password_set: true } })`;
    - "Cerrar sesión", con el `onLogout` del shell (contexto o prop).
  - **La app en tu celular:** con `useInstallPrompt`. Muestra "Instalar", los pasos para iPhone o "Ya está instalada".
- [ ] **Step 2: Verificar** como en Task 8: los valores cargan desde la base y la sección de notificaciones muestra el estado real. No se guarda nada.
- [ ] **Step 3: Commit** `"Ajustes"`.

---

### Task 14: Limpieza y verificación completa

**Files:**
- Modify: `lib/docStyles.ts`, `README.md` (se reescribe, corto y en español), `types.ts`
- Delete: lo que haya quedado sin uso. Se busca con `grep` de cada export y archivo viejo.

- [ ] **Step 1: Limpieza.** Se borran:
  - todos los `// @ts-nocheck`;
  - `appointmentAfterRenewal` y su test, si ya no se usa;
  - las clases o archivos sin uso.

  `README.md`: qué es la app, cómo correrla (`npm install`, `npm run dev`, `npm test`), variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`) y dónde están el diseño y la función de avisos.
- [ ] **Step 2: Chequeos.** Run: `npx tsc --noEmit`, `npm test`, `npm run build` y `grep -rn "tailwind\|alert(" --include=*.tsx --include=*.html .` (sin `node_modules`). Expected: sin errores, PASS, build ok y sin coincidencias.
- [ ] **Step 3: Navegador, solo lectura, con la sesión del usuario.**
  - Todas las pantallas a 375, 768 y 1280 px, comparadas con el prototipo.
  - Review Focus 1: el modelo más largo, proveedores y secciones, sin desborde (`document.documentElement.scrollWidth === innerWidth`).
  - Review Focus 5: `/#/fleet/no-existe`.
  - Hojas abiertas y cerradas sin guardar.
  - Consola sin errores nuevos.
- [ ] **Step 4: Prueba de guardado.** Solo con el OK del usuario: crear "PRUEBA DISEÑO", renovarle un documento, cargarle un trabajo, editarlo, borrarlo y eliminar la unidad. Comprobar que quedó todo como antes.
- [ ] **Step 5: Commit** `"Limpieza del rediseño"`.

---

### Task 15: Vista previa y publicación

- [ ] **Step 1:** después de la revisión final de la rama, `git push -u origin rediseno-interfaz`. Vercel arma una vista previa; su URL se toma del estado del commit en GitHub: `curl -s https://api.github.com/repos/AdminElProgreso/administracion-flota/commits/<sha>/status`, campo `target_url`.
- [ ] **Step 2:** el usuario la prueba en su celular. Con su OK, superpowers:finishing-a-development-branch: merge a `main`, `npm test` sobre el resultado y `git push origin main`.
- [ ] **Step 3:** confirmar que el deploy de producción terminó ("Deployment has completed").
