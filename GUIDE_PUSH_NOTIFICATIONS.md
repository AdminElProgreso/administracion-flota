# Guía de Implementación de Notificaciones Push

## 1. Base de Datos (Supabase SQL)
Debes crear la tabla para guardar las suscripciones de los usuarios. Ejecuta este SQL en el Editor SQL de tu dashboard de Supabase:

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    subscription JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar seguridad (RLS)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Usuarios pueden guardar su suscripción" 
ON push_subscriptions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden leer su propia suscripción" 
ON push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar su suscripción" 
ON push_subscriptions FOR UPDATE
USING (auth.uid() = user_id);
```

## 2. Variables de Entorno (Frontend)
Ya he creado el archivo `.env` con tu `VITE_VAPID_PUBLIC_KEY`. Asegúrate de que este archivo no se suba al repositorio si es público, pero en este caso es la clave pública, así que es seguro.

## 3. Despliegue del Backend (Edge Function)
La lógica para revisar vencimientos y enviar alertas está en `supabase/functions/check-alerts/index.ts`.

### Pasos para desplegar:
1. **Instalar Supabase CLI** (Si no lo tienes):
   `npm install -g supabase` o `scoop install supabase` (Windows)

2. **Login**:
   `supabase login`

3. **Vincular Proyecto**:
   `supabase link --project-ref tu-id-de-proyecto`

4. **Establecer Secretos**:
   Necesitas configurar las claves en Supabase para que la función las pueda leer.
   `supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...`

   *Nota: Usa la VAPID Private Key que generaste junto con la Public Key.*

5. **Desplegar Función**:
   `supabase functions deploy check-alerts`

## 4. Automatización (Cron Job)
Para que las alertas se envíen automáticamente cada día (ej. a las 9 AM), debes configurar un Cron Job.
En el Dashboard de Supabase -> **Database** -> **Extensions** habilitar `pg_cron`.
Luego en **SQL Editor**:

```sql
select
  cron.schedule(
    'check-alerts-daily',
    '0 12 * * *', -- Ejecutar a las 12:00 UTC todos los días
    $$
    select
      net.http_post(
          url:='https://<project-ref>.supabase.co/functions/v1/check-alerts',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
      ) as request_id;
    $$
  );
```
*Asegúrate de reemplazar `<project-ref>` y `<SERVICE_ROLE_KEY>` con tus valores reales.*

---
¡Listo! Con esto tu sistema PWA tendrá notificaciones automáticas.
