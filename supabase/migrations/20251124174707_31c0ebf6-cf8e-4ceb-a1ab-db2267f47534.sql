-- Make student_code unique and not null for better identification
-- First, ensure all existing profiles have a student_code
UPDATE public.profiles 
SET student_code = public.generate_student_code() 
WHERE student_code IS NULL;

-- Add unique constraint to student_code
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_student_code_unique UNIQUE (student_code);

-- Make student_code NOT NULL since every student needs one
ALTER TABLE public.profiles 
ALTER COLUMN student_code SET NOT NULL;

-- Add index for efficient searching by student code
CREATE INDEX idx_profiles_student_code ON public.profiles(student_code);