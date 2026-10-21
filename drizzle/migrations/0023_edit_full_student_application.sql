CREATE OR REPLACE FUNCTION public.update_student_application(_actor uuid, _student uuid, _personal jsonb, _score numeric, _choices text[], _fields text[], _documents jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a public.applications; changed boolean; merged jsonb; cutoff numeric;
BEGIN
 IF NOT (public.has_role(_actor,'admin') OR public.has_role(_actor,'sub_admin')) THEN RAISE EXCEPTION 'Admins and sub-admins only'; END IF;
 IF EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_student AND role IN ('admin','sub_admin','department_head')) THEN RAISE EXCEPTION 'Select a student account'; END IF;
 SELECT * INTO a FROM public.applications WHERE user_id=_student FOR UPDATE;
 IF a.id IS NULL THEN RAISE EXCEPTION 'Student has no application'; END IF;
 IF _score IS NULL OR _score<0 OR _score>700 OR _personal->>'gender' NOT IN ('male','female') OR _personal->>'program' NOT IN ('Regular','Extension','Weekend') THEN RAISE EXCEPTION 'Invalid academic information'; END IF;
 IF cardinality(_choices) IS DISTINCT FROM 3 OR cardinality(_fields) IS DISTINCT FROM 3 OR array_position(_choices,NULL) IS NOT NULL OR array_position(_fields,NULL) IS NOT NULL THEN RAISE EXCEPTION 'Three department choices are required'; END IF;
 changed := ARRAY[a.first_choice,a.second_choice,a.third_choice] IS DISTINCT FROM ARRAY[_choices[1]||' — '||_fields[1],_choices[2]||' — '||_fields[2],_choices[3]||' — '||_fields[3]];
 IF changed THEN PERFORM public.edit_student_choices(_actor,_student,_choices,_fields); END IF;
 merged := COALESCE(a.documents,'{}'::jsonb)||COALESCE(_documents,'{}'::jsonb);
 UPDATE public.applications SET grade_12_results = (a.grade_12_results || jsonb_build_object('score',_score,'personal_info',COALESCE(a.grade_12_results->'personal_info','{}'::jsonb)||_personal,'sub_fields',to_jsonb(_fields))) - CASE WHEN (a.grade_12_results->>'score') IS DISTINCT FROM _score::text OR merged->>'grade12' IS DISTINCT FROM a.documents->>'grade12' THEN 'verified' ELSE '__unused__' END,
 documents=merged, result_doc_path=COALESCE(merged->>'grade12',a.result_doc_path)
 WHERE id=a.id;
 IF (a.grade_12_results->>'score') IS DISTINCT FROM _score::text OR (a.grade_12_results->'personal_info'->>'gender') IS DISTINCT FROM (_personal->>'gender') THEN
 SELECT CASE WHEN _personal->>'gender'='female' THEN female_grade_12_cutoff ELSE grade_12_cutoff END INTO cutoff FROM public.admission_settings WHERE id=true;
 UPDATE public.applications SET status=CASE WHEN _score>=COALESCE(cutoff,CASE WHEN _personal->>'gender'='female' THEN 150 ELSE 160 END) THEN 'approved' ELSE 'waiting_list' END WHERE id=a.id AND status IS DISTINCT FROM 'rejected';
 END IF;
 UPDATE public.profiles SET full_name=concat_ws(' ',_personal->>'firstName',_personal->>'middleName',_personal->>'lastName'),phone=_personal->>'phone',email=_personal->>'email' WHERE id=_student;
END;
$$;
REVOKE ALL ON FUNCTION public.update_student_application(uuid,uuid,jsonb,numeric,text[],text[],jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.update_student_application(uuid,uuid,jsonb,numeric,text[],text[],jsonb) TO service_role;