CREATE TABLE public.department_heads (
  user_id uuid PRIMARY KEY,
  department text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.department_heads TO authenticated;
GRANT ALL ON public.department_heads TO service_role;
ALTER TABLE public.department_heads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage department heads" ON public.department_heads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Heads view own assignment" ON public.department_heads FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.head_department(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT department FROM public.department_heads WHERE user_id = _user_id
$$;

ALTER TABLE public.applications ADD COLUMN first_department text;
ALTER TABLE public.applications ADD COLUMN program text;
UPDATE public.applications SET
  first_department = trim(split_part(first_choice, ' — ', 1)),
  program = COALESCE(grade_12_results->'personal_info'->>'program', grade_12_results->>'program');

CREATE OR REPLACE FUNCTION public.set_application_department()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.first_department := trim(split_part(NEW.first_choice, ' — ', 1));
  NEW.program := COALESCE(NEW.grade_12_results->'personal_info'->>'program', NEW.grade_12_results->>'program', NEW.program);
  RETURN NEW;
END; $$;
CREATE TRIGGER applications_set_department BEFORE INSERT OR UPDATE OF first_choice, grade_12_results ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_application_department();

CREATE POLICY "Department heads view their applications" ON public.applications FOR SELECT TO authenticated
  USING (first_department = public.head_department(auth.uid()));
CREATE POLICY "Department heads view their students" ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.applications a WHERE a.user_id = profiles.id AND a.first_department = public.head_department(auth.uid())));

CREATE TABLE public.department_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  title text NOT NULL,
  form_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.department_exams TO authenticated;
GRANT ALL ON public.department_exams TO service_role;
ALTER TABLE public.department_exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Heads manage own department exams" ON public.department_exams FOR ALL TO authenticated
  USING (department = public.head_department(auth.uid()))
  WITH CHECK (department = public.head_department(auth.uid()));
CREATE POLICY "Students view their department exams" ON public.department_exams FOR SELECT TO authenticated
  USING (is_active AND EXISTS (SELECT 1 FROM public.applications a WHERE a.user_id = auth.uid() AND a.first_department = department_exams.department));
CREATE POLICY "Admins view department exams" ON public.department_exams FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.payments ADD COLUMN program text;

CREATE OR REPLACE FUNCTION public.force_pending_status()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  cutoff numeric;
  submitted_score numeric;
  prog text;
BEGIN
  IF TG_TABLE_NAME = 'payments' THEN
    SELECT program INTO prog FROM public.applications WHERE user_id = NEW.user_id LIMIT 1;
    NEW.program := COALESCE(prog, NEW.program, 'Regular');
    NEW.amount := CASE WHEN NEW.program IN ('Extension', 'Weekend') THEN 1700 ELSE 350 END;
  END IF;
  IF COALESCE(public.has_role(auth.uid(), 'admin'), false) = false THEN
    IF TG_TABLE_NAME = 'applications' THEN
      SELECT grade_12_cutoff INTO cutoff FROM public.admission_settings WHERE id = true;
      cutoff := COALESCE(cutoff, 150);
      IF COALESCE(NEW.grade_12_results->>'score', '') ~ '^[0-9]+([.][0-9]+)?$' THEN
        submitted_score := (NEW.grade_12_results->>'score')::numeric;
      END IF;
      NEW.status := CASE WHEN submitted_score IS NOT NULL AND submitted_score >= cutoff THEN 'pending' ELSE 'waiting_list' END;
    ELSIF TG_TABLE_NAME = 'payments' THEN
      NEW.status := 'pending';
      NEW.paid_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

UPDATE public.payments p SET program = a.program FROM public.applications a WHERE a.user_id = p.user_id;