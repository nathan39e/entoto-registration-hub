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
  IF COALESCE(public.has_role(auth.uid(), 'admin'), false) = false THEN
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