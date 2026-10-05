ALTER TABLE public.admission_settings ADD COLUMN IF NOT EXISTS female_grade_12_cutoff numeric NOT NULL DEFAULT 150;
COMMENT ON COLUMN public.admission_settings.grade_12_cutoff IS 'Male minimum Grade 12 mark';
UPDATE public.admission_settings SET grade_12_cutoff = 160, female_grade_12_cutoff = 150 WHERE id = true;

CREATE OR REPLACE FUNCTION public.force_pending_status() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  male_cut numeric; female_cut numeric; cutoff numeric;
  submitted_score numeric; prog text; g text;
BEGIN
  IF TG_TABLE_NAME = 'payments' THEN
    SELECT program INTO prog FROM public.applications WHERE user_id = NEW.user_id LIMIT 1;
    NEW.program := COALESCE(prog, NEW.program, 'Regular');
    NEW.amount := CASE WHEN NEW.program IN ('Extension', 'Weekend') THEN 1700 ELSE 350 END;
  END IF;
  IF COALESCE(public.has_role(auth.uid(), 'admin'), false) = false THEN
    IF TG_TABLE_NAME = 'applications' THEN
      SELECT grade_12_cutoff, female_grade_12_cutoff INTO male_cut, female_cut FROM public.admission_settings WHERE id = true;
      g := lower(COALESCE(NEW.grade_12_results->'personal_info'->>'gender', ''));
      cutoff := CASE WHEN g = 'female' THEN COALESCE(female_cut, 150) ELSE COALESCE(male_cut, 160) END;
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
END; $$;

CREATE OR REPLACE FUNCTION public.reclassify_unreviewed_applications() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.applications
  SET status = CASE
    WHEN COALESCE(grade_12_results->>'score', '') ~ '^[0-9]+([.][0-9]+)?$'
      AND (grade_12_results->>'score')::numeric >=
        CASE WHEN lower(COALESCE(grade_12_results->'personal_info'->>'gender','')) = 'female'
             THEN NEW.female_grade_12_cutoff ELSE NEW.grade_12_cutoff END
    THEN 'pending' ELSE 'waiting_list' END
  WHERE status IN ('pending', 'waiting_list');
  RETURN NEW;
END; $$;