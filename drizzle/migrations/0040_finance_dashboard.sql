CREATE TABLE public.telegram_student_chats (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  chat_id bigint NOT NULL,
  linked_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.telegram_student_chats TO authenticated;
GRANT ALL ON public.telegram_student_chats TO service_role;
ALTER TABLE public.telegram_student_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Finance and admins read telegram links" ON public.telegram_student_chats FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'finance') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sent_by uuid NOT NULL,
  amount numeric NOT NULL,
  account text NOT NULL,
  delivered boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_requests TO authenticated;
GRANT ALL ON public.payment_requests TO service_role;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Finance and admins read payment requests" ON public.payment_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'finance') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Finance read payments" ON public.payments FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'finance'));
CREATE POLICY "Finance review payments" ON public.payments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'finance')) WITH CHECK (public.has_role(auth.uid(),'finance'));
CREATE POLICY "Finance read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'finance'));
CREATE POLICY "Finance read applications" ON public.applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'finance'));
CREATE POLICY "Finance read user roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'finance'));
CREATE POLICY "Finance read psych results" ON public.psychometric_results FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'finance'));