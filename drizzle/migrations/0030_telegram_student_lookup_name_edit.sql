CREATE FUNCTION public.telegram_phone_key(_phone text) RETURNS text LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT CASE WHEN regexp_replace(coalesce(_phone,''),'[^0-9]','','g') ~ '^(0|251|00251)?[79][0-9]{8}$' THEN right(regexp_replace(_phone,'[^0-9]','','g'),9) ELSE NULL END $$;
REVOKE ALL ON FUNCTION public.telegram_phone_key(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.telegram_phone_key(text) TO service_role;
CREATE FUNCTION public.telegram_find_students(_input text, _phone boolean) RETURNS TABLE(id uuid, full_name text, student_code text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
SELECT p.id,p.full_name,p.student_code FROM public.profiles p WHERE
(CASE WHEN _phone THEN public.telegram_phone_key(_input) IS NOT NULL AND (public.telegram_phone_key(p.phone)=public.telegram_phone_key(_input) OR EXISTS(SELECT 1 FROM public.applications a WHERE a.user_id=p.id AND public.telegram_phone_key(a.grade_12_results #>> '{personal_info,emergencyPhone}')=public.telegram_phone_key(_input))) ELSE upper(p.student_code)=upper(trim(_input)) END) LIMIT 2 $$;
REVOKE ALL ON FUNCTION public.telegram_find_students(text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.telegram_find_students(text,boolean) TO service_role;
CREATE TABLE public.telegram_name_sessions(chat_id bigint PRIMARY KEY, sender_id bigint NOT NULL, student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, verified boolean NOT NULL DEFAULT false, expires_at timestamptz NOT NULL);
GRANT ALL ON public.telegram_name_sessions TO service_role;
ALTER TABLE public.telegram_name_sessions ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.telegram_begin_name_edit(_chat bigint,_sender bigint,_code text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE target uuid;
BEGIN
 IF _chat<>_sender THEN RETURN false; END IF;
 SELECT p.id INTO target FROM public.profiles p WHERE upper(p.student_code)=upper(trim(_code)) AND public.has_role(p.id,'student') AND NOT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=p.id AND r.role<>'student');
 IF target IS NULL THEN RETURN false; END IF;
 INSERT INTO public.telegram_name_sessions(chat_id,sender_id,student_id,verified,expires_at) VALUES(_chat,_sender,target,false,now()+interval '10 minutes') ON CONFLICT(chat_id) DO UPDATE SET sender_id=EXCLUDED.sender_id,student_id=EXCLUDED.student_id,verified=false,expires_at=EXCLUDED.expires_at;
 RETURN true;
END $$;
CREATE FUNCTION public.telegram_verify_name_contact(_chat bigint,_sender bigint,_phone text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 UPDATE public.telegram_name_sessions s SET verified=true WHERE s.chat_id=_chat AND s.sender_id=_sender AND s.expires_at>now() AND public.telegram_phone_key(_phone) IS NOT NULL AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=s.student_id AND public.telegram_phone_key(p.phone)=public.telegram_phone_key(_phone));
 RETURN FOUND;
END $$;
CREATE FUNCTION public.telegram_finish_name_edit(_chat bigint,_sender bigint,_name text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE target uuid; clean text; parts text[];
BEGIN
 clean:=regexp_replace(trim(_name),'\s+',' ','g');
 IF length(clean)<3 OR length(clean)>100 OR clean !~ '^[[:alpha:] .''’-]+$' OR array_length(string_to_array(clean,' '),1)<2 THEN RAISE EXCEPTION 'Enter your full name (2 or more names, up to 100 characters)'; END IF;
 DELETE FROM public.telegram_name_sessions s WHERE s.chat_id=_chat AND s.sender_id=_sender AND s.verified AND s.expires_at>now() AND public.has_role(s.student_id,'student') AND NOT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=s.student_id AND r.role<>'student') RETURNING student_id INTO target;
 IF target IS NULL THEN RETURN false; END IF;
 parts:=string_to_array(clean,' ');
 UPDATE public.profiles SET full_name=clean WHERE id=target;
 UPDATE public.applications SET grade_12_results=jsonb_set(grade_12_results,'{personal_info}',coalesce(grade_12_results->'personal_info','{}'::jsonb)||jsonb_build_object('firstName',parts[1],'middleName',CASE WHEN array_length(parts,1)>2 THEN array_to_string(parts[2:array_length(parts,1)-1],' ') ELSE '' END,'lastName',parts[array_length(parts,1)])) WHERE user_id=target;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.telegram_begin_name_edit(bigint,bigint,text), public.telegram_verify_name_contact(bigint,bigint,text),public.telegram_finish_name_edit(bigint,bigint,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.telegram_begin_name_edit(bigint,bigint,text), public.telegram_verify_name_contact(bigint,bigint,text),public.telegram_finish_name_edit(bigint,bigint,text) TO service_role;