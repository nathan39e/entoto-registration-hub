CREATE TABLE public.department_placements (
  application_id uuid PRIMARY KEY REFERENCES public.applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  current_department text NOT NULL,
  choice_index int NOT NULL DEFAULT 1,
  exam_score numeric,
  decision text NOT NULL DEFAULT 'under_review',
  placed_department text,
  placed_field text,
  notes text,
  evaluated_by uuid,
  evaluated_at timestamptz
);
GRANT SELECT ON public.department_placements TO authenticated;
GRANT ALL ON public.department_placements TO service_role;
ALTER TABLE public.department_placements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own placement" ON public.department_placements FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Staff view placements" ON public.department_placements FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'sub_admin'));
CREATE POLICY "Heads view their placements" ON public.department_placements FOR SELECT TO authenticated USING (current_department = public.head_department(auth.uid()) OR placed_department = public.head_department(auth.uid()));

CREATE OR REPLACE FUNCTION public.is_referred_to_head(_user_id uuid, _app_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.department_placements p WHERE p.user_id = _app_user AND p.current_department = public.head_department(_user_id))
$$;
CREATE POLICY "Heads view referred applications" ON public.applications FOR SELECT TO authenticated USING (public.is_referred_to_head(auth.uid(), user_id));
CREATE POLICY "Heads view referred students" ON public.profiles FOR SELECT TO authenticated USING (public.is_referred_to_head(auth.uid(), id));

CREATE OR REPLACE FUNCTION public.evaluate_application(_app_id uuid, _score numeric, _decision text, _notes text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.applications%ROWTYPE;
  p public.department_placements%ROWTYPE;
  my_dept text;
  choices text[];
  next_idx int;
  cur_choice text;
BEGIN
  IF _decision NOT IN ('under_review','accepted','waitlisted','rejected','referred') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
  IF _score IS NOT NULL AND (_score < 0 OR _score > 100) THEN RAISE EXCEPTION 'Score must be 0-100'; END IF;
  SELECT * INTO a FROM public.applications WHERE id = _app_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
  INSERT INTO public.department_placements(application_id, user_id, current_department)
    VALUES (a.id, a.user_id, a.first_department) ON CONFLICT DO NOTHING;
  SELECT * INTO p FROM public.department_placements WHERE application_id = _app_id;
  my_dept := public.head_department(auth.uid());
  IF NOT public.has_role(auth.uid(),'admin') AND (my_dept IS NULL OR my_dept <> p.current_department) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  choices := ARRAY[a.first_choice, a.second_choice, a.third_choice];
  cur_choice := choices[p.choice_index];
  IF _decision = 'referred' THEN
    next_idx := p.choice_index + 1;
    IF next_idx > 3 THEN RAISE EXCEPTION 'No further department choices'; END IF;
    UPDATE public.department_placements SET current_department = trim(split_part(choices[next_idx], ' — ', 1)),
      choice_index = next_idx, exam_score = NULL, decision = 'under_review', placed_department = NULL, placed_field = NULL,
      notes = _notes, evaluated_by = auth.uid(), evaluated_at = now() WHERE application_id = _app_id;
    RETURN 'referred';
  END IF;
  UPDATE public.department_placements SET exam_score = _score, decision = _decision, notes = _notes,
    placed_department = CASE WHEN _decision = 'accepted' THEN p.current_department END,
    placed_field = CASE WHEN _decision = 'accepted' THEN NULLIF(trim(split_part(cur_choice, ' — ', 2)), '') END,
    evaluated_by = auth.uid(), evaluated_at = now() WHERE application_id = _app_id;
  RETURN _decision;
END; $$;
REVOKE EXECUTE ON FUNCTION public.evaluate_application(uuid, numeric, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.evaluate_application(uuid, numeric, text, text) TO authenticated;

INSERT INTO public.department_placements(application_id, user_id, current_department)
  SELECT id, user_id, first_department FROM public.applications WHERE first_department IS NOT NULL ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.create_placement_row()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.department_placements(application_id, user_id, current_department)
  VALUES (NEW.id, NEW.user_id, COALESCE(NEW.first_department, trim(split_part(NEW.first_choice, ' — ', 1)))) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER applications_create_placement AFTER INSERT ON public.applications FOR EACH ROW EXECUTE FUNCTION public.create_placement_row();