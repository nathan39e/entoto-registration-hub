ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registered_by uuid;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS exam_required boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS profiles_registered_by_idx ON public.profiles(registered_by);
DROP POLICY IF EXISTS "Staff read result docs" ON storage.objects;
CREATE POLICY "Staff read result docs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'result-docs' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sub_admin')));
DROP POLICY IF EXISTS "Sub admins view results" ON public.psychometric_results;
CREATE POLICY "Sub admins view results" ON public.psychometric_results FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'sub_admin'));