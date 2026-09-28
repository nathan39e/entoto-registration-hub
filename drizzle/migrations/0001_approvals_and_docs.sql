ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS result_doc_path text;
CREATE UNIQUE INDEX IF NOT EXISTS applications_user_unique ON public.applications(user_id);

DROP POLICY IF EXISTS "Users can update their own applications" ON public.applications;
CREATE POLICY "Admins can update applications" ON public.applications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.force_pending_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := 'pending';
    IF TG_TABLE_NAME = 'payments' THEN NEW.paid_at := NULL; END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS applications_force_pending ON public.applications;
CREATE TRIGGER applications_force_pending BEFORE INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.force_pending_status();
DROP TRIGGER IF EXISTS payments_force_pending ON public.payments;
CREATE TRIGGER payments_force_pending BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.force_pending_status();

CREATE POLICY "Users upload own result docs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'result-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users read own result docs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'result-docs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));