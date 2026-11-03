# Alertas de vencimientos: diseño

Fecha: 2026-11-03 · Estado: borrador para aprobación

## Para qué

Hoy los vencimientos de la flota (seguro, VTV, patente) se controlan a mano, en
papel. La app tiene que reemplazar ese control: a quien tenga la app en el
celular le tiene que llegar un aviso concreto, por ejemplo "La VTV del TOYOTA
HILUX (AA789XX) vence en 10 días", y las pantallas tienen que decir lo mismo que
los avisos. Cada usuario elige con cuántos días de anticipación quiere
enterarse.

La app todavía no se usa en el día a día, así que no hay costumbres que
respetar. La van a usar una o dos personas.

## Qué pasa hoy

- La función diaria (`supabase/functions/check-alerts/index.ts`) avisa todos los
  días dentro del plazo, pero deja de avisar cuando el documento vence, avisa
  por unidades dadas de baja y, si hay más de un aviso, manda un mensaje
  genérico ("Tienes N avisos próximos en tu flota").
- El service worker (`public/sw-push.js`) usa siempre la misma etiqueta
  (`fleet-alert-unique`), así que cada notificación pisa a la anterior aunque
  sea de otro vehículo.
- Un turno cargado, aunque sea de hace meses, hace que el documento se vea azul
  "EN PROCESO" en el panel y en la ficha aunque esté vencido
  (`pages/Dashboard.tsx:185-193`, `pages/VehicleDetail.tsx:117-121`).
- Cada pantalla usa su propio número fijo de días (panel 30 y 15, Flota 30,
  ficha 15). Ninguna usa los días que configuró el usuario.
- En Ajustes → Notificaciones, los interruptores por tipo solo se guardan en el
  navegador y la función no los lee. "Resumen Semanal" no existe. "Guardar
  Cambios" simula el guardado con una espera (`pages/Settings.tsx:325-337`).

## Objetivos

1. Una sola regla para el estado de cada documento, que usen igual las pantallas
   y la función de avisos.
2. Avisos diarios por documento desde que entra en el umbral hasta que se
   renueva, también después de vencido.
3. Cada aviso dice qué documento, qué vehículo y qué patente, y al tocarlo abre
   la ficha del vehículo.
4. Los días y los interruptores de cada usuario se guardan en la base y se
   respetan en todos lados.

## No objetivos (quedan para otra tanda)

- Asignar vehículos a personas: todos reciben los avisos de toda la flota.
- Avisos por email y el "Resumen semanal" (se quita de la pantalla).
- Cambiar el horario del aviso o hacerlo configurable.
- Proteger la función para que solo la llame la tarea diaria.
- Errores de carga que hoy se muestran como "Todo en orden" o listas vacías.
- Historial técnico en mobile, borrado de vehículos, mantenimientos, Tailwind por
  CDN, restos de AI Studio, campos decorativos de Ajustes → General y botones de
  Gestión de Datos.

## Sería un fracaso aunque funcione

- Un documento vencido, sin renovar y sin turno vigente, que deje de avisar o se
  vea verde o azul.
- Avisos por unidades dadas de baja.
- Que el celular y las pantallas digan cosas distintas del mismo documento.
- Que al volver a subir la función deje de correr la tarea diaria.
- Notificaciones acumuladas: más de una por documento en el celular.

## Reglas (decididas con el usuario)

### Estado de un documento

Para cada documento (Seguro, VTV, Patente) de un vehículo:

- `hoy`: fecha de hoy en Argentina.
- `diasVence`: días desde hoy hasta la fecha de vencimiento. 0 = vence hoy;
  negativo = ya venció.
- `diasTurno`: días desde hoy hasta la fecha del turno.
- `umbral`: días que el usuario configuró para ese tipo de documento.
- Turno vigente: turno con fecha de hoy o futura. Un turno pasado no cuenta.

| Estado | Condición | Color |
|---|---|---|
| Turno | hay turno vigente | azul |
| Vencido | sin turno vigente y `diasVence < 0` | rojo |
| Por vencer | sin turno vigente y `0 <= diasVence <= umbral` | amarillo |
| Al día | sin turno vigente y `diasVence > umbral` | verde |
| Sin fecha | sin turno vigente y sin fecha de vencimiento | gris, como hoy |

El turno vigente siempre gana, aunque el documento ya esté vencido: se ve azul y
no salen avisos de vencimiento, solo el recordatorio del turno (ver abajo). Si se
borra el turno, o la fecha del turno pasa sin que se renueve el documento, el
documento vuelve a su estado por fecha y vuelven los avisos de vencimiento.

Si hay un turno pasado y el documento queda en Por vencer o Vencido, se muestra
además la nota "Turno pasado".

### Avisos al celular

- Salen una vez por día, a las 9:00 de Argentina (tarea programada a las 12:00
  UTC, como indica `GUIDE_PUSH_NOTIFICATIONS.md`).
- A cada usuario con notificaciones activadas le llegan los avisos de toda la
  flota, con sus propios días e interruptores.
- No se avisa por vehículos con estado "Baja".
- Para cada documento:
  - Por vencer o Vencido: un aviso todos los días, hasta que se renueve (la
    fecha nueva queda fuera del umbral) o se cargue un turno.
  - Turno: un recordatorio todos los días desde el umbral de turnos hasta el día
    del turno inclusive (`0 <= diasTurno <= umbral de turnos`). Mientras haya
    turno vigente no sale el aviso de vencimiento de ese documento.
  - Al día o Sin fecha: nada.
- Interruptores de Ajustes:
  - "Vencimiento de Seguros", "Vencimiento de VTV" y "Vencimiento de Patentes"
    apagan los avisos de vencimiento de ese tipo.
  - "Recordatorio de Turnos" apaga los recordatorios de turno de todos los tipos.
- Una notificación por documento, con etiqueta `{idVehiculo}-{tipo}`: la de hoy
  reemplaza a la de ayer del mismo documento y vuelve a sonar.
- Al tocarla abre `/#/fleet/{idVehiculo}`.

### Textos de los avisos

Con `{DOC}` = "La VTV", "El seguro" o "La patente", y `{VEHICULO}` = modelo y
patente, por ejemplo `TOYOTA HILUX (AA789XX)`, o `TOYOTA HILUX (sin patente)`.

| Caso | Título | Texto |
|---|---|---|
| Por vencer, N ≥ 2 | Vencimiento de VTV | {DOC} del {VEHICULO} vence en N días. |
| Por vencer, N = 1 | Vencimiento de VTV | {DOC} del {VEHICULO} vence mañana. |
| Por vencer, N = 0 | Vencimiento de VTV | {DOC} del {VEHICULO} vence hoy. |
| Vencido, N = 1 | VTV vencida | {DOC} del {VEHICULO} venció ayer. |
| Vencido, N ≥ 2 | VTV vencida | {DOC} del {VEHICULO} venció hace N días. |
| Turno, N ≥ 2 | Turno de VTV | Turno de VTV del {VEHICULO} en N días. |
| Turno, N = 1 | Turno de VTV | Turno de VTV del {VEHICULO} mañana. |
| Turno, N = 0 | Turno de VTV | Turno de VTV del {VEHICULO} hoy. |

Títulos por tipo: "Vencimiento de seguro / Seguro vencido / Turno de seguro",
"Vencimiento de VTV / VTV vencida / Turno de VTV", "Vencimiento de patente /
Patente vencida / Turno de patente".

### Pantallas

Todas usan el estado de arriba con los días del usuario que está usando la app.
Si el usuario nunca guardó nada, se usan los valores por defecto.

- **Panel (Dashboard).**
  - "Atención Requerida" lista los documentos en Vencido, Por vencer y Turno de
    las unidades que no están de baja.
  - Orden: primero los vencidos (el más vencido arriba), después por vencer
    (menos días arriba), después turnos (el más próximo arriba).
  - Se muestran todos; hoy la lista corta en 5.
  - Etiquetas: "Venció hace N días", "Vence hoy", "Faltan N días", "Turno
    dd/mm". "EN PROCESO" desaparece.
  - Nota "Turno pasado" cuando corresponde.
  - El contador de alertas del panel cuenta lo mismo que la lista.
  - El cuadro de turnos de hoy y su modal de renovación quedan como están.
- **Flota.** Los tres círculos de cada vehículo (seguro, VTV, patente) toman el
  color del estado. Los generadores siguen sin círculos.
- **Ficha del vehículo.** Las tarjetas de Seguro, VTV y Patente toman el color
  del estado y dicen "Al día", "Faltan N días", "Vence hoy", "Venció hace N días"
  o "Turno: dd/mm/aaaa", más la nota "Turno pasado" cuando corresponde.
- **Calendario.**
  - Los colores siguen siendo por tipo de documento.
  - Etiqueta de cada vencimiento: "Vencido", "Vence hoy", "Faltan N días" en
    amarillo si está dentro del umbral, o "Próximo" si está fuera.
  - Etiqueta de cada turno: "Programado" si es hoy o futuro, "Turno pasado" si ya
    pasó.

### Renovar un documento

- Desde el modal de renovación del panel: como hoy, guarda la fecha nueva y
  borra el turno.
- Desde el modal de la ficha: si cambia la fecha de vencimiento y el turno no se
  tocó, el turno se borra. Si se cargó un turno nuevo en ese momento, se guarda
  ese.

### Ajustes

- Los umbrales (Seguro, VTV, Patente, Turnos) y los cuatro interruptores por tipo
  se guardan en `user_settings`. La base es la fuente de verdad, no el
  navegador.
- Valores por defecto: Seguro 15, VTV 30, Patente 10, Turnos 3, interruptores
  encendidos. Son los mismos en la app y en la función.
- Se quita "Resumen Semanal".
- No se guarda nada hasta que termina de cargar lo que ya hay en la base, para no
  pisar valores guardados.
- "Guardar Cambios" guarda de verdad y muestra el resultado real o el error. El
  guardado automático sigue.
- El interruptor "Activar Notificaciones Push" de cada dispositivo queda como
  está.

## Cambios en la base

Los corre el usuario en Supabase → SQL Editor. Solo agregan columnas; no borran
ni cambian nada existente.

```sql
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS insurance_alerts BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS vtv_alerts BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS patente_alerts BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS appointment_alerts BOOLEAN NOT NULL DEFAULT true;
```

## Cómo se construye

- **Lógica compartida.** La regla de estados, la selección de avisos y los
  textos van en un módulo puro dentro de `supabase/functions/_shared/`, sin
  imports ni APIs de Deno. Lo importan la función (Deno, con extensión `.ts`) y
  el frontend. Va ahí porque la CLI de Supabase solo empaqueta lo que está
  dentro de `supabase/functions/`. `tsconfig.json` excluye `supabase/`, pero
  los archivos que importa el frontend se chequean igual, y
  `allowImportingTsExtensions` ya está activo.
- **Fechas.** Las fechas viajan como texto `YYYY-MM-DD` y la diferencia de días
  se calcula con aritmética de fechas, sin horas. "Hoy" en la función es la
  fecha en `America/Argentina/Buenos_Aires`; en el navegador, la fecha local del
  dispositivo.
- **Tests.** Se usa Vitest, una nueva dependencia de desarrollo, sobre el módulo
  compartido. Casos:
  - estados en los bordes: hoy, ayer, umbral exacto, umbral + 1, sin fechas,
    turno hoy, pasado y futuro;
  - selección de avisos: Baja, interruptores, turno que reemplaza al
    vencimiento, ventana de turnos;
  - textos (singular y plural);
  - "hoy" en Argentina a las 21:00 y a las 23:59.
- **Service worker.** Usa la etiqueta que manda la función, con una por defecto
  si no viene.
- **Función.** Si falla una consulta a la base, responde con error en vez de
  seguir como si no hubiera datos. Manda los avisos en paralelo, no de a uno,
  para no pasarse del tiempo límite de la Edge Function.

## Despliegue y restricciones

- La base es la de producción, restaurada. Desde esta sesión no hay acceso
  directo: los cambios de SQL los corre el usuario.
- La función se vuelve a subir con la CLI de Supabase
  (`npx supabase functions deploy check-alerts`); el usuario inicia sesión en la
  CLI.
- Antes de subir la función hay que revisar en el panel si tiene "Verify JWT"
  activado y mantener el mismo ajuste. Si cambia, la tarea diaria puede dejar de
  funcionar.
- Hay que verificar que la tarea diaria exista (Integrations → Cron) y llame a
  `check-alerts` a las 12:00 UTC.
- El frontend está en Vercel, que publica solo con cada push a `main` del repo
  de GitHub (`AdminElProgreso/administracion-flota`). El push lo hace Claude
  desde esta sesión.
- El cambio del service worker llega a cada celular cuando la app se actualiza
  sola (PWA con autoUpdate). Hasta entonces, las notificaciones pueden seguir
  pisándose.
- Orden de despliegue: primero el SQL, después el frontend, al final la función.
  Si el frontend nuevo sale antes que el SQL, Ajustes falla al guardar.
- Volumen: unos 15 vehículos, con las fechas al día y nada vencido, según el
  usuario. Un aviso por documento por día, sin tope; si hiciera falta, se
  revisa más adelante.

## Queda a criterio de quien construya

- Nombres de archivos, funciones y hooks, y cómo se comparten los datos entre
  pantallas (react-query ya está en el proyecto).
- Clases e íconos exactos, manteniendo el estilo actual.
- Configuración de Vitest y ubicación de los tests.

## Decisiones de Claude (no las pidió el usuario; se pueden cambiar)

- Formato del texto con la patente entre paréntesis, para no repetir "patente"
  en los avisos de patente.
- Un aviso de fecha cargada dentro del plazo sale en la siguiente corrida diaria.
- Orden de "Atención Requerida" y mostrar la lista completa.
- "Recordatorio de Turnos" gobierna los turnos de todos los tipos; los
  interruptores por tipo gobiernan solo los vencimientos.
- Borrar el turno al renovar desde la ficha si no se cargó uno nuevo.
- "Guardar Cambios" pasa a guardar de verdad.
- Etiquetas del calendario y nota "Turno pasado".
- Vitest para los tests y la función respondiendo con error si falla una
  consulta.
- Orden de despliegue y envío de avisos en paralelo.
