ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sub_admin';
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS documents jsonb NOT NULL DEFAULT '{}'::jsonb;