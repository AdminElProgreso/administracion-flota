# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

La oficina de administración de la Cooperativa: una o pocas personas que siguen los vencimientos, los turnos y los gastos de taller de toda la flota. Usan la app en la computadora de la oficina y en el celular, instalada como app.

## Product Purpose

Que ninguna unidad de la Cooperativa circule con el seguro, la VTV o la patente vencidos. La app avisa a tiempo, deja cargar los turnos y las renovaciones, y guarda el historial de taller de cada unidad con su costo.

El éxito es que la oficina se entere de cada vencimiento antes de que pase, sin tener que revisar una planilla.

## Positioning

Está hecha para la flota y las reglas de la Cooperativa:

- avisa todos los días, desde los días de anticipación que elige cada persona, hasta que el documento se renueva;
- un turno cargado reemplaza el aviso del vencimiento;
- las unidades de baja y los generadores no generan avisos.

## Operating Context

- Los avisos llegan como notificación push todos los días a las 9, hora de Argentina. Tocar el aviso abre la ficha de la unidad en ese documento (`/#/fleet/{id}?doc=…`).
- Las unidades son camionetas y autos, camiones, tractores y generadores. Las primeras dos se miden en kilómetros y las otras dos en horas de uso.
- Cada unidad tiene sección, encargado y chofer, y patente con formato Mercosur.
- Los trabajos de taller pueden ser mantenimientos o reparaciones, con costo y proveedor.

## Capabilities and Constraints

- Ingreso con email y contraseña, con aviso para configurar la contraseña la primera vez.
- Alta, edición, baja, reactivación y eliminación de unidades. La eliminación pide escribir BORRAR.
- Renovar seguro, VTV y patente; cargar, cambiar o borrar turnos.
- Alta, edición y eliminación de trabajos de taller.
- Agenda de vencimientos y turnos.
- Ajustes por persona: días de anticipación y avisos que recibe, notificaciones del dispositivo, prueba de notificación e instalación de la app.
- Técnica: React y Vite como app instalable (PWA), Supabase para datos, ingreso y la función diaria de avisos, publicada en Vercel.
- Idioma único: castellano de Argentina.

## Brand Commitments

- Nombre: Cooperativa Agropecuaria "El Progreso" de Henderson Ltda.
- Logo oficial en `public/logo.svg`, convertido del PDF oficial, y el símbolo en `public/favicon.svg`.
- Lema: "Desde 1948 al servicio del productor y la comunidad".
- La interfaz tiene que representar a la Cooperativa: identidad tomada del logo oficial.
- Voz: castellano rioplatense con voseo ("Registrá", "Probá"), palabras simples y sin anglicismos.

## Evidence on Hand

- Datos reales en producción: 17 unidades al 7 de noviembre de 2026.
- Prototipo aprobado del rediseño: `docs/propuesta/interfaz.html`.
- Diseño y decisiones del rediseño: `docs/superpowers/specs/2026-11-04-rediseno-interfaz-design.md` y `docs/superpowers/rediseno-decisiones.md`.
- Reglas de los avisos: `docs/superpowers/specs/2026-11-03-alertas-vencimientos-design.md` y `supabase/functions/_shared/`.
- No hay testimonios, métricas de uso ni capturas oficiales. No inventarlos.

## Product Principles

1. **Lo vencido primero.** Lo vencido o por vencer se ve antes que cualquier otra cosa, en Inicio, en la lista y en la ficha.
2. **Nada decorativo.** Cada elemento hace algo. Un botón que no hace nada es un error.
3. **Siempre se sabe qué pasó.** Cada acción que falla avisa con un mensaje, y "sin datos" nunca se confunde con "no se pudo cargar".
4. **Las palabras de la oficina.** VTV, turno, taller, sección, encargado: los términos que ya usa la Cooperativa.
5. **Celular primero, también escritorio.** Legible al aire libre en el celular, y aprovechando el ancho en la computadora.

## Accessibility & Inclusion

- Fondo claro y buen contraste para leer al sol, un pedido del rediseño.
- Decisión abierta: no hay un estándar formal acordado. WCAG AA sería el piso razonable.
