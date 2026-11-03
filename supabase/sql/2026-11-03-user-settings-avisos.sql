-- 2026-11-03 · Alertas de vencimientos
-- Agrega a user_settings los interruptores de avisos por tipo. Solo agrega columnas.
-- Correr en Supabase → SQL Editor.

-- Antes, consulta de control: la tabla tiene que tener user_id, updated_at y las columnas *_threshold.
-- select column_name, data_type, is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'user_settings'
-- order by ordinal_position;

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS insurance_alerts BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS vtv_alerts BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS patente_alerts BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS appointment_alerts BOOLEAN NOT NULL DEFAULT true;
