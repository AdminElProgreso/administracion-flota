# Arreglos de la crítica de impeccable: plan de trabajo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** resolver los cinco problemas prioritarios de la crítica de impeccable del 7/11/2026 y sacar el decorado que el usuario descartó, sin tocar las reglas compartidas de los avisos.

**Cómo:** la lógica nueva va a `lib/` con tests de Vitest (TDD de superpowers). Lo visual se verifica con el detector de impeccable en el navegador, que hace de prueba roja y verde, y con un test de contraste sobre los colores de `styles/base.css`. Antes de cada edición de interfaz se lee la guía `craft-floor.md` de impeccable.

**Técnica:** React 19, Vite, TypeScript, CSS propio, Vitest. Detector: `.claude/skills/impeccable/scripts/impeccable` (motor 0.1.18).

**Spec:** `.impeccable/critique/2026-11-07T12-11-24Z__pages.md` (la crítica), `PRODUCT.md` y las respuestas del usuario del 7/11/2026, copiadas abajo.

## Global Constraints

- Respuestas del usuario: arreglar **los cinco** problemas prioritarios; **ventana fija de 30 días** para decidir los colores; **sacar las etiquetas sobre los títulos y el resplandor con rayas de Inicio**.
- No tocar `supabase/functions/` (incluido `_shared/`) ni el esquema de la base. La función de avisos sigue usando los días de cada persona.
- `DISPLAY_WINDOW_DAYS = 30`: decide "Por vencer" en Inicio, Vehículos, Agenda, la ficha y las hojas. Los días de cada persona deciden solo el aviso al celular y los textos que hablan de ese aviso.
- Texto con contraste de al menos 4,5:1 contra su fondo real. Anillo de foco de al menos 3:1.
- Castellano rioplatense con voseo. Sin anglicismos nuevos.
- Los tests no importan `supabase.ts` ni componentes; solo `lib/`, `supabase/functions/_shared/` y archivos de `public/` o `styles/` leídos como texto.
- Antes de editar interfaz: leer `.claude/skills/impeccable/reference/craft-floor.md`.
- Sin hook de impeccable en esta sesión: el detector se corre a mano al terminar cada tarea visual.
- Rama `demo-impeccable`. Cada commit termina con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sin push.
- Nada escribe datos de producción: las pruebas en la app son de solo lectura.

## Review Focus

1. Una unidad de baja o un generador nunca cuentan como "sin fecha" ni entran al filtro "Sin fecha". Test en la tarea 2.
2. Un documento con turno vigente y sin vencimiento está en "Turno", no en "Sin fecha". Test en la tarea 2.
3. El "+" abierto desde una ficha preselecciona esa unidad. Desde otra pantalla propone lo más urgente o pide elegir, nunca toma el primero de la lista. Test en la tarea 3.
4. Un aviso con etiqueta inesperada abre la misma dirección que hoy, sin `?doc=`. Test en la tarea 4.
5. La ficha con `?doc=` inválido, o de un generador, se muestra igual y no desplaza nada. Test en la tarea 4.

---

### Task 1: Ventana fija de 30 días para lo que se ve

**Files:**
- Create: `lib/display.ts`, `tests/display.test.ts`
- Modify: `lib/docCard.ts`, `tests/docCard.test.ts`, `pages/Dashboard.tsx`, `pages/Fleet.tsx`, `pages/VehicleDetail.tsx`, `pages/Calendar.tsx`, `components/sheets/DocSheet.tsx`, `pages/Settings.tsx`

**Interfaces:**
- Produces: `DISPLAY_WINDOW_DAYS = 30`; `displayPrefs(prefs: AlertPrefs): AlertPrefs` (Seguro, VTV y Patente en 30; turnos y switches sin cambio); `URGENCY: Record<DocState, number>` = `{ expired: 0, expiring: 1, appointment: 2, 'no-date': 3, ok: 4 }`.

- [ ] **Step 1: Tests que fallan**

```ts
// tests/display.test.ts
const ones: AlertPrefs = { ...DEFAULT_PREFS, thresholds: { Seguro: 1, VTV: 1, Patente: 1, appointments: 7 } };
it('la ventana de la app es de 30 días para todos', () => {
  expect(displayPrefs(ones).thresholds).toEqual({ Seguro: 30, VTV: 30, Patente: 30, appointments: 7 });
  expect(displayPrefs(ones).enabled).toEqual(ones.enabled);
});
it('una VTV a 2 días se ve por vencer aunque el aviso sea de 1 día', () => {
  const v = vehicle('a', { vtv_expiration: '2026-11-05' });
  expect(vehicleDocs(v, ones, T)[1].state).toBe('ok');
  expect(vehicleDocs(v, displayPrefs(ones), T)[1].state).toBe('expiring');
});
// tests/docCard.test.ts
it('por vencer en la app, pero el aviso todavía no empezó', () => {
  const doc = docStatus('VTV', '2026-11-13', null, 30, T);
  const prefs = (n: number) => ({ ...DEFAULT_PREFS, thresholds: { ...DEFAULT_PREFS.thresholds, VTV: n } });
  expect(docCardText(doc, prefs(1)).hint).toBe('Te empezamos a avisar 1 día antes');
  expect(docCardText(doc, prefs(15)).hint).toBe('Te avisamos todos los días hasta que la renueves');
});
```

- [ ] **Step 2: Correr y ver que fallan:** `npx vitest run tests/display.test.ts tests/docCard.test.ts`. Esperado: FAIL, `displayPrefs` no existe y el hint dice "Te avisamos todos los días…".
- [ ] **Step 3: Implementar** `lib/display.ts`. En `docCardText`, con estado `expiring` y `daysToExpiration` mayor que los días de la persona, el hint es el de "Te empezamos a avisar".
- [ ] **Step 4: Pantallas.** Las pantallas usan `displayPrefs(prefs)` en todo cálculo de estado: `attentionList`, `vehicleDocs`, `agendaEvents` y el `docStatus` de DocSheet. `docCardText` recibe los días de la persona.
- [ ] **Step 5: Texto de Ajustes.** En `Settings.tsx`, al final de la ayuda de "Avisos de vencimiento", agregar: "En la app, lo que vence en los próximos 30 días se ve como «Por vencer», igual para todos."
- [ ] **Step 6: Correr todo:** `npm test` y `npx tsc --noEmit`. Esperado: todo en verde, sin errores de tipos.
- [ ] **Step 7: Commit:** "Ventana fija de 30 días para los estados que se ven".

### Task 2: Que se vea lo que falta cargar

**Files:**
- Modify: `lib/home.ts`, `tests/home.test.ts`, `lib/vehicles.ts`, `tests/vehicles.test.ts`, `pages/Dashboard.tsx`, `pages/Fleet.tsx`, `pages/Calendar.tsx`, `styles/components.css`

**Interfaces:**
- Consumes: `displayPrefs`, `URGENCY` (tarea 1).
- Produces: `missingDates(vehicles: VehicleRow[], today: string): number`; `attentionSummary(items, missing: number)`; `statusLink(items: number, missing: number): string`; `VehicleFilter` suma `'sinfecha'`; `filterVehicles(list, filter, query, today)`; `countByFilter(list, today)`; `sortByUrgency<T extends VehicleRow>(list: T[], prefs: AlertPrefs, today: string): T[]`.

- [ ] **Step 1: Tests que fallan**

```ts
// tests/home.test.ts
it('cuenta los documentos sin fecha, sin bajas ni generadores ni turnos', () => {
  const fleet = [vrow('a'), vrow('b', { status: 'Baja' }), vrow('c', { tipo: 'generator' }),
    vrow('d', { vtv_expiration: '2027-01-10', insurance_appointment: '2026-11-20' })];
  expect(missingDates(fleet, T)).toBe(4); // a: 3, d: patente
});
it('sin fechas no dice que todo está al día', () => {
  expect(attentionSummary([], 48)).toEqual({ title: '48 documentos sin fecha', detail: 'No generan avisos hasta que cargues la fecha' });
  expect(attentionSummary([], 1).title).toBe('1 documento sin fecha');
  expect(attentionSummary([], 0).title).toBe('Toda la documentación está al día');
});
it('suma los sin fecha al detalle', () => {
  // mismos items del test existente
  expect(attentionSummary(items, 3).detail).toBe('2 vencidos · 1 por vencer · 1 con turno · 3 sin fecha');
});
it('la tarjeta de estado lleva a lo que hay que hacer', () => {
  expect(statusLink(0, 48)).toBe('/fleet?filtro=sinfecha');
  expect(statusLink(2, 48)).toBe('/calendar');
  expect(statusLink(0, 0)).toBe('/calendar');
});
// tests/vehicles.test.ts: los tests existentes pasan T como cuarto argumento
it('filtro sin fecha: solo unidades activas o en taller con algún documento sin fecha', () => {
  const l = [vrow('a'), vrow('b', { status: 'Baja' }), vrow('c', { tipo: 'generator' }),
    vrow('d', { vtv_expiration: '2027-01-10', insurance_expiration: '2027-01-10', patente_expiration: '2027-01-10' })];
  expect(ids(filterVehicles(l, 'sinfecha', '', T))).toEqual(['a']);
  expect(countByFilter(l, T).sinfecha).toBe(1);
});
it('ordena por urgencia y deja las bajas al final', () => {
  const l = [vrow('ok', { vtv_expiration: '2027-06-01', insurance_expiration: '2027-06-01', patente_expiration: '2027-06-01' }),
    vrow('sin'), vrow('baja', { status: 'Baja', vtv_expiration: '2026-10-01' }), vrow('gen', { tipo: 'generator' }),
    vrow('vence', { vtv_expiration: '2026-11-20' }), vrow('vencida', { vtv_expiration: '2026-10-01' })];
  expect(ids(sortByUrgency(l, displayPrefs(DEFAULT_PREFS), T))).toEqual(['vencida', 'vence', 'sin', 'ok', 'gen', 'baja']);
});
```

- [ ] **Step 2: Correr y ver que fallan:** `npx vitest run tests/home.test.ts tests/vehicles.test.ts`. Esperado: FAIL, faltan las funciones y el filtro.
- [ ] **Step 3: Implementar.** Una unidad cuenta en `missingDates` y en el filtro si no es generador, no está de baja y tiene algún documento en estado `no-date`. En `sortByUrgency`, cada unidad toma el `URGENCY` más bajo de sus documentos; generadores después y bajas al final; empate por días al evento más cercano; orden estable.
- [ ] **Step 4: Pantallas.**
  - **Inicio:**
    - el resumen y el enlace de la tarjeta de estado usan `missingDates`;
    - el ícono es `edit_calendar` cuando solo faltan fechas;
    - "Necesitan atención" vacío con fechas faltantes muestra "Faltan fechas", el texto "{n} documentos no tienen fecha de vencimiento y no generan avisos." y el botón "Cargar fechas" a `/fleet?filtro=sinfecha`.
  - **Vehículos:**
    - filtro "Sin fecha" entre "En taller" y "De baja";
    - lista ordenada con `sortByUrgency`.
  - **Agenda:** vacía con fechas faltantes muestra "Faltan fechas", el texto "{n} documentos no tienen fecha de vencimiento: cuando las cargues, aparecen acá." y el mismo botón.
  - **Estilos:** `.st-none` pasa al tono de atención (`--naranja-700` sobre `--naranja-100`, 4,85:1).
- [ ] **Step 5: Correr todo:** `npm test` y `npx tsc --noEmit`. Esperado: verde.
- [ ] **Step 6: Verificar en la app**, solo lectura y a 375 px:
  - Inicio dice "48 documentos sin fecha";
  - el filtro muestra 16;
  - Agenda muestra "Faltan fechas".
- [ ] **Step 7: Commit:** "Inicio, Vehículos y Agenda muestran lo que falta cargar".

### Task 3: Cargar fechas sin fecha inventada

**Files:**
- Modify: `lib/docForm.ts`, `tests/docForm.test.ts`, `lib/vehicles.ts`, `tests/vehicles.test.ts`, `components/sheets/DocSheet.tsx`, `components/sheets/QuickSheet.tsx`

**Interfaces:**
- Produces: `currentExpiryNote(expiration: string | null, today: string): string | null`; `vehicleIdFromPath(pathname: string): string | undefined`. `renewProposal` queda como valor del botón "+1 año".

- [ ] **Step 1: Tests que fallan**

```ts
// tests/docForm.test.ts
it('muestra la fecha que tenía el documento', () => {
  expect(currentExpiryNote(null, T)).toBeNull();
  expect(currentExpiryNote('2026-12-01', T)).toBe('Vence el 01/12/2026');
  expect(currentExpiryNote('2026-10-01', T)).toBe('Venció el 01/10/2026');
});
// tests/vehicles.test.ts
it('reconoce la ficha abierta', () => {
  const id = '3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
  expect(vehicleIdFromPath(`/fleet/${id}`)).toBe(id);
  expect(vehicleIdFromPath('/fleet')).toBeUndefined();
  expect(vehicleIdFromPath('/fleet/no-existe')).toBeUndefined();
  expect(vehicleIdFromPath('/')).toBeUndefined();
});
```

- [ ] **Step 2: Correr y ver que fallan:** `npx vitest run tests/docForm.test.ts tests/vehicles.test.ts`. Esperado: FAIL, faltan las dos funciones.
- [ ] **Step 3: Implementar las funciones.**
- [ ] **Step 4: DocSheet.**
  - **Al renovar:**
    - la fecha arranca vacía y "Guardar" queda deshabilitado mientras esté vacía;
    - con fecha previa se muestra `currentExpiryNote` y un botón "+1 año" que carga `renewProposal`;
    - cambiar de unidad o de documento vacía la fecha.
  - **Sin unidad fija:**
    - la unidad inicial es la pedida, o la del documento más urgente;
    - si no hay ninguna, el selector muestra "Elegí un vehículo", sin fecha y con "Guardar" deshabilitado;
    - se quita `?? options[0]`.
  - Los turnos no cambian.
- [ ] **Step 5: QuickSheet.** Con `useLocation`, los pedidos de trabajo, renovación y turno llevan `vehicleId: vehicleIdFromPath(pathname)` cuando hay una ficha abierta.
- [ ] **Step 6: Correr todo:** `npm test` y `npx tsc --noEmit`. Esperado: verde.
- [ ] **Step 7: Verificar en la app**, solo lectura, abriendo y cerrando con Escape y sin guardar:
  - "Cargar fecha" abre vacía y con "Guardar" deshabilitado;
  - el "+" desde una ficha trae esa unidad;
  - el "+" desde Inicio propone lo más urgente o pide elegir.
- [ ] **Step 8: Commit:** "La carga de fechas no propone fechas inventadas".

### Task 4: Del aviso al documento

**Files:**
- Create: `lib/ficha.ts`, `tests/ficha.test.ts`, `tests/swPush.test.ts`
- Modify: `public/sw-push.js`, `pages/VehicleDetail.tsx`, `components/rows.tsx`, `styles/screens.css`

**Interfaces:**
- Consumes: `URGENCY` (tarea 1).
- Produces: `docFromSearch(search: string): DocType | null`; `orderDocs(docs: DocStatus[]): DocStatus[]`, estable; `hasUrgentDoc(docs: DocStatus[]): boolean`, verdadero con algún vencido o por vencer.

- [ ] **Step 1: Tests que fallan**

```ts
// tests/ficha.test.ts
it('lee el documento de la dirección', () => {
  expect(docFromSearch('?doc=VTV')).toBe('VTV');
  expect(docFromSearch('?doc=vtv')).toBeNull();
  expect(docFromSearch('')).toBeNull();
});
it('ordena por urgencia y respeta el orden de siempre en empates', () => {
  const docs = vehicleDocs(vehicle('a', { patente_expiration: '2026-10-01', insurance_expiration: '2027-06-01' }), displayPrefs(DEFAULT_PREFS), T);
  expect(orderDocs(docs).map(d => d.type)).toEqual(['Patente', 'VTV', 'Seguro']);
  expect(hasUrgentDoc(docs)).toBe(true);
  expect(hasUrgentDoc(vehicleDocs(vehicle('b'), DEFAULT_PREFS, T))).toBe(false);
});
// tests/swPush.test.ts: carga public/sw-push.js con node:vm, con self, registration y clients falsos
it('el aviso de un documento abre su tarjeta', () =>
  expect(push({ url: '/#/fleet/v1', tag: 'v1-VTV' }).data.url).toBe('https://flota.test/#/fleet/v1?doc=VTV'));
it('con otra etiqueta la dirección queda igual', () =>
  expect(push({ url: '/#/fleet', tag: 'fleet-alert' }).data.url).toBe('https://flota.test/#/fleet'));
it('el texto por defecto usa voseo', () =>
  expect(push(null).body).toBe('Tenés un aviso nuevo de la flota.'));
```

- [ ] **Step 2: Correr y ver que fallan:** `npx vitest run tests/ficha.test.ts tests/swPush.test.ts`. Esperado: FAIL.
- [ ] **Step 3: Implementar.**
  - En `sw-push.js`, `?doc=TIPO` se agrega solo si la etiqueta termina en `-Seguro`, `-VTV` o `-Patente`, y la dirección es de una ficha y no tiene `?`.
  - En `lib/ficha.ts`, las tres funciones.
- [ ] **Step 4: Ficha.**
  - Documentos con `orderDocs`.
  - Con `?doc=` válido, la tarjeta del documento (`id="doc-VTV"`) se centra en pantalla y queda resaltada 2,4 s; con movimiento reducido, sin animación.
  - Con `hasUrgentDoc`, "Registrar trabajo" pasa a `btn-ghost`.
  - Cabecera más compacta debajo de 900 px.
- [ ] **Step 5: Filas.** `AttentionRow` y `EventRow` enlazan a `/fleet/{id}?doc={tipo}`.
- [ ] **Step 6: Correr todo:** `npm test` y `npx tsc --noEmit`. Esperado: verde.
- [ ] **Step 7: Verificar en la app** a 375×812:
  - con `/#/fleet/{id}?doc=Patente`, la tarjeta de patente queda centrada y resaltada;
  - la primera tarjeta de documento empieza antes de y=540 (hoy, 597).
- [ ] **Step 8: Commit:** "El aviso lleva al documento y la ficha prioriza lo urgente".

### Task 5: Contraste para leer al sol

**Files:**
- Create: `tests/contrast.test.ts`
- Modify: `styles/base.css`, `styles/screens.css`, `styles/layout.css`

**Interfaces:** ninguna. Lee `styles/base.css` como texto.

- [ ] **Step 1: Test que falla.** `tests/contrast.test.ts` lee los tokens `--nombre:#hex` de `:root` y calcula el contraste WCAG. Exige al menos 4,5:1 en estos pares:
  - `--tinta-4` sobre `--blanco`, `--papel`, `--none-bg` y `--linea-2`;
  - `--ok` sobre `--ok-bg`, y `--none` sobre `--none-bg`;
  - `--warn` sobre `--warn-bg`, `--bad` sobre `--bad-bg` y `--appt` sobre `--appt-bg`;
  - `--naranja-700` sobre `--naranja-100`, y `#FFFFFF` sobre `--naranja-700`.
- [ ] **Step 2: Correr y ver que falla:** `npx vitest run tests/contrast.test.ts`. Esperado: FAIL en `--tinta-4` (3,31), `--ok` (4,41) y `--none` (4,43).
- [ ] **Step 3: Implementar.**
  - **Colores:** `--tinta-4:#686D64` (4,62 sobre `--linea-2`), `--ok:#12733A` (5,22) y `--none:#62675F` (5,06).
  - **Ajustes puntuales:**
    - `.vdoc-name` sin opacidad;
    - `.sb-new` con fondo `--naranja-700` (5,81);
    - `:focus-visible` con borde sólido `--verde-700` (5,44).
- [ ] **Step 4: Correr todo:** `npm test`. Esperado: verde.
- [ ] **Step 5: Detector en el navegador**, a 375 y 1280 px, en las seis pantallas, inyectando `detect.js` con `impeccable live-server --background` y cerrando con `live-server stop --keep-inject`. Esperado: 0 de `low-contrast`, salvo el encabezado de Inicio, que se arregla en la tarea 6.
- [ ] **Step 6: Commit:** "Contraste para leer al sol".

### Task 6: Encabezados sobrios

**Files:**
- Modify: `components/ui.tsx`, `pages/Fleet.tsx`, `pages/Calendar.tsx`, `pages/Maintenance.tsx`, `pages/Settings.tsx`, `pages/VehicleDetail.tsx`, `styles/screens.css`

**Interfaces:**
- Produces: `PageHead({ title, action })`, ya sin `eyebrow`.

- [ ] **Step 1: Prueba roja con el detector.** `impeccable detect` en el navegador sobre Vehículos, Agenda, Taller, Ajustes, la ficha e Inicio. Esperado:
  - `kicker-above-heading` en 4 pantallas;
  - `hero-eyebrow-chip` en la ficha, en escritorio;
  - `radial-spotlight-glow` y `repeating-stripes-gradient` en Inicio.
- [ ] **Step 2: Implementar.**
  - `PageHead` sin etiqueta, en las cuatro pantallas.
  - **Ficha:** el tipo y la sección pasan a una línea debajo del título (`.vh-meta`: 14 px, `--tinta-3`, sin mayúsculas forzadas).
  - **Inicio:**
    - `.hero` con fondo liso `--verde-800`, sin `::after`;
    - `.hero-date` y `.hs-text small` en blanco pleno (6,15:1 sobre la tarjeta).
  - El rótulo "Gasto de {mes}" de Taller se queda: está sobre un número, no sobre un título.
  - El ingreso conserva el sol y los surcos (fuera de alcance).
- [ ] **Step 3: Correr todo:** `npm test` y `npx tsc --noEmit`. Esperado: verde.
- [ ] **Step 4: Prueba verde con el detector.** Esperado: 0 de esas cuatro reglas y 0 de `low-contrast` en Inicio.
- [ ] **Step 5: Commit:** "Encabezados sin etiquetas ni resplandor".

### Task 7: Pasada final y nueva medición

**Files:**
- Modify: `styles/screens.css`, `pages/Calendar.tsx`

- [ ] **Step 1: Pendientes de la crítica.** `impeccable critique-storage latest "pages" --json`. Verificar uno por uno el P0, los dos P1 y los dos P2.
- [ ] **Step 2: Polish** según `reference/polish.md`:
  - `.doc` sin el borde lateral de 5 px; el estado ya lo dice la etiqueta. Es una regla prohibida por impeccable (`side-tab`).
  - En Agenda, el título del día pasa de `h3` a `h2` (`skipped-heading`).
  - Recorrer de solo lectura las seis pantallas a 375 y 1440 px. Mirar estados vacíos, carga y error, y la consola sin errores.
- [ ] **Step 3: Detector completo.**
  - CLI sobre `pages components index.html`;
  - navegador en las seis pantallas y los dos tamaños.
  - Esperado: sin `low-contrast`, `kicker-above-heading`, `hero-eyebrow-chip`, `radial-spotlight-glow`, `repeating-stripes-gradient`, `side-tab` ni `skipped-heading`.
- [ ] **Step 4: Correr todo:** `npm test`, `npx tsc --noEmit` y `npm run build`. Esperado: verde, y la compilación sin errores.
- [ ] **Step 5: Commit:** "Pasada final de impeccable". Después: `impeccable critique-storage close "pages" "<snapshot_file>"`.
- [ ] **Step 6: Nueva medición.** `/impeccable critique` de todas las pantallas, con los dos subagentes. Informar la tendencia: 27/40 contra el nuevo puntaje.
