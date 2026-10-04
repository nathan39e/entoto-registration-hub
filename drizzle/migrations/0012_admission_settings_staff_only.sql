DROP POLICY IF EXISTS "Signed in users can view admission settings" ON public.admission_settings;
CREATE POLICY "Staff can view admission settings" ON public.admission_settings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sub_admin'));