CREATE TABLE public.telegram_admin_sessions (
  chat_id bigint PRIMARY KEY,
  telegram_user_id bigint NOT NULL,
  staff_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.telegram_admin_sessions TO service_role;
ALTER TABLE public.telegram_admin_sessions ENABLE ROW LEVEL SECURITY;