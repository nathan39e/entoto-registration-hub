CREATE TABLE public.staff_permissions (
  user_id uuid PRIMARY KEY,
  can_edit_departments boolean NOT NULL DEFAULT false,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_permissions TO authenticated;
GRANT ALL ON public.staff_permissions TO service_role;
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read own permissions and admins read all" ON public.staff_permissions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage staff permissions" ON public.staff_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE OR REPLACE FUNCTION public.edit_student_choices(_actor uuid, _student uuid, _choices text[], _fields text[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE app_id uuid;
BEGIN
  IF NOT public.has_role(_actor, 'admin') AND NOT (public.has_role(_actor, 'sub_admin') AND EXISTS (SELECT 1 FROM public.staff_permissions WHERE user_id = _actor AND can_edit_departments)) THEN
    RAISE EXCEPTION 'Department editing permission denied';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _student AND role IN ('admin','sub_admin','department_head')) THEN RAISE EXCEPTION 'Select a student account'; END IF;
  IF cardinality(_choices) IS DISTINCT FROM 3 OR cardinality(_fields) IS DISTINCT FROM 3 OR _choices[1] = _choices[2] OR _choices[1] = _choices[3] OR _choices[2] = _choices[3] THEN RAISE EXCEPTION 'Choose three different departments'; END IF;
  SELECT id INTO app_id FROM public.applications WHERE user_id = _student FOR UPDATE;
  IF app_id IS NULL THEN RAISE EXCEPTION 'Student has no application'; END IF;
  UPDATE public.applications SET first_choice = _choices[1] || ' — ' || _fields[1], second_choice = _choices[2] || ' — ' || _fields[2], third_choice = _choices[3] || ' — ' || _fields[3], grade_12_results = jsonb_set(grade_12_results, '{sub_fields}', to_jsonb(_fields)) WHERE id = app_id;
  INSERT INTO public.department_placements(application_id, user_id, current_department) VALUES (app_id, _student, _choices[1])
  ON CONFLICT (application_id) DO UPDATE SET current_department = EXCLUDED.current_department, choice_index = 1, exam_score = NULL, decision = 'under_review', placed_department = NULL, placed_field = NULL, notes = 'Department choices changed by authorized staff; entry evaluation reset.', evaluated_by = _actor, evaluated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.edit_student_choices(uuid, uuid, text[], text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.edit_student_choices(uuid, uuid, text[], text[]) TO service_role;