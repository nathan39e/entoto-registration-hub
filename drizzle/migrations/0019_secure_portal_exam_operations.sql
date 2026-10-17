CREATE FUNCTION public.save_portal_exam(_id uuid,_definition jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE d text; q jsonb; qs jsonb; result uuid; op timestamptz; cl timestamptz; BEGIN
 d:=public.head_department(auth.uid()); IF d IS NULL THEN RAISE EXCEPTION 'Department heads only'; END IF;
 IF length(trim(COALESCE(_definition->>'title',''))) NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Exam title required'; END IF;
 qs:=_definition->'questions'; IF jsonb_typeof(qs) IS DISTINCT FROM 'array' OR jsonb_array_length(qs) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Add 1 to 100 questions'; END IF;
 FOR q IN SELECT value FROM jsonb_array_elements(qs) LOOP
 IF length(COALESCE(q->>'id','')) NOT BETWEEN 1 AND 100 OR length(trim(COALESCE(q->>'prompt',''))) NOT BETWEEN 1 AND 2000 OR COALESCE(q->>'type','') NOT IN ('choice','short','paragraph') OR COALESCE((q->>'points')::numeric,0) NOT BETWEEN 0.01 AND 100 OR jsonb_typeof(q->'required') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Invalid question'; END IF;
 IF q->>'type'='choice' THEN IF jsonb_typeof(q->'options') IS DISTINCT FROM 'array' OR jsonb_array_length(q->'options') NOT BETWEEN 2 AND 10 OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(q->'options') v WHERE length(trim(v)) NOT BETWEEN 1 AND 500) OR (SELECT count(DISTINCT value) FROM jsonb_array_elements_text(q->'options'))<>jsonb_array_length(q->'options') THEN RAISE EXCEPTION 'Add 2 to 10 different options'; END IF; END IF;
 END LOOP;
 IF (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(qs))<>jsonb_array_length(qs) THEN RAISE EXCEPTION 'Question IDs must be unique'; END IF;
 op:=NULLIF(_definition->>'opens_at','')::timestamptz; cl:=NULLIF(_definition->>'closes_at','')::timestamptz; IF cl IS NOT NULL AND op IS NOT NULL AND cl<=op THEN RAISE EXCEPTION 'Closing time must follow opening time'; END IF;
 IF _id IS NOT NULL THEN
 PERFORM 1 FROM public.portal_exams WHERE id=_id AND department=d FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Not your department exam'; END IF;
 IF EXISTS(SELECT 1 FROM public.portal_exam_attempts WHERE exam_id=_id) THEN RAISE EXCEPTION 'Exams with attempts cannot be edited; create a new exam'; END IF;
 UPDATE public.portal_exams SET title=trim(_definition->>'title'),description=left(COALESCE(_definition->>'description',''),2000),questions=qs,published=COALESCE((_definition->>'published')::boolean,false),opens_at=op,closes_at=cl,duration_minutes=(_definition->>'duration_minutes')::integer WHERE id=_id RETURNING id INTO result;
 ELSE INSERT INTO public.portal_exams(department,title,description,questions,published,opens_at,closes_at,duration_minutes,created_by) VALUES(d,trim(_definition->>'title'),left(COALESCE(_definition->>'description',''),2000),qs,COALESCE((_definition->>'published')::boolean,false),op,cl,(_definition->>'duration_minutes')::integer,auth.uid()) RETURNING id INTO result; END IF; RETURN result; END $$;
CREATE FUNCTION public.set_portal_exam_published(_id uuid,_published boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN UPDATE public.portal_exams SET published=_published WHERE id=_id AND department=public.head_department(auth.uid()); IF NOT FOUND THEN RAISE EXCEPTION 'Not your department exam'; END IF; END $$;
CREATE FUNCTION public.start_portal_exam(_exam uuid) RETURNS public.portal_exam_attempts LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE e public.portal_exams; a public.portal_exam_attempts; qs jsonb; BEGIN
 SELECT * INTO e FROM public.portal_exams WHERE id=_exam FOR UPDATE;
 IF NOT FOUND OR NOT e.published OR NOT public.eligible_for_portal_exam(auth.uid(),e.department) THEN RAISE EXCEPTION 'Exam unavailable for your account'; END IF;
 SELECT * INTO a FROM public.portal_exam_attempts WHERE exam_id=_exam AND user_id=auth.uid(); IF FOUND THEN RETURN a; END IF;
 IF (e.opens_at IS NOT NULL AND now()<e.opens_at) OR (e.closes_at IS NOT NULL AND now()>=e.closes_at) THEN RAISE EXCEPTION 'Exam is outside its scheduled time'; END IF;
 SELECT jsonb_agg(CASE WHEN q->>'type'='choice' THEN jsonb_set(q,'{options}',(SELECT jsonb_agg(v ORDER BY random()) FROM jsonb_array_elements(q->'options') v)) ELSE q END ORDER BY random()) INTO qs FROM jsonb_array_elements(e.questions) q;
 INSERT INTO public.portal_exam_attempts(exam_id,user_id,department,questions,deadline) VALUES(e.id,auth.uid(),e.department,qs,LEAST(now()+make_interval(mins=>e.duration_minutes),COALESCE(e.closes_at,'infinity'::timestamptz))) RETURNING * INTO a; RETURN a; END $$;
CREATE FUNCTION public.save_portal_exam_answers(_attempt uuid,_answers jsonb,_submit boolean) RETURNS public.portal_exam_attempts LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE a public.portal_exam_attempts; q jsonb; k text; val jsonb; BEGIN
 SELECT * INTO a FROM public.portal_exam_attempts WHERE id=_attempt AND user_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Attempt not found'; END IF; IF a.submitted_at IS NOT NULL THEN RAISE EXCEPTION 'Exam already submitted'; END IF;
 IF now()>=a.deadline THEN UPDATE public.portal_exam_attempts SET submitted_at=a.deadline WHERE id=a.id RETURNING * INTO a; RETURN a; END IF;
 IF jsonb_typeof(_answers) IS DISTINCT FROM 'object' OR octet_length(_answers::text)>600000 THEN RAISE EXCEPTION 'Invalid answers'; END IF;
 FOR k,val IN SELECT key,value FROM jsonb_each(_answers) LOOP
 SELECT value INTO q FROM jsonb_array_elements(a.questions) WHERE value->>'id'=k; IF NOT FOUND OR jsonb_typeof(val)<>'string' OR length(val#>>'{}')>5000 THEN RAISE EXCEPTION 'Invalid answer'; END IF;
 IF q->>'type'='choice' AND (val#>>'{}')<>'' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements_text(q->'options') v WHERE v=val#>>'{}') THEN RAISE EXCEPTION 'Invalid choice answer'; END IF; END LOOP;
 IF _submit AND EXISTS(SELECT 1 FROM jsonb_array_elements(a.questions) q WHERE (q->>'required')::boolean AND length(trim(COALESCE(_answers->>(q->>'id'),'')))=0) THEN RAISE EXCEPTION 'Answer all required questions'; END IF;
 UPDATE public.portal_exam_attempts SET answers=_answers,submitted_at=CASE WHEN _submit THEN now() ELSE NULL END WHERE id=a.id RETURNING * INTO a; RETURN a; END $$;
CREATE FUNCTION public.grade_portal_exam(_attempt uuid,_points jsonb,_feedback text,_publish boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE a public.portal_exam_attempts; q jsonb; n numeric; total numeric:=0; maximum numeric:=0; BEGIN
 SELECT * INTO a FROM public.portal_exam_attempts WHERE id=_attempt AND department=public.head_department(auth.uid()) FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Not your department attempt'; END IF;
 IF a.submitted_at IS NULL AND now()<a.deadline THEN RAISE EXCEPTION 'Student has not submitted'; END IF; IF a.submitted_at IS NULL THEN UPDATE public.portal_exam_attempts SET submitted_at=a.deadline WHERE id=a.id; END IF;
 IF jsonb_typeof(_points) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid grades'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(_points) k WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(a.questions) q WHERE q->>'id'=k)) THEN RAISE EXCEPTION 'Unknown question'; END IF;
 FOR q IN SELECT value FROM jsonb_array_elements(a.questions) LOOP n:=(_points->>(q->>'id'))::numeric; IF n IS NULL AND _publish THEN RAISE EXCEPTION 'Grade every question'; END IF;
 IF n IS NOT NULL AND (n<0 OR n>(q->>'points')::numeric OR n::text IN ('NaN','Infinity','-Infinity')) THEN RAISE EXCEPTION 'Points outside question maximum'; END IF;
 total:=total+COALESCE(n,0); maximum:=maximum+(q->>'points')::numeric; END LOOP;
 INSERT INTO public.portal_exam_grades(attempt_id,department,points,feedback,total,maximum,published,graded_by) VALUES(a.id,a.department,_points,left(COALESCE(_feedback,''),2000),total,maximum,_publish,auth.uid()) ON CONFLICT(attempt_id) DO UPDATE SET points=EXCLUDED.points,feedback=EXCLUDED.feedback,total=EXCLUDED.total,maximum=EXCLUDED.maximum,published=EXCLUDED.published,graded_by=EXCLUDED.graded_by,graded_at=now(); END $$;
REVOKE ALL ON FUNCTION public.save_portal_exam(uuid,jsonb),public.set_portal_exam_published(uuid,boolean),public.start_portal_exam(uuid),public.save_portal_exam_answers(uuid,jsonb,boolean),public.grade_portal_exam(uuid,jsonb,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_portal_exam(uuid,jsonb),public.set_portal_exam_published(uuid,boolean),public.start_portal_exam(uuid),public.save_portal_exam_answers(uuid,jsonb,boolean),public.grade_portal_exam(uuid,jsonb,text,boolean) TO authenticated;