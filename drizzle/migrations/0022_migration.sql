CREATE TABLE public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  visitor_id text NOT NULL,
  device text NOT NULL DEFAULT 'desktop',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX site_visits_created_idx ON public.site_visits(created_at);
GRANT INSERT ON public.site_visits TO anon, authenticated;
GRANT SELECT ON public.site_visits TO authenticated;
GRANT ALL ON public.site_visits TO service_role;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log a visit" ON public.site_visits FOR INSERT TO anon, authenticated
  WITH CHECK (length(path) <= 300 AND length(visitor_id) <= 64 AND device IN ('mobile','tablet','desktop'));
CREATE POLICY "Admins read visits" ON public.site_visits FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));