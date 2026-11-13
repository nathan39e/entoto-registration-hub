CREATE TABLE public.contact_submissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 100),
 email text NOT NULL CHECK (length(email) <= 255 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 subject text NOT NULL CHECK (length(trim(subject)) BETWEEN 1 AND 200),
 message text NOT NULL CHECK (length(trim(message)) BETWEEN 1 AND 5000),
 token_hash text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 read_at timestamptz,
 reply text CHECK (length(trim(reply)) BETWEEN 1 AND 5000),
 replied_at timestamptz,
 replied_by uuid
);
GRANT SELECT ON public.contact_submissions TO authenticated;
GRANT ALL ON public.contact_submissions TO service_role;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read contact inbox" ON public.contact_submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX contact_submissions_created_idx ON public.contact_submissions(created_at DESC, id);
CREATE OR REPLACE FUNCTION public.reply_to_contact(_id uuid, _reply text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF _reply IS NULL OR length(trim(_reply)) NOT BETWEEN 1 AND 5000 THEN RAISE EXCEPTION 'Reply must contain 1 to 5000 characters'; END IF;
 UPDATE public.contact_submissions SET reply = trim(_reply), replied_at = now(), replied_by = auth.uid(), read_at = coalesce(read_at, now()) WHERE id = _id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Message not found'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.reply_to_contact(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reply_to_contact(uuid, text) TO authenticated;
CREATE OR REPLACE FUNCTION public.mark_contact_read(_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 UPDATE public.contact_submissions SET read_at = coalesce(read_at, now()) WHERE id = _id;
END; $$;
REVOKE ALL ON FUNCTION public.mark_contact_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_contact_read(uuid) TO authenticated;