CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS private.cron_keys (name text PRIMARY KEY, value text NOT NULL DEFAULT encode(gen_random_bytes(32),'hex'));
REVOKE ALL ON private.cron_keys FROM PUBLIC, anon, authenticated;
INSERT INTO private.cron_keys(name) VALUES ('send_reminders') ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION public.verify_reminder_cron(p_secret text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, private AS $$
  SELECT p_secret IS NOT NULL AND EXISTS (SELECT 1 FROM private.cron_keys WHERE name = 'send_reminders' AND value = p_secret);
$$;
REVOKE ALL ON FUNCTION public.verify_reminder_cron(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_reminder_cron(text) TO service_role;
CREATE OR REPLACE FUNCTION private.reminder_cron_key() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = private AS $$ SELECT value FROM private.cron_keys WHERE name='send_reminders' $$;
REVOKE ALL ON FUNCTION private.reminder_cron_key() FROM PUBLIC, anon, authenticated;