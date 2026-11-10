---
target: Inicio y Vehículos
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Users\\nicom\\OneDrive\\Documentos\\Proyectos Antigravity\\administracion-flota\\pages\\Dashboard.tsx"
target_fingerprint: "sha256:07d7ff30e3169727405431efdbc1ca37eec425831a481b72989e133adcf3c873"
target_path: "C:\\Users\\nicom\\OneDrive\\Documentos\\Proyectos Antigravity\\administracion-flota\\pages\\Dashboard.tsx"
timestamp: 2026-11-10T16-08-43Z
slug: pages-dashboard-tsx
---
Método: dos subagentes aislados (A: revisión de diseño · B: detector y navegador). Alcance: Inicio y Vehículos, después de la segunda vuelta (rama vuelta-2-inicio-colores). Datos reales del día: 1 VTV vencida, 2 seguros por vencer, 42 documentos sin fecha en 14 unidades, 1 trabajo.

## Puntaje de diseño (heurísticas de Nielsen, Inicio y Vehículos)

| # | Heurística | Puntaje | Problema clave |
|---|---|---|---|
| 1 | Estado del sistema | 3 | Estado claro y contadores en los chips; carga con spinner y sin progreso de fechas cargadas |
| 2 | Relación con el mundo real | 3 | "42 sin fecha" cuenta documentos y "Sin fecha 14" unidades; "Toda la flota trabajando" con una VTV vencida |
| 3 | Control y libertad | 3 | Volver de una ficha lleva arriba de todo en Vehículos |
| 4 | Consistencia | 3 | "Operativos", "Activos" y "Activo"; "Ver la agenda" dos veces con dos estilos |
| 5 | Prevención de errores | 2 | Lo que nunca va a avisar queda en letra chica apenas hay un vencido |
| 6 | Reconocer en vez de recordar | 3 | "Seguro · SAVEIRO" no dice cuál de las Saveiro |
| 7 | Flexibilidad y eficiencia | 2 | Sin carga en serie, sin tabla, sin atajos |
| 8 | Estética y minimalismo | 3 | 17 "Activo" y 17 "— · Sin chofer"; tres recuadros para decir "sin fechas" |
| 9 | Recuperación de errores | 3 | "Sin resultados" culpa a la patente cuando la oculta el filtro |
| 10 | Ayuda | 2 | Al filtro "Sin fecha" se llega sin una línea que diga qué hacer |
| Total | | 27/40 | Aceptable (borde alto) |

## Veredicto de especificidad

- Revisión: detalles propios (patente Mercosur, ilustraciones, paleta del logo, orden Seguro/VTV/Patente); estructura de tablero genérico (banda con cifra, 4 indicadores, dos listas) y grilla de tarjetas sin fechas.
- Detector en el código: 0 hallazgos (solo patrones de texto).
- Detector en la app: 0 hallazgos en 9 escaneos (Inicio, Vehículos y Vehículos "Sin fecha" a 375×812, 960×800 y 1440×900), con control positivo (un texto de prueba de 9 px gris claro disparó low-contrast y tiny-text). Contraste de texto más bajo 4,83:1 (contador rojo del menú); ningún desborde horizontal; chips de 44 px en el celular y 38 px en escritorio; enlaces "Ver la agenda" y "Ver todos" de 28 px de alto.

## Problemas prioritarios

1. [P1] Inicio esconde el riesgo más grande: con vencidos y sin fechas a la vez, el título dice "3 documentos necesitan atención", "42 sin fecha" va en letra chica sin enlace y el único botón es "Ver la agenda". Arreglo: que statusAction (lib/home.ts) ofrezca "Cargar fechas" siempre que haya faltantes, y una fila fija al final de "Necesitan atención" con "42 documentos sin fecha en 14 unidades: no avisan" que lleve a /fleet?filtro=sinfecha. Comando: onboard.
2. [P2] "Sin fecha" es un filtro, no una tarea: sin explicación ni progreso; cargar todo son 14 fichas × 3 hojas y cada vuelta reinicia el scroll. Arreglo: nota y contador "6 de 48 fechas cargadas" con el filtro activo; conservar el scroll al volver. Comando: onboard.
3. [P2] Las tarjetas hacen ruido y no muestran fechas: "Activo" y "— · Sin chofer" en todas, tres recuadros para "sin fechas", "Al día" sin hasta cuándo. Arreglo: pastilla solo si no está "Activo", ocultar datos vacíos, una línea para "sin fechas", "Al día · hasta 03/2027". Comando: distill.
4. [P2] La búsqueda dentro de un filtro engaña: con "Sin fecha" activo, buscar una unidad al día dice "Sin resultados · Probá con otra patente…". Arreglo: nombrar el filtro y ofrecer "Buscar en todos". Comando: harden.
5. [P2] En escritorio angosto (960 px) la lista de atención queda más apretada que en el celular y la búsqueda corta su texto de ayuda. Arreglo: dos columnas recién desde unos 1180 px; que las herramientas bajen de línea con la búsqueda de 320 px como mínimo. Comando: adapt.

## Alertas por persona

- Alex (escritorio): ve 9 de 17 unidades y ninguna fecha; 7 paradas de Tab antes del contenido, sin "saltar al contenido".
- Sam (accesibilidad): foco, aria-pressed y role="alert" bien; h1 y h2 repiten "necesitan atención"; el "—" del kilometraje se lee sin rótulo; enlaces de 28 px.
- Casey (celular): Vehículos mide 4.048 px para 17 unidades; cuatro caminos a la Agenda y ninguno para cargar fechas.
- La administrativa: lee "3 documentos" y da el día por resuelto; "Toda la flota trabajando" con una VTV vencida.

## Observaciones menores

- "Próximo vencimiento · Seguro · SAVEIRO" sin patente; los indicadores tienen más sombra que la lista principal; un turno de hoy saldría en "Para hoy" y en "Necesitan atención"; el texto de ayuda de la búsqueda no menciona sección y encargado; escribir /#/fleet a mano conserva la búsqueda anterior.

## Preguntas para pensar

- ¿Y si Inicio contara unidades que no pueden salir en vez de documentos?
- ¿Y si "Sin fecha" fuera una carga en serie, unidad tras unidad, con contador?
- En la computadora, ¿no reemplazaría mejor a la planilla una tabla con las fechas reales, ordenable por vencimiento?
