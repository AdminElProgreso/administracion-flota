# Gestión de Flota · Cooperativa El Progreso

App web, instalable en el celular, para seguir los vencimientos de seguro, VTV y patente de la flota de la Cooperativa Agropecuaria "El Progreso" de Henderson, cargar los turnos y registrar los trabajos de taller.

Los avisos llegan por notificación desde los días de anticipación que elige cada persona en Ajustes, y se repiten todos los días hasta que el documento se renueva. Si hay un turno cargado, solo se recuerda el turno.

## Cómo correrla

Hace falta Node.js 20 o más nuevo.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # tests de la lógica (Vitest)
npm run build    # versión de producción en dist/
```

## Variables de entorno

Van en `.env.local`, que no se sube al repositorio. En Vercel se cargan las mismas tres.

| Variable | Para qué |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública (anon) de Supabase |
| `VITE_VAPID_PUBLIC_KEY` | Clave pública de las notificaciones push |

Cada push a `main` publica la app en Vercel.

## Dónde está cada cosa

- `pages/`: las pantallas (Ingreso, Inicio, Vehículos, Ficha, Agenda, Taller y Ajustes).
- `components/`: las piezas compartidas y, en `components/sheets/`, las hojas para renovar documentos, cargar turnos, registrar trabajos y agregar vehículos.
- `lib/`: las reglas y el acceso a los datos. Sus tests están en `tests/`.
- `styles/`: el diseño, con los colores y las tipografías de la Cooperativa, sin frameworks de CSS.
- `docs/propuesta/interfaz.html`: el prototipo aprobado del diseño.
- `docs/superpowers/`: el diseño escrito y los planes de trabajo.
- `supabase/functions/check-alerts/`: la función que manda los avisos todos los días a las 9, hora de Argentina. Las reglas de los avisos están en `supabase/functions/_shared/` y las usan la app y la función.
- `GUIDE_PUSH_NOTIFICATIONS.md`: cómo se configuraron las notificaciones push en Supabase.
