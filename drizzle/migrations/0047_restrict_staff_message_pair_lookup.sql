CREATE OR REPLACE FUNCTION public.staff_message_pair(_sender uuid, _recipient uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT auth.uid() IN (_sender, _recipient) AND _sender <> _recipient AND EXISTS (
 SELECT 1 FROM public.user_roles a JOIN public.user_roles b ON b.user_id = _recipient
 WHERE a.user_id = _sender AND ((a.role IN ('admin','sub_admin') AND b.role = 'department_head') OR (a.role = 'department_head' AND b.role IN ('admin','sub_admin'))))
$$;