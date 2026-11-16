CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT (_user_id = auth.uid() OR current_user NOT IN ('anon','authenticated'))
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.head_department(_user_id uuid)
 RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT department FROM public.department_heads WHERE user_id = _user_id
  AND (_user_id = auth.uid() OR current_user NOT IN ('anon','authenticated')) $$;

CREATE OR REPLACE FUNCTION public.is_referred_to_head(_user_id uuid, _app_user uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT (_user_id = auth.uid() OR current_user NOT IN ('anon','authenticated'))
  AND EXISTS (SELECT 1 FROM public.department_placements p WHERE p.user_id = _app_user AND p.current_department = public.head_department(_user_id)) $$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role), public.head_department(uuid), public.is_referred_to_head(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role), public.head_department(uuid), public.is_referred_to_head(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Finance review payments" ON public.payments;
CREATE POLICY "Finance review payments" ON public.payments FOR UPDATE TO authenticated
 USING (public.has_role(auth.uid(), 'finance'::app_role) AND user_id <> auth.uid())
 WITH CHECK (public.has_role(auth.uid(), 'finance'::app_role) AND user_id <> auth.uid());