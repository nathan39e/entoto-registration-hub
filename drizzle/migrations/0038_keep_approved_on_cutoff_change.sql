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
    THEN 'pending'
    ELSE 'waiting_list' END
  WHERE status IN ('pending', 'waiting_list');
  RETURN NEW;
END; $function$;