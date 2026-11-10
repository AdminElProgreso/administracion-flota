# Segunda vuelta de impeccable: Inicio, colores y chips

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** resolver tres de los problemas P2 de la segunda crítica de impeccable:
- Inicio entierra la acción;
- el naranja dice cuatro cosas;
- los chips del celular quedan tapados.

**Cómo:** la lógica de textos de Inicio va a `lib/home.ts` con tests (TDD). Lo visual se verifica con el detector de impeccable en el navegador, con medidas del DOM y con dos tests que leen el CSS como texto: contraste y "naranja solo para crear".

**Técnica:** React 19, Vite, TypeScript, CSS propio, Vitest. Detector: `.claude/skills/impeccable/scripts/impeccable`.

**Spec:** `.impeccable/critique/2026-11-10T11-35-18Z__pages.md` (problemas 2, 3 y 5) y la propuesta que aprobó el usuario el 10/11/2026, copiada abajo.

## Global Constraints

- **Propuesta aprobada:**
  - **Inicio:**
    - el título grande es el estado ("48 documentos sin fecha", "3 documentos necesitan atención", "Toda la documentación al día");
    - abajo va la explicación en una línea, y el botón de la acción va dentro del encabezado;
    - el saludo y la fecha van en una línea chica: "Buen día · martes 10 de noviembre";
    - los indicadores van en una franja compacta, de la mitad de alto, y un valor vacío se dice en palabras;
    - en el celular, "Necesitan atención" va antes que los indicadores.
  - **Colores:**
    - el naranja queda solo para crear: el botón "+" y "Nuevo registro";
    - "Sin fecha" pasa a gris con borde punteado;
    - "En taller" pasa a ámbar;
    - "Reparación" pasa a un tono neutro.
  - **Chips:** pasan a renglones en vez de quedar ocultos de costado, y a 44 px de alto en el celular.
- **Etiquetas y títulos:** sin etiquetas en mayúsculas ni espaciadas arriba de los títulos (regla de impeccable). La línea del saludo va en minúscula normal, sin espaciado extra.
- No tocar `supabase/functions/` ni el esquema de la base.
- Texto con contraste de al menos 4,5:1 contra su fondo real. Bordes y anillo de foco de al menos 3:1.
- Castellano rioplatense con voseo.
- Los tests no importan `supabase.ts` ni componentes; solo `lib/`, `supabase/functions/_shared/` y archivos leídos como texto.
- Antes de editar interfaz: leer `.claude/skills/impeccable/reference/craft-floor.md`.
- Las pruebas en la app son de solo lectura: nada escribe datos de producción.
- Rama `vuelta-2-inicio-colores`. Cada commit termina con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Sin push.

## Review Focus

1. Inicio con cada combinación (con atención y sin fecha, solo atención, solo sin fecha, nada) muestra el título, la explicación y la acción que corresponden. Test en la tarea 1.
2. Los indicadores vacíos (0 en taller, $ 0 de gasto, nada en 30 días) se dicen en palabras, y los que tienen valor muestran el número. Test en la tarea 1.
3. El saludo cambia según la hora (mañana, tarde y noche) y la fecha va en minúscula. Test en la tarea 1.
4. Ninguna regla de CSS fuera de las de crear usa el naranja. Test en la tarea 2.
5. A 320 y 375 px los chips no se cortan ni desbordan. Se mide en la tarea 3.

---

### Task 1: Inicio pone primero lo que hay que hacer

**Files:**
- Modify: `lib/home.ts`, `tests/home.test.ts`, `pages/Dashboard.tsx`, `components/ui.tsx` (Kpi), `styles/screens.css`, `styles/components.css`

**Interfaces:**
- Produces:
  - `greetingLine(now: Date, today: string): string`;
  - `statusAction(items: number, missing: number): { label: string; to: string } | null`;
  - `homeKpis(input: { operating: number; inFleet: number; inShop: string[]; monthName: string; monthTotal: number; monthCount: number; next: { days: number; type: string; model: string } | null }): HomeKpi[]`, where `HomeKpi = { icon: string; label: string; value: string; sub: string; to: string; words: boolean }`.

- [ ] **Step 1: Tests que fallan**

```ts
it('saludo y fecha en una línea', () => {
  expect(greetingLine(new Date(2026, 10, 10, 9), '2026-11-10')).toBe('Buen día · martes 10 de noviembre');
  expect(greetingLine(new Date(2026, 10, 10, 15), '2026-11-10')).toBe('Buenas tardes · martes 10 de noviembre');
  expect(greetingLine(new Date(2026, 10, 10, 22), '2026-11-10')).toBe('Buenas noches · martes 10 de noviembre');
});
it('la acción del encabezado', () => {
  expect(statusAction(0, 48)).toEqual({ label: 'Cargar fechas', to: '/fleet?filtro=sinfecha' });
  expect(statusAction(3, 48)).toEqual({ label: 'Ver la agenda', to: '/calendar' });
  expect(statusAction(3, 0)).toEqual({ label: 'Ver la agenda', to: '/calendar' });
  expect(statusAction(0, 0)).toBeNull();
});
it('indicadores vacíos en palabras', () => {
  const k = homeKpis({ operating: 17, inFleet: 17, inShop: [], monthName: 'noviembre', monthTotal: 0, monthCount: 0, next: null });
  expect(k.map(x => [x.label, x.value, x.sub, x.words])).toEqual([
    ['Operativos', '17', 'de 17 en la flota', false],
    ['En taller', 'Ninguno', 'Toda la flota trabajando', true],
    ['Gasto de noviembre', 'Sin gastos', 'Ningún trabajo cargado', true],
    ['Próximo vencimiento', 'Nada', 'en los próximos 30 días', true],
  ]);
});
it('indicadores con valores', () => {
  const k = homeKpis({ operating: 15, inFleet: 17, inShop: ['HILUX', 'F-700'], monthName: 'noviembre', monthTotal: 125000, monthCount: 2,
    next: { days: 3, type: 'VTV', model: 'SAVEIRO' } });
  expect(k.map(x => [x.value, x.sub, x.words])).toEqual([
    ['15', 'de 17 en la flota', false], ['2', 'HILUX, F-700', false], ['$ 125.000', '2 trabajos', false], ['3 días', 'VTV · SAVEIRO', false],
  ]);
});
```

- [ ] **Step 2: Correr y ver que fallan:** `npx vitest run tests/home.test.ts`. Esperado: FAIL, faltan las funciones.
- [ ] **Step 3: Implementar las funciones en `lib/home.ts`.**
  - Usar `greeting`, `longDate` y `money` de `lib/format.ts`, y `nextExpiryLabel`.
  - Los `to` de los indicadores son los de hoy.
  - El texto "30" sale de `DISPLAY_WINDOW_DAYS`.
- [ ] **Step 4: Inicio.**
  - **Encabezado:**
    - `<p>` con `greetingLine`;
    - el `h1` con `summary.title`;
    - `<p>` con `summary.detail`;
    - el botón de `statusAction`, si hay, como `Link` con estilo de botón blanco sobre el verde;
    - sin la tarjeta vidriada `.hero-status`.
  - **Indicadores:**
    - franja compacta con `homeKpis`, sin el bloque del ícono grande;
    - los valores en palabras van en Barlow y no en Bebas;
    - en escritorio, cuatro en una fila;
    - en el celular, dos por fila y la mitad de alto que hoy.
  - **Orden en el celular (menos de 900 px):** encabezado, aviso de contraseña, "Para hoy", "Necesitan atención", indicadores y "Últimos trabajos".
- [ ] **Step 5: Correr todo:** `npm test`, `npx tsc --noEmit` y `npm run build`. Esperado: verde.
- [ ] **Step 6: Verificar en la app** (solo lectura, a 375×812 y 1440×900):
  - el botón "Cargar fechas" del encabezado termina antes de y=400 en el celular;
  - "Necesitan atención" está arriba de los indicadores en el celular;
  - la franja de indicadores mide menos de 160 px en el celular (hoy, 295);
  - detector de impeccable en Inicio: 0 hallazgos.
- [ ] **Step 7: Commit:** "Inicio pone primero lo que hay que hacer".

### Task 2: El naranja solo para crear

**Files:**
- Create: `tests/orange.test.ts`
- Modify: `styles/components.css`, `components/rows.tsx`, `tests/contrast.test.ts`, y cualquier otro uso que aparezca al buscar `naranja` y `tone-orange`

- [ ] **Step 1: Tests que fallan.**
  - `tests/orange.test.ts` lee todos los `styles/*.css`. Toda regla que use `--naranja-` tiene que tener un selector de `:root`, `.fab` o `.sb-new`. Hoy falla con `.tone-orange`, `.st-none` y `.pill.s-shop`.
  - En `tests/contrast.test.ts`, agregar los pares `--none` sobre `--blanco` y `--tinta-2` sobre `--linea-2`, con al menos 4,5:1. Agregar también `--tinta-4` sobre `--blanco` como borde, con al menos 3:1.
- [ ] **Step 2: Correr y ver que fallan:** `npx vitest run tests/orange.test.ts tests/contrast.test.ts`.
- [ ] **Step 3: Implementar.**
  - `.st-none`: texto `var(--none)`, fondo transparente o blanco y `border:1.5px dashed var(--tinta-4)`, en las cajitas de documento (`.vdoc`) y en las etiquetas (`.badge`). Las tarjetas `.doc` de la ficha conservan su borde normal.
  - `.pill.s-shop`: `--warn` sobre `--warn-bg`.
  - `.tone-orange` pasa a `.tone-neutral` (`--tinta-2` sobre `--linea-2`), usado por "Reparación".
- [ ] **Step 4: Correr todo:** `npm test` y `npx tsc --noEmit`. Esperado: verde.
- [ ] **Step 5: Detector en Vehículos, la ficha, Taller e Inicio.** Esperado: 0 hallazgos.
- [ ] **Step 6: Commit:** "El naranja queda solo para crear".

### Task 3: Filtros completos en el celular, y pasada final

**Files:**
- Modify: `styles/components.css`

- [ ] **Step 1: Medir la prueba roja en la app.** A 375×812 en `/#/fleet?filtro=sinfecha`, `.chips` tiene `scrollWidth > clientWidth`, o un chip termina fuera de la pantalla.
- [ ] **Step 2: Implementar.**
  - `.chips` pasa a renglones (`flex-wrap:wrap`), sin desplazamiento horizontal ni barra oculta.
  - `.chip` mide 44 px de alto debajo de 900 px.
- [ ] **Step 3: Prueba verde.** A 320 y 375 px:
  - `scrollWidth == clientWidth`;
  - todos los chips quedan dentro de la pantalla;
  - el chip activo se ve.
- [ ] **Step 4: Pasada final.**
  - Detector CLI sobre `pages components index.html`.
  - Detector en el navegador sobre las seis pantallas a 375×812 y 1440×900.
  - `npm test`, `npx tsc --noEmit` y `npm run build`.
  - Esperado: 0 hallazgos y todo verde.
- [ ] **Step 5: Commit:** "Los filtros se ven completos en el celular".
