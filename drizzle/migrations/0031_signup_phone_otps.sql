CREATE TABLE public.signup_phone_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX signup_phone_otps_phone_idx ON public.signup_phone_otps (phone, created_at DESC);
GRANT ALL ON public.signup_phone_otps TO service_role;
ALTER TABLE public.signup_phone_otps ENABLE ROW LEVEL SECURITY;