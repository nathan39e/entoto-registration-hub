CREATE OR REPLACE FUNCTION public.head_can_view_student(_student uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT public.has_role(auth.uid(), 'department_head') AND EXISTS (
  SELECT 1 FROM public.applications a
  LEFT JOIN public.department_placements p ON p.application_id = a.id
  WHERE a.user_id = _student AND (
   COALESCE(p.current_department, a.first_department) = public.head_department(auth.uid())
   OR p.placed_department = public.head_department(auth.uid())
  )
 );
$$;
REVOKE ALL ON FUNCTION public.head_can_view_student(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.head_can_view_student(uuid) TO authenticated, service_role;
ALTER POLICY "Department heads view their applications" ON public.applications USING (public.head_can_view_student(user_id));
ALTER POLICY "Heads view referred applications" ON public.applications USING (public.head_can_view_student(user_id));
ALTER POLICY "Department heads view their students" ON public.profiles USING (public.head_can_view_student(id));
ALTER POLICY "Heads view referred students" ON public.profiles USING (public.head_can_view_student(id));
ALTER POLICY "Heads view their placements" ON public.department_placements USING (public.head_can_view_student(user_id));
CREATE POLICY "Department heads read student documents" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'result-docs' AND EXISTS (
 SELECT 1 FROM public.applications a WHERE public.head_can_view_student(a.user_id)
 AND (a.result_doc_path = storage.objects.name OR EXISTS (
  SELECT 1 FROM jsonb_each(COALESCE(a.documents, '{}'::jsonb)) d
  WHERE (jsonb_typeof(d.value) = 'string' AND d.value #>> '{}' = storage.objects.name)
   OR (jsonb_typeof(d.value) = 'array' AND d.value @> jsonb_build_array(storage.objects.name))
 ))
));