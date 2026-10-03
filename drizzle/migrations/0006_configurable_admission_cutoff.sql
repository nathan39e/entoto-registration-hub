CREATE TABLE public.admission_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  grade_12_cutoff numeric NOT NULL DEFAULT 150 CHECK (grade_12_cutoff >= 0 AND grade_12_cutoff <= 700),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.admission_settings TO authenticated;
GRANT INSERT, UPDATE ON public.admission_settings TO authenticated;
GRANT ALL ON public.admission_settings TO service_role;

ALTER TABLE public.admission_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed in users can view admission settings"
ON public.admission_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can create admission settings"
ON public.admission_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update admission settings"
ON public.admission_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.force_pending_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cutoff numeric;
  submitted_score numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_TABLE_NAME = 'applications' THEN
      SELECT grade_12_cutoff INTO cutoff
      FROM public.admission_settings
      WHERE id = true;
      cutoff := COALESCE(cutoff, 150);

      IF COALESCE(NEW.grade_12_results->>'score', '') ~ '^[0-9]+([.][0-9]+)?$' THEN
        submitted_score := (NEW.grade_12_results->>'score')::numeric;
      END IF;

      NEW.status := CASE
        WHEN submitted_score IS NOT NULL AND submitted_score >= cutoff THEN 'pending'
        ELSE 'waiting_list'
      END;
    ELSIF TG_TABLE_NAME = 'payments' THEN
      NEW.status := 'pending';
      NEW.paid_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reclassify_unreviewed_applications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.applications
  SET status = CASE
    WHEN COALESCE(grade_12_results->>'score', '') ~ '^[0-9]+([.][0-9]+)?$'
      AND (grade_12_results->>'score')::numeric >= NEW.grade_12_cutoff
    THEN 'pending'
    ELSE 'waiting_list'
  END
  WHERE status IN ('pending', 'waiting_list');
  RETURN NEW;
END;
$function$;

CREATE TRIGGER admission_settings_reclassify
AFTER INSERT OR UPDATE OF grade_12_cutoff ON public.admission_settings
FOR EACH ROW
EXECUTE FUNCTION public.reclassify_unreviewed_applications();