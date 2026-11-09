-- lovable-cron-fallback-reviewed: Telegram has no delayed deletion; bounded queue wakes on enqueue and stops after drain, minute checks begin deleting at four minutes to meet five-minute window.
CREATE FUNCTION public.telegram_account_by_phone(_phone text) RETURNS TABLE(id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT p.id FROM public.profiles p WHERE public.telegram_phone_key(_phone) IS NOT NULL AND public.telegram_phone_key(p.phone)=public.telegram_phone_key(_phone) AND public.has_role(p.id,'student') AND NOT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=p.id AND r.role<>'student') LIMIT 2;
$$;
REVOKE ALL ON FUNCTION public.telegram_account_by_phone(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.telegram_account_by_phone(text) TO service_role;
CREATE TABLE public.telegram_account_requests(chat_id bigint PRIMARY KEY, sender_id bigint NOT NULL, expires_at timestamptz NOT NULL);
GRANT ALL ON public.telegram_account_requests TO service_role;
ALTER TABLE public.telegram_account_requests ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.telegram_private_replies(chat_id bigint NOT NULL,message_id bigint NOT NULL,delete_at timestamptz NOT NULL DEFAULT now()+interval '4 minutes',PRIMARY KEY(chat_id,message_id));
GRANT ALL ON public.telegram_private_replies TO service_role;
ALTER TABLE public.telegram_private_replies ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.telegram_queue_private_reply(_chat bigint,_message bigint,_url text,_secret text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF _chat<=0 OR _message<=0 OR _url !~ '^https://[a-z0-9]+\.supabase\.co/functions/v1/telegram-bot$' OR _secret !~ '^[A-Za-z0-9_-]{43}$' THEN RAISE EXCEPTION 'Invalid deletion job'; END IF;
 PERFORM pg_advisory_xact_lock(87321041);
 INSERT INTO public.telegram_private_replies(chat_id,message_id) VALUES(_chat,_message) ON CONFLICT DO NOTHING;
 IF NOT EXISTS(SELECT 1 FROM cron.job WHERE jobname='telegram-private-reply-cleanup') THEN
 PERFORM cron.schedule('telegram-private-reply-cleanup','* * * * *',format('SELECT net.http_post(url := %L, headers := %L::jsonb, body := ''{"cleanup_private_replies":true}''::jsonb);',_url,jsonb_build_object('Content-Type','application/json','X-Telegram-Bot-Api-Secret-Token',_secret)::text));
 END IF;
END $$;
CREATE FUNCTION public.telegram_stop_private_reply_cleanup() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE job bigint;
BEGIN
 PERFORM pg_advisory_xact_lock(87321041);
 IF NOT EXISTS(SELECT 1 FROM public.telegram_private_replies) THEN
 SELECT jobid INTO job FROM cron.job WHERE jobname='telegram-private-reply-cleanup';
 IF job IS NOT NULL THEN PERFORM cron.unschedule(job); END IF;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.telegram_queue_private_reply(bigint,bigint,text,text),public.telegram_stop_private_reply_cleanup() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.telegram_queue_private_reply(bigint,bigint,text,text),public.telegram_stop_private_reply_cleanup() TO service_role;