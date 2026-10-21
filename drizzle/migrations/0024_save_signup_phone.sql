CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, student_code, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Student'),
    NEW.email,
    public.generate_student_code(),
    CASE WHEN btrim(NEW.raw_user_meta_data->>'phone') ~ '^\+?[0-9]{9,15}$' THEN btrim(NEW.raw_user_meta_data->>'phone') ELSE NULL END
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$function$;