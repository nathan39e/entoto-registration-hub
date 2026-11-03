DROP FUNCTION IF EXISTS public.viewer_student_overview();
CREATE FUNCTION public.viewer_student_overview()
RETURNS TABLE(full_name text, student_code text, phone text, program text, status text, first_choice text, second_choice text, third_choice text, current_department text, placed_department text, submitted_at timestamptz, gender text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'viewer'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Viewers only';
  END IF;
  RETURN QUERY
  SELECT pr.full_name, pr.student_code, pr.phone, a.program, a.status, a.first_choice, a.second_choice, a.third_choice,
    COALESCE(p.current_department, a.first_department), p.placed_department, a.submitted_at,
    lower(a.grade_12_results->'personal_info'->>'gender')
  FROM public.applications a
  JOIN public.profiles pr ON pr.id = a.user_id
  LEFT JOIN public.department_placements p ON p.application_id = a.id
  WHERE NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = a.user_id AND r.role IN ('admin','sub_admin','department_head','viewer'))
  ORDER BY a.submitted_at DESC;
END $$;
REVOKE ALL ON FUNCTION public.viewer_student_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.viewer_student_overview() TO authenticated;