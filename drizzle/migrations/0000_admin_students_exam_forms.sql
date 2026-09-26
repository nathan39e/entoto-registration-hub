CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.exam_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  form_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_forms TO authenticated;
GRANT ALL ON public.exam_forms TO service_role;
ALTER TABLE public.exam_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed in users can view active exams" ON public.exam_forms FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage exams" ON public.exam_forms FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));