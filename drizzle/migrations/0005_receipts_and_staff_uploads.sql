ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS receipt_path text;
CREATE POLICY "Staff upload result docs" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'result-docs' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'sub_admin')));