ALTER TABLE public.admission_settings ADD COLUMN IF NOT EXISTS exam_start timestamptz, ADD COLUMN IF NOT EXISTS exam_end timestamptz;

CREATE OR REPLACE FUNCTION public.force_pending_status()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  male_cut numeric; female_cut numeric; cutoff numeric;
  submitted_score numeric; prog text; g text;
BEGIN
  IF TG_TABLE_NAME = 'payments' THEN
    SELECT program INTO prog FROM public.applications WHERE user_id = NEW.user_id LIMIT 1;
    NEW.program := COALESCE(prog, NEW.program, 'Regular');
    NEW.amount := CASE WHEN NEW.program IN ('Extension', 'Weekend') THEN 1700 ELSE 350 END;
  END IF;
  IF TG_TABLE_NAME = 'applications' THEN
    SELECT grade_12_cutoff, female_grade_12_cutoff INTO male_cut, female_cut FROM public.admission_settings WHERE id = true;
    g := lower(COALESCE(NEW.grade_12_results->'personal_info'->>'gender', ''));
    cutoff := CASE WHEN g = 'female' THEN COALESCE(female_cut, 150) ELSE COALESCE(male_cut, 160) END;
    IF COALESCE(NEW.grade_12_results->>'score', '') ~ '^[0-9]+([.][0-9]+)?$' THEN
      submitted_score := (NEW.grade_12_results->>'score')::numeric;
    END IF;
    NEW.status := CASE WHEN submitted_score IS NOT NULL AND submitted_score >= cutoff THEN 'approved' ELSE 'waiting_list' END;
  ELSIF TG_TABLE_NAME = 'payments' AND COALESCE(public.has_role(auth.uid(), 'admin'), false) = false THEN
    NEW.status := 'pending';
    NEW.paid_at := NULL;
  END IF;
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.reclassify_unreviewed_applications()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.applications
  SET status = CASE
    WHEN COALESCE(grade_12_results->>'score', '') ~ '^[0-9]+([.][0-9]+)?$'
      AND (grade_12_results->>'score')::numeric >=
        CASE WHEN lower(COALESCE(grade_12_results->'personal_info'->>'gender','')) = 'female'
             THEN NEW.female_grade_12_cutoff ELSE NEW.grade_12_cutoff END
    THEN 'approved' ELSE 'waiting_list' END
  WHERE status IN ('pending', 'waiting_list', 'approved');
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.get_exam_window()
 RETURNS TABLE(exam_start timestamptz, exam_end timestamptz)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT exam_start, exam_end FROM public.admission_settings WHERE id = true $$;
GRANT EXECUTE ON FUNCTION public.get_exam_window() TO authenticated;

CREATE TABLE public.exam_exit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  department text,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.exam_exit_events TO authenticated;
GRANT ALL ON public.exam_exit_events TO service_role;
ALTER TABLE public.exam_exit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students log own exits" ON public.exam_exit_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Heads view department exits" ON public.exam_exit_events FOR SELECT TO authenticated USING (department = public.head_department(auth.uid()) OR public.has_role(auth.uid(),'admin'));