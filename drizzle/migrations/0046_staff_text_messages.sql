CREATE FUNCTION public.staff_message_pair(_sender uuid, _recipient uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT _sender <> _recipient AND EXISTS (
 SELECT 1 FROM public.user_roles a JOIN public.user_roles b ON b.user_id = _recipient
 WHERE a.user_id = _sender AND ((a.role IN ('admin','sub_admin') AND b.role = 'department_head') OR (a.role = 'department_head' AND b.role IN ('admin','sub_admin'))))
$$;
REVOKE ALL ON FUNCTION public.staff_message_pair(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_message_pair(uuid,uuid) TO authenticated, service_role;
CREATE TABLE public.staff_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 4000),
 created_at timestamptz NOT NULL DEFAULT now(),
 edited_at timestamptz,
 CHECK (sender_id <> recipient_id)
);
GRANT SELECT, INSERT, DELETE ON public.staff_messages TO authenticated;
GRANT UPDATE (body) ON public.staff_messages TO authenticated;
GRANT ALL ON public.staff_messages TO service_role;
ALTER TABLE public.staff_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read staff messages" ON public.staff_messages FOR SELECT TO authenticated USING ((auth.uid() = sender_id OR auth.uid() = recipient_id) AND public.staff_message_pair(sender_id, recipient_id));
CREATE POLICY "Staff send own text messages" ON public.staff_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND public.staff_message_pair(sender_id, recipient_id));
CREATE POLICY "Senders edit own messages" ON public.staff_messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id AND public.staff_message_pair(sender_id, recipient_id)) WITH CHECK (auth.uid() = sender_id AND public.staff_message_pair(sender_id, recipient_id));
CREATE POLICY "Senders delete own messages" ON public.staff_messages FOR DELETE TO authenticated USING (auth.uid() = sender_id AND public.staff_message_pair(sender_id, recipient_id));
CREATE INDEX staff_messages_conversation ON public.staff_messages(sender_id,recipient_id,created_at);
CREATE INDEX staff_messages_recipient ON public.staff_messages(recipient_id,created_at);
CREATE FUNCTION public.guard_staff_message() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP = 'INSERT' THEN NEW.created_at := now(); NEW.edited_at := NULL;
 ELSE
 IF NEW.id IS DISTINCT FROM OLD.id OR NEW.sender_id IS DISTINCT FROM OLD.sender_id OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION 'Message participants and date cannot change'; END IF;
 NEW.edited_at := now();
 END IF;
 NEW.body := btrim(NEW.body);
 RETURN NEW;
END $$;
CREATE TRIGGER guard_staff_message BEFORE INSERT OR UPDATE ON public.staff_messages FOR EACH ROW EXECUTE FUNCTION public.guard_staff_message();
CREATE FUNCTION public.staff_message_contacts() RETURNS TABLE(user_id uuid, full_name text, role text, department text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT DISTINCT p.id, p.full_name, r.role::text, h.department FROM public.profiles p JOIN public.user_roles r ON r.user_id = p.id LEFT JOIN public.department_heads h ON h.user_id = p.id
 WHERE r.role IN ('admin','sub_admin','department_head') AND public.staff_message_pair(auth.uid(),p.id)
 ORDER BY p.full_name
$$;
REVOKE ALL ON FUNCTION public.staff_message_contacts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_message_contacts() TO authenticated, service_role;