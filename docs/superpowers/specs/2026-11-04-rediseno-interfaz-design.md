# Rediseño de la interfaz: diseño

Fecha: 2026-11-04 · Estado: aprobado por el usuario ("Sí, avanzá") sobre el prototipo

## Para qué

La interfaz actual es poco intuitiva y no representa a la Cooperativa Agropecuaria
"El Progreso" de Henderson Ltda.: es oscura, genérica, mezcla idiomas ("Dash"),
esconde cosas en el celular y tiene botones y campos que no hacen nada. El usuario
pidió una interfaz "mucho mejor, mucho más prolija", saltó las preguntas y aprobó
la propuesta.

**Fuente de verdad visual:** `docs/propuesta/interfaz.html`. Colores, tipografías,
componentes, textos y comportamiento de cada pantalla salen de ahí. Donde este
documento no dice algo, manda el prototipo.

## Objetivos

1. Identidad de la Cooperativa:
   - colores del logo: verde `#0F7A37`/`#00A351`, amarillo sol `#F2D300`,
     naranja `#E85122`, carbón `#1B1B1B`, papel `#F6F5F1`;
   - tipografías de la marca: Bebas Neue para títulos y números grandes, Barlow
     para textos, Barlow Condensed para rótulos;
   - logo en la barra y en el ingreso, y el lema "Desde 1948 al servicio del
     productor y la comunidad".
2. Fondo claro, legible al sol, en celular primero y también en escritorio.
3. Navegación simple:
   - en el celular: Inicio, Vehículos, Agenda y Taller, más un botón naranja
     "+" con las cuatro acciones comunes y Ajustes en la barra superior;
   - en escritorio: menú lateral.
4. Todo lo que hoy funciona sigue funcionando (lista abajo), y nada de la
   interfaz es decorativo.
5. Cada acción que falla avisa con un mensaje; las listas distinguen "sin datos"
   de "no se pudo cargar".

## Lo que tiene que seguir funcionando

- Ingreso con email y contraseña; aviso de "configurá tu contraseña" si
  `user_metadata.password_set` no está; cambio de contraseña (marca
  `password_set: true`).
- Alta, edición, baja y eliminación de vehículos. Los campos actuales:
  - tipo, patente, modelo, año y kilometraje u horas;
  - sección, encargado y chofer;
  - vencimientos de seguro, VTV y patente;
  - estado: Activo, En Taller o Baja.
- Renovar documentos y cargar, cambiar o borrar turnos, con las reglas de alertas
  ya publicadas (`supabase/functions/_shared/alerts.ts`, `lib/useAlertPrefs.ts`).
- Alta, edición y eliminación de mantenimientos y reparaciones, con costo y
  proveedor.
- Calendario de vencimientos y turnos.
- Ajustes:
  - umbrales e interruptores de avisos guardados en `user_settings`;
  - activar y desactivar notificaciones push del dispositivo;
  - notificación de prueba;
  - instalar la app (aviso del navegador y pasos para iPhone).
- Las URLs de las notificaciones: `/#/fleet/{id}` sigue abriendo la ficha.

## Pantallas (ver el prototipo)

- **Inicio:**
  - fecha y saludo según la hora;
  - tarjeta de estado con cuántos documentos necesitan atención, que lleva a la
    Agenda;
  - indicadores: operativos, en taller, gasto del mes y próximo vencimiento;
  - "Para hoy", con los turnos de hoy y el botón "Registrar renovación";
  - "Necesitan atención" y "Últimos trabajos".
- **Vehículos:**
  - buscador por patente, modelo, chofer, encargado o sección;
  - filtros Todos, Activos, En taller y De baja, con su cantidad;
  - tarjeta por unidad: tipo, patente Mercosur, año, sección, estado y los tres
    documentos en palabras;
  - botón "Agregar".
- **Ficha:**
  - encabezado con datos, "Registrar trabajo" y "Editar datos";
  - una tarjeta por documento con "Renovar" y "Cargar turno" o "Cambiar turno";
  - historial técnico (también en el celular) con total del año;
  - zona de baja: "Dar de baja", y si ya está de baja, "Reactivar" y
    "Eliminar definitivamente" con confirmación.
- **Agenda:**
  - lista con "Vencidos" y después lo que viene, agrupado por mes;
  - vista mensual con puntos de color y la lista del día elegido;
  - en escritorio, las dos vistas juntas.
- **Taller:**
  - gasto del mes con barras de los últimos 6 meses;
  - filtros Todos, Mantenimiento y Reparación;
  - trabajos agrupados por mes con su total;
  - tocar un trabajo lo edita o lo borra.
- **Ajustes:**
  - avisos de vencimiento: días con botones − y + (mínimo 1; máximos actuales
    60, 90, 60 y 30);
  - notificaciones de este celular: activar, probar e interruptores por tipo;
  - cuenta: cambiar contraseña y cerrar sesión;
  - la app en el celular: instalar.
- **Ingreso:** arte de campo con sol y lema, logo y formulario.
- **Hojas:**
  - en el celular suben desde abajo; en escritorio son un diálogo centrado;
  - formularios: acciones rápidas, renovar o turno, trabajo y vehículo;
  - el botón de guardar se bloquea mientras guarda.

## Decisiones de construcción

- CSS propio llevado del prototipo a `styles/`, con variables en `:root` y
  `@media (min-width: 900px)` en lugar de las container queries del prototipo.
  Se elimina Tailwind por CDN del `index.html`, junto con el importmap, el
  `index.css` inexistente y el `apple-touch-icon` inexistente. No se usa Tailwind
  en el código nuevo.
- Fuentes de Google Fonts, cacheadas por el service worker para que la PWA
  arranque con estilos sin conexión.
- Logo: por ahora, la imagen de la web de la Cooperativa
  (`https://elprogresocoop.com.ar/public/img/logo_nav.png`), con el nombre en
  Bebas Neue si no carga. Se reemplaza por el archivo oficial cuando el usuario
  lo pase.
- Se mantienen React 19, React Router con HashRouter y las mismas rutas
  (`/`, `/fleet`, `/fleet/:id`, `/calendar`, `/maintenance`, `/settings`), más
  `*` que redirige a `/`.
- Los datos van por react-query:
  - un hook para vehículos y otro para trabajos, con estados de carga y error;
  - mutaciones que invalidan la caché;
  - los mensajes van en avisos breves, no en `alert()`.
- Lógica de presentación pura en `lib/` con tests de Vitest: patente, saludo,
  búsqueda, agenda, gasto mensual, armado de cambios a guardar y textos de estado.
- Valores de la base sin cambios: el estado `'En Taller'` se guarda así y se
  muestra "En taller"; las secciones del formulario son las de siempre más las
  que ya existan en la base (nunca se cambia una sección sin aviso).
- Textos de estado nuevos, como en el prototipo:
  - documentos: "Vence en N días", "Vence hoy", "Vence mañana", "Venció ayer",
    "Venció hace N días", "Turno hoy", "Turno mañana", "Turno el dd/mm", "Al
    día" y "Sin fecha";
  - agenda: "Hoy", "Mañana", "En N días", "Ayer" y "Hace N días".
- Manifest de la PWA con los colores de la marca (`theme_color` `#0F7A37`,
  fondo `#F6F5F1`). Un solo registro del service worker: el del plugin.
- Al cerrar sesión, el dispositivo deja de recibir avisos (se borra su
  suscripción), para que no le lleguen al próximo usuario.

## Arreglos pendientes que entran en este trabajo

- **Ficha y Ajustes:** historial técnico visible en el celular; ficha con
  "Vehículo no encontrado" solo si no existe, y error si falló la carga; campos
  decorativos de Ajustes eliminados.
- **Formularios:** mantenimientos sin doble envío y con opción de borrar; fecha
  propuesta en hora local; edición de vehículos sin `NaN` ni patentes vacías; la
  sección no cambia sola.
- **Errores:** el panel ya no muestra "Todo en orden" si falló la carga.
- **Navegación y copia:** ruta desconocida que vuelve al inicio; tractor con su
  ícono y horas; confirmación de borrado sin distinguir mayúsculas.
- **Base técnica:** Tailwind fuera del CDN; un solo registro del service worker.

## No objetivos

- Cambios en la base de datos o en la función de avisos.
- Modo oscuro, roles o permisos, multiempresa.
- Íconos nuevos de la PWA (dependen del logo oficial).
- Reescribir la guía de notificaciones.

## Sería un fracaso aunque funcione

- Perder cualquier función de la lista "Lo que tiene que seguir funcionando".
- Que algo se vea mal o se corte a 375 px de ancho.
- Que una acción falle sin aviso o que se guarde dos veces.
- Que la app publicada quede rota para el usuario: se prueba en una vista previa
  de Vercel antes de pasar a `main`.
