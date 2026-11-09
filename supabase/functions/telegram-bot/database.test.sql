-- Run in a privileged transaction; no live record changes are retained.
BEGIN;
DO $$
DECLARE student public.profiles%ROWTYPE; before_app jsonb; after_app jsonb; emergency text;
BEGIN
  SELECT p.* INTO student FROM public.profiles p JOIN public.applications a ON a.user_id=p.id
  WHERE public.telegram_phone_key(p.phone) IS NOT NULL AND public.has_role(p.id,'student')
    AND NOT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=p.id AND r.role<>'student') LIMIT 1;
  IF student.id IS NULL THEN RAISE EXCEPTION 'No real student available for test'; END IF;
  SELECT to_jsonb(a), a.grade_12_results #>> '{personal_info,emergencyPhone}' INTO before_app, emergency FROM public.applications a WHERE a.user_id=student.id;
  IF NOT EXISTS(SELECT 1 FROM public.telegram_find_students(emergency,true) WHERE id=student.id) AND (SELECT count(*) FROM public.telegram_find_students(emergency,true))<2 THEN RAISE EXCEPTION 'Emergency lookup failed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.telegram_find_students(student.student_code,false) WHERE id=student.id) THEN RAISE EXCEPTION 'Student ID lookup failed'; END IF;
  IF public.telegram_begin_name_edit(-900000000001,900000000001,student.student_code) THEN RAISE EXCEPTION 'Group edit allowed'; END IF;
  IF NOT public.telegram_begin_name_edit(900000000001,900000000001,student.student_code) THEN RAISE EXCEPTION 'Could not begin'; END IF;
  IF public.telegram_finish_name_edit(900000000001,900000000001,'Test Student Name') THEN RAISE EXCEPTION 'Unverified edit allowed'; END IF;
  IF public.telegram_verify_name_contact(900000000001,900000000001,'invalid') THEN RAISE EXCEPTION 'Invalid contact allowed'; END IF;
  IF public.telegram_verify_name_contact(900000000001,900000000002,student.phone) THEN RAISE EXCEPTION 'Wrong sender allowed'; END IF;
  IF NOT public.telegram_verify_name_contact(900000000001,900000000001,student.phone) THEN RAISE EXCEPTION 'Own phone verification failed'; END IF;
  IF NOT public.telegram_finish_name_edit(900000000001,900000000001,'Test Student Name') THEN RAISE EXCEPTION 'Name save failed'; END IF;
  IF (SELECT full_name FROM public.profiles WHERE id=student.id)<>'Test Student Name' THEN RAISE EXCEPTION 'Profile name readback failed'; END IF;
  SELECT to_jsonb(a) INTO after_app FROM public.applications a WHERE a.user_id=student.id;
  IF after_app #>> '{grade_12_results,personal_info,firstName}'<>'Test' OR after_app #>> '{grade_12_results,personal_info,middleName}'<>'Student' OR after_app #>> '{grade_12_results,personal_info,lastName}'<>'Name' THEN RAISE EXCEPTION 'Application name readback failed'; END IF;
  IF (before_app #- '{grade_12_results,personal_info,firstName}' #- '{grade_12_results,personal_info,middleName}' #- '{grade_12_results,personal_info,lastName}') IS DISTINCT FROM (after_app #- '{grade_12_results,personal_info,firstName}' #- '{grade_12_results,personal_info,middleName}' #- '{grade_12_results,personal_info,lastName}') THEN RAISE EXCEPTION 'Non-name application fields changed'; END IF;
  IF public.telegram_finish_name_edit(900000000001,900000000001,'Another Student Name') THEN RAISE EXCEPTION 'Session reused'; END IF;
  IF has_function_privilege('authenticated','public.telegram_finish_name_edit(bigint,bigint,text)','EXECUTE') OR has_function_privilege('anon','public.telegram_find_students(text,boolean)','EXECUTE') THEN RAISE EXCEPTION 'Public access allowed'; END IF;
END $$;
ROLLBACK;