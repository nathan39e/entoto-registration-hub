CREATE OR REPLACE FUNCTION public.admin_filtered_students(_filters jsonb DEFAULT '{}'::jsonb)
RETURNS TABLE(id uuid, full_name text, email text, phone text, student_code text, created_at timestamptz, registered_by uuid, application jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
 RETURN QUERY
 WITH f AS (SELECT coalesce(_filters->>'from','') AS date_from, coalesce(_filters->>'to','') AS date_to,
 coalesce(_filters->>'department','All') AS department, coalesce(_filters->>'program','All') AS program,
 coalesce(_filters->>'occupation','All') AS occupation, coalesce(_filters->>'status','All') AS status,
 lower(btrim(coalesce(_filters->>'search',''))) AS search),
 filters AS (SELECT f.*, regexp_replace(regexp_replace(regexp_replace(f.search,'\D','','g'),'^251',''),'^0','') AS digits FROM f)
 SELECT p.id,p.full_name,p.email,p.phone,p.student_code,p.created_at,p.registered_by,
 CASE WHEN a.id IS NULL THEN NULL ELSE jsonb_build_object('id',a.id,'user_id',a.user_id,'first_choice',a.first_choice,'second_choice',a.second_choice,'third_choice',a.third_choice,'first_department',a.first_department,'program',a.program,'status',a.status,'submitted_at',a.submitted_at,'result_doc_path',a.result_doc_path,'grade_12_results',jsonb_build_object('score',a.grade_12_results->'score','personal_info',jsonb_build_object('gender',a.grade_12_results->'personal_info'->'gender'))) END
 FROM public.profiles p LEFT JOIN public.applications a ON a.user_id=p.id CROSS JOIN filters f
 WHERE NOT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=p.id AND r.role IN ('admin','sub_admin','department_head','viewer','finance'))
 AND (f.date_from='' OR (p.created_at AT TIME ZONE 'UTC')::date >= f.date_from::date)
 AND (f.date_to='' OR (p.created_at AT TIME ZONE 'UTC')::date <= f.date_to::date)
 AND (f.department='All' OR a.first_department=f.department)
 AND (f.program='All' OR a.program=f.program)
 AND (f.occupation='All' OR split_part(a.first_choice,' — ',2)=f.occupation)
 AND (f.status='All' OR (f.status='applied_any' AND a.id IS NOT NULL) OR (f.status<>'applied_any' AND coalesce(a.status,'not_applied')=f.status))
 AND (f.search='' OR position(f.search IN lower(p.full_name))>0 OR position(f.search IN lower(p.email))>0 OR position(f.search IN lower(p.student_code))>0 OR position(f.search IN lower(coalesce(p.phone,'')))>0 OR (length(f.digits)>=3 AND position(f.digits IN regexp_replace(coalesce(p.phone,''),'\D','','g'))>0));
END $$;
REVOKE ALL ON FUNCTION public.admin_filtered_students(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_filtered_students(jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_student_page(_filters jsonb DEFAULT '{}'::jsonb, _page integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
 WITH filtered AS MATERIALIZED (SELECT * FROM public.admin_filtered_students(_filters)),
 totals AS (SELECT count(*) AS total FROM filtered),
 paging AS (SELECT total,greatest(1,ceil(total/50.0)::integer) AS pages,least(greatest(1,coalesce(_page,1)),greatest(1,ceil(total/50.0)::integer)) AS page FROM totals),
 rows AS (SELECT f.* FROM filtered f ORDER BY created_at DESC,id LIMIT 50 OFFSET (SELECT (page-1)*50 FROM paging)),
 programs AS (SELECT coalesce(nullif(application->>'program',''),'Not set') AS label,count(*) AS n FROM filtered GROUP BY 1),
 occupations AS (SELECT coalesce(nullif(split_part(application->>'first_choice',' — ',2),''),'Not set') AS label,count(*) AS n FROM filtered GROUP BY 1)
 SELECT jsonb_build_object('rows',coalesce((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC,r.id) FROM rows r),'[]'::jsonb),'total',p.total,'page',p.page,'pages',p.pages,'registered_total',(SELECT count(*) FROM public.profiles sp WHERE NOT EXISTS(SELECT 1 FROM public.user_roles sr WHERE sr.user_id=sp.id AND sr.role IN ('admin','sub_admin','department_head','viewer','finance'))),'program_counts',coalesce((SELECT jsonb_object_agg(label,n) FROM programs),'{}'::jsonb),'occupation_counts',coalesce((SELECT jsonb_object_agg(label,n) FROM occupations),'{}'::jsonb)) INTO result FROM paging p;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.admin_student_page(jsonb,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_student_page(jsonb,integer) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.admin_dashboard_summary()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
 WITH students AS MATERIALIZED (SELECT p.id FROM public.profiles p WHERE NOT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=p.id AND r.role IN ('admin','sub_admin','department_head','viewer','finance'))),
 apps AS MATERIALIZED (SELECT a.status,lower(coalesce(a.grade_12_results->'personal_info'->>'gender','')) AS gender FROM public.applications a JOIN students s ON s.id=a.user_id)
 SELECT jsonb_build_object('applications',(SELECT count(*) FROM public.applications),'pending_applications',(SELECT count(*) FROM public.applications WHERE status='pending'),'filled',(SELECT count(*) FROM apps),'sign_up_only',(SELECT count(*) FROM students s WHERE NOT EXISTS(SELECT 1 FROM public.applications a WHERE a.user_id=s.id)),'students',(SELECT count(*) FROM students),'results',(SELECT count(*) FROM public.psychometric_results),'payments',(SELECT count(*) FROM public.payments),'completed_payments',(SELECT count(*) FROM public.payments WHERE status='completed'),'pending_receipts',(SELECT count(*) FROM public.payments WHERE status='pending' AND payment_method IS DISTINCT FROM 'chapa'),'genders',jsonb_build_object('male',(SELECT count(*) FROM apps WHERE gender='male'),'female',(SELECT count(*) FROM apps WHERE gender='female'),'other',(SELECT count(*) FROM apps WHERE gender NOT IN ('male','female')))) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.admin_dashboard_summary() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_summary() TO authenticated,service_role;