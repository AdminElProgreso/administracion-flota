# Rediseño de la interfaz: decisiones tomadas

Durante la implementación (rama `rediseno-interfaz`) tomé estas decisiones cuando el plan no alcanzaba o chocaba con lo que se espera de la app. Cada una dice por qué y qué cuesta si estuviera mal. Están en el orden en que las tomé.

## Preparación

- se ejecuta sin pedir revisión del plan — el usuario aprobó la propuesta con "Sí, avanzá" y ya había elegido el método Nativo para el trabajo anterior — costo si está mal: el usuario no vio el plan técnico antes de implementar.

## Tarea 1

- el plan esperaba 33 tests en la verificación; hay 37 porque se sumaron los de los arreglos de avisos publicados antes del plan — sin impacto.

## Tarea 2

- las exportaciones viejas de docStyles (DOC_CHIP_CLASSES, DOC_CARD_CLASSES, DOC_HEADLINES, CALENDAR_TONE_CLASSES, calendar*Label) quedan en un bloque legacy hasta Task 14 en vez de borrarse ya — borrarlas rompía el build (Rollup no encuentra la exportación) mientras las pantallas viejas siguen importándolas — costo si está mal: código muerto por unas horas.

## Tarea 4

- el test de búsqueda del plan fallaba por el fixture, no por el código — la unidad "a" heredaba de vrow() el chofer NICO, así que "nico" la encontraba con razón; se le puso assigned_driver: null para que el caso pruebe lo que quiere probar — costo si está mal: ninguno, el código no cambió.
- int() de vehicleFromForm acepta separador de miles ("95.100" → 95100) además de lo que pide el plan — así se escribe el kilometraje en Argentina — costo si está mal: un año escrito "2.016" se guardaría 2016.

## Tarea 5

- las mutaciones y consultas tiran mensajes en español ("No se pudo guardar el cambio.") y dejan el error de la base en la consola — el plan pedía tirar el error; mostrar el texto técnico en inglés de Postgres no sirve a quien usa la app — costo si está mal: menos detalle visible para diagnosticar (queda en la consola).
- useInstallPrompt guarda el evento beforeinstallprompt desde que carga el módulo (store con useSyncExternalStore) — el navegador lo dispara una sola vez al cargar y antes se perdía si Ajustes no estaba abierta — costo si está mal: ninguno.
- subscribeDevice borra la fila de la suscripción vieja antes de desuscribirla — antes quedaba huérfana hasta un 410 (menor diferido de la revisión anterior) — costo si está mal: ninguno.

## Tarea 6

- Sheet pone el foco en el diálogo y no en el primer campo como decía el plan — en el celular enfocar un input abre el teclado encima de la hoja; el diálogo enfocado sirve igual al lector de pantalla — costo si está mal: un toque más para escribir en escritorio.

## Tarea 7

- cerrar sesión vive en lib/session.ts (logout) y lo usan AppShell y Ajustes, en vez de pasar onLogout por props o contexto — una función de módulo alcanza y no agrega plomería — costo si está mal: ninguno.
- el contexto de las hojas va en components/sheets/context.ts (SheetsProvider lo re-exporta) — evita el import circular SheetsProvider ↔ QuickSheet/hojas — costo si está mal: ninguno.
- se instalaron @types/react y @types/react-dom 19 como dependencias de desarrollo — sin ellos TypeScript no chequeaba JSX (key en componentes daba error y todo lo demás era any) — costo si está mal: dos dependencias de desarrollo más.

## Tarea 8

- "de N en la flota" cuenta las unidades que no están de baja — una unidad de baja ya no es parte de la flota — costo si está mal: el número difiere en la cantidad de bajas.
- la hoja de documentos abierta desde "+" arranca en el documento más urgente (lista de atención; para turno, uno sin turno) en vez del primer vehículo y VTV del prototipo — es lo que la persona más probablemente viene a cargar — costo si está mal: un toque más para elegir otro.
- no se acepta un turno en el pasado (mensaje y min en el campo); renovar sí acepta fecha pasada para corregir un vencimiento mal cargado — un turno pasado no cuenta y el documento volvería a avisar como vencido sin que se note — costo si está mal: no se puede registrar un turno ya ocurrido.
- las reglas de la hoja (lib/docForm.ts) y los textos del resumen del Inicio (lib/home.ts) van en módulos puros con tests — el plan no nombraba estos archivos — costo si está mal: ninguno.
- QueryClient con networkMode 'always' (consultas con 2 reintentos; mutaciones también) — sin conexión react-query dejaba la pantalla en "Cargando…" y "Guardando…" para siempre; ahora aparece "Reintentar" a los ~3 s y Guardar avisa el error (Review Focus 2) — costo si está mal: sin conexión los pedidos fallan en vez de esperar a que vuelva la red.
- indicador con monto de 12 caracteres o más baja a 24 px — "$ 100.000.000" no entraba en media tarjeta a 375 px — costo si está mal: ninguno.
- las filas de trabajos muestran el año cuando la fecha no es del año en curso (shortDate) — "22/01" se vuelve ambiguo desde enero próximo — costo si está mal: ninguno.
- useAlertPrefs expone refetch para el "Reintentar" del Inicio — costo si está mal: ninguno.

## Tarea 9

- editar datos no toca las fechas de los documentos (vehicleEditPatch); pasar una unidad a generador borra vencimientos y turnos, con aviso en la hoja — si no, el generador seguiría mandando avisos — costo si está mal: hay que volver a cargar las fechas si se eligió generador por error.
- no se puede repetir una patente (vehicleFormError: "Ya hay un vehículo con la patente …") — el plan solo pedía modelo y sección — costo si está mal: no se pueden cargar dos unidades con la misma patente. *Ajustada en la revisión final: al editar se conserva una patente que la unidad ya tenía, aunque otra la comparta.*
- filtro y búsqueda viven en la dirección (?filtro=, ?q=) y los indicadores Operativos y En taller del Inicio abren la lista filtrada — al volver de una ficha se conserva lo que se estaba mirando — costo si está mal: ninguno. *Ajustada en la revisión final: la caja de búsqueda tiene su propio texto y lo copia a la dirección (atada directo, perdía lo escrito).*
- una unidad de baja muestra "De baja: no recibe avisos de vencimiento" en vez de los tres estados — mostrar "Vencido" en rojo en una unidad fuera de servicio alarma sin motivo — costo si está mal: para ver sus fechas hay que abrir la ficha.
- un filtro sin unidades y sin búsqueda dice "No hay vehículos en taller/activos/de baja" en vez de "Sin resultados · Probá con otra patente" — costo si está mal: ninguno.
- CSS — los campos de a dos pueden achicarse (la fecha de la VTV se salía a 375 px), un campo solo en su fila ocupa todo el ancho y el texto de ejemplo no se pasa a mayúsculas — costo si está mal: ninguno.

## Tarea 10

- los textos de cada tarjeta de documento van en lib/docCard.ts con tests: "lo/la renueves" según el documento, "1 día" en singular (los umbrales del usuario son 1/1/1/7), avisos apagados en Ajustes y turno que ya pasó sin renovar — el prototipo decía "hasta que lo renueves" también para VTV y patente — costo si está mal: ninguno.
- "Cargar fecha" en un documento sin fecha abre "Vencimiento de la VTV" y avisa "Vencimiento de la VTV cargado: …" en vez de "Renovar VTV" / "VTV renovada" — no hubo renovación — costo si está mal: ninguno.
- las confirmaciones en dos pasos (borrar trabajo, dar de baja) ignoran un segundo toque dentro de 600 ms (lib/useConfirmStep.ts) — en el celular el "Sí" quedaba bajo el dedo y un doble toque confirmaba — costo si está mal: quien confirma muy rápido tiene que tocar de nuevo.
- workFromForm también exige vehículo ("Elegí el vehículo") y fecha ("Elegí la fecha"); "Registrar un trabajo" desde "+" arranca sin vehículo elegido — evita cargar el trabajo en la unidad equivocada — costo si está mal: un toque más.
- el enlace "Vehículos" de la ficha vuelve a la lista con el filtro y la búsqueda con que se abrió (state.back) — costo si está mal: ninguno.
- "Puede que lo hayan eliminado" en vez de "la" del plan — concuerda con el título "Vehículo no encontrado" — costo si está mal: ninguno.
- el formulario de edición muestra la patente y el kilometraje con formato ("AA 236 JS", "95.100"); al guardar se normalizan igual que antes — costo si está mal: ninguno.
- al eliminar una unidad la ficha muestra "Cargando…" hasta salir a /fleet en vez de parpadear "Vehículo no encontrado" — costo si está mal: ninguno. *Corregida en la revisión final: ahora además avisa y vuelve a la lista aunque la ficha se desmonte antes de terminar.*

## Tarea 11

- el color de cada evento sale de eventTone (lib/agenda.ts, con test) y lo usan la fila y los puntos del mes — antes la fila lo calculaba por su cuenta — costo si está mal: ninguno.
- al volver al mes actual la selección vuelve a hoy; cualquier otro mes arranca en el 1 como pide el plan — costo si está mal: ninguno.

## Tarea 12

- el alto de cada barra sale de barPercent (lib/spend.ts, con test) — con seis meses en cero el prototipo dividía por el máximo y ahora queda el mínimo de 4 % — costo si está mal: ninguno.
- el filtro por tipo queda en el estado de la pantalla y no en la dirección — los trabajos se editan en una hoja sin salir de Taller — costo si está mal: al ir a otra sección y volver, el filtro vuelve a Todos.

## Tarea 13

- la lógica revisada de preferencias (carga una vez, nada se guarda antes de cargar, autoguardado a 1000 ms) pasó tal cual a useEditablePrefs dentro de Settings.tsx, con un "Reintentar" que antes faltaba: recarga si no cargaron o vuelve a guardar si falló — costo si está mal: ninguno.
- reglas y textos de la cuenta en lib/account.ts con tests: contraseña de 6+ caracteres que coincida, errores de Supabase traducidos (same_password, weak_password, genérico), iniciales del email y la nota según pushSupport — costo si está mal: ninguno.
- si la cuenta no tiene contraseña propia (password_set), Ajustes muestra la Cuenta primero con el formulario abierto — el aviso del Inicio lleva ahí — costo si está mal: ninguno.
- "Probar" solo se habilita con el celular suscripto — sin permiso showNotification falla y en desarrollo service worker.ready no termina nunca — costo si está mal: no se puede ver la prueba antes de activar.
- un error del navegador al activar o desactivar avisos (DOMException en inglés) se muestra como "No se pudo activar en este celular. Probá de nuevo."; los errores de lib/push ya vienen en castellano — costo si está mal: ninguno.
- se quitaron la pestaña "Gestión de datos" (Exportar Excel y Reporte mensual no hacían nada) y los campos fijos "Empresa"/"Email administrador" de la pantalla vieja — el spec no los incluye — costo si está mal: si se querían esas funciones hay que construirlas.

## Tarea 14

- appointmentAfterRenewal y su test quedan — están en supabase/functions/_shared/, que el plan dice no tocar, y así el repo sigue igual a la función publicada — costo si está mal: una función sin uso con su test.
- metadata.json queda — no lo usa la app pero sí AI Studio si el proyecto se vuelve a abrir ahí — costo si está mal: un archivo de más.
- se agregó un punto intermedio de tablet (desde 720 px: indicadores en 4 columnas, vehículos en 2 y datos de la ficha en 4); Ajustes sigue en una columna porque a ese ancho los pasos no entran de a dos — a 768 px las tarjetas ocupaban todo el ancho — costo si está mal: ninguno.
- la prueba de guardado del paso 4 no se hizo — requiere el OK del usuario y la vista previa de Vercel usa la misma base — costo si está mal: el alta, edición y borrado reales se prueban recién en la vista previa.

## Revisión final

- odometer vacío (importante 4 del revisor) — en producción la columna acepta null (supabase gen types: odometer number | null; year, patente, manager y assigned_driver también); el schema.sql que citó es el de la base nueva que nunca se usó — sin cambio — costo si está mal: ninguno, la base lo admite.
- el menor 6 (Ajustes pierde un cambio hecho menos de 1 s antes de salir) se reclasificó a importante — pérdida silenciosa de un umbral que decide los avisos — fixed: tests/autosave.test.ts RED→GREEN (guarda al salir y en pagehide, cancela si vuelve a lo guardado), suite 103/103
- comparación píxel a píxel con el prototipo (el revisor no la hizo) — la hice a 375, 768 y 1280 px — costo si está mal: diferencias visuales menores que se ven en la vista previa.
- comportamiento en el celular (teclado sobre las hojas, scroll en iOS, áreas seguras) — se prueba en la vista previa con el teléfono — costo si está mal: algún ajuste de CSS después.
- esquema y RLS de producción — revisado el esquema con supabase gen types (solo lectura); RLS sin cambios en esta rama — costo si está mal: un guardado rechazado se ve como error (todas las escrituras verifican filas).
- Edge Function y _shared — sin cambios (git diff vacío) — costo si está mal: ninguno.
- aviso de bundle de 518 kB — ya estaba antes de la rama — costo si está mal: primera carga algo más lenta.
- orientation 'portrait' del manifiesto — ya estaba; en escritorio no aplica — costo si está mal: la app instalada no gira en tablet.
- isIos() trata el iPad como Mac — heurística vieja — costo si está mal: en iPad no aparecen los pasos de instalación.
- instalaciones existentes y el cambio de /manifest.json a /manifest.webmanifest — start_url igual, el navegador toma el manifiesto que enlaza la página — costo si está mal: reinstalar la app.
- ejecutar sin pausa de revisión del plan — decisión de proceso ya tomada por el usuario ("avanzá", "Nativo") — costo si está mal: ninguno.
- contenido de metadata.json — no llega a los usuarios — costo si está mal: ninguno.
- datos fuera de lo esperado (status o tipo desconocidos, secciones con espacios) — hay valores por defecto (TYPE_INFO.car, STATUS_INFO.Activo) y sectionOptions recorta — costo si está mal: una unidad rara se ve como camioneta activa.

## Pendientes menores, resueltos después de publicar

La revisión final los había dejado como menores. Se resolvieron todos el 04/11/2026, junto con dos pedidos sobre la vista de escritorio.

- **Escritorio** (pedido del usuario): el contenido queda centrado (hasta 1440 px) en vez de pegado a la izquierda, y el logo ocupa todo el ancho del menú lateral (211 × 78 px); también es más grande en la barra del celular (42 px de alto) y en el ingreso (64 px en el celular, 80 px en escritorio).
- Cerrar una hoja mientras guardaba perdía el aviso: ahora no se cierra mientras dice "Guardando…" (ni con Escape ni tocando el fondo) y "Cancelar" queda deshabilitado.
- El manifiesto quedó en castellano (`lang: 'es-AR'`), con el logo oficial.
- "Salir": sin conexión avisa y no toca nada; cierra solo la sesión de este equipo (con una cuenta compartida, el otro teléfono sigue adentro); si Supabase no la cierra, lo avisa.
- Los avisos toman el ancho del texto hasta el ancho de la pantalla (antes, unos 187 px en el celular).
- Cambiar de pantalla, por ejemplo con el botón Atrás de Android, cierra la hoja abierta.
- Las hojas no dejan salir el foco con Tab y al cerrarse lo devuelven al botón que las abrió.
- La hoja de trabajo avisa si no se pudieron cargar los vehículos.
- La ficha carga el historial completo de la unidad, sin el tope de 1000 de la lista general; una dirección inventada no consulta la base.
- Si al eliminar una unidad se borra el historial pero no la unidad, el aviso lo dice y la pantalla se refresca.
- Costos con decimales: sin cambio. Ningún trabajo guardado tiene centavos y la app guarda pesos enteros, así que editar no cambia ningún valor. `recharts`, que no se usaba, se quitó.
- El año y el kilometraje que no se entienden ("95,100", "20a4") se avisan en vez de guardarse vacíos.
- Una pantalla que falla muestra "Algo salió mal" con "Volver a cargar", y el menú sigue funcionando para ir a otra.
- Dependencias: `react-router` 7.18.5, `ws` 8.22.1 y `bn.js` 4.12.5; las dependencias de producción quedaron sin vulnerabilidades conocidas.
