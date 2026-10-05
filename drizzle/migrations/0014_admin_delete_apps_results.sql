GRANT DELETE ON public.applications, public.psychometric_results, public.department_placements TO authenticated;
CREATE POLICY "Admins delete applications" ON public.applications FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete test results" ON public.psychometric_results FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete placements" ON public.department_placements FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));