CREATE OR REPLACE FUNCTION public.force_pending_status()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  male_cut numeric; female_cut numeric; cutoff numeric;
  submitted_score numeric; prog text; g text; staff boolean;
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
    staff := COALESCE(auth.role(), '') = 'service_role' OR COALESCE(public.has_role(auth.uid(), 'admin'), false) OR COALESCE(public.has_role(auth.uid(), 'sub_admin'), false);
    -- Self-claimed scores that meet the cutoff wait for staff document review before approval.
    NEW.status := CASE WHEN submitted_score IS NOT NULL AND submitted_score >= cutoff THEN CASE WHEN staff THEN 'approved' ELSE 'pending' END ELSE 'waiting_list' END;
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
    THEN CASE WHEN status = 'approved' THEN 'approved' ELSE 'pending' END
    ELSE 'waiting_list' END
  WHERE status IN ('pending', 'waiting_list', 'approved');
  RETURN NEW;
END; $function$;

CREATE OR REPLACE FUNCTION public.eligible_for_portal_exam(_user uuid, _dept text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$ SELECT NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user AND role IN ('admin','sub_admin','department_head')) AND EXISTS(SELECT 1 FROM public.applications a LEFT JOIN public.department_placements p ON p.application_id=a.id WHERE a.user_id=_user AND COALESCE(p.current_department,a.first_department)=_dept AND a.status NOT IN ('waiting_list','rejected','pending')) $function$;