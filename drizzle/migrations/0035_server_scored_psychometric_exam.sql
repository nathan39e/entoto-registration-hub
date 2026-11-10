CREATE TABLE public.psych_answer_key (n int PRIMARY KEY, cat text NOT NULL, answer int);
REVOKE ALL ON public.psych_answer_key FROM anon, authenticated;
GRANT ALL ON public.psych_answer_key TO service_role;
ALTER TABLE public.psych_answer_key ENABLE ROW LEVEL SECURITY;
INSERT INTO public.psych_answer_key VALUES (1,'Verbal Reasoning',1),(2,'Aesthetics',1),(3,'Aesthetics',2),(4,'Numerical Reasoning',1),(5,'Aesthetics',1),(6,'Personality Profile',NULL),(7,'Aesthetics',1),(8,'Situational Judgment',1),(9,'Aesthetics',1),(10,'ICT',2),(11,'Logical Reasoning',1),(12,'ICT',2),(13,'ICT',2),(14,'Numerical Reasoning',1),(15,'ICT',2),(16,'ICT',0),(17,'Verbal Reasoning',1),(18,'Garment and Textile',1),(19,'Garment and Textile',2),(20,'Logical Reasoning',2),(21,'Garment and Textile',1),(22,'Personality Profile',NULL),(23,'Garment and Textile',2),(24,'Garment and Textile',1),(25,'Hotel and Tourism',1),(26,'Numerical Reasoning',1),(27,'Hotel and Tourism',1),(28,'Hotel and Tourism',1),(29,'Situational Judgment',1),(30,'Hotel and Tourism',1),(31,'Hotel and Tourism',2),(32,'Verbal Reasoning',2),(33,'Automotive Technology',2),(34,'Automotive Technology',1),(35,'Logical Reasoning',2),(36,'Automotive Technology',1),(37,'Automotive Technology',1),(38,'Personality Profile',NULL),(39,'Automotive Technology',1),(40,'Business and Finance',1),(41,'Numerical Reasoning',0),(42,'Business and Finance',2),(43,'Business and Finance',1),(44,'Situational Judgment',1),(45,'Business and Finance',1),(46,'Business and Finance',2),(47,'Verbal Reasoning',0),(48,'Electrical and Electronics',0),(49,'Electrical and Electronics',1),(50,'Logical Reasoning',0),(51,'Electrical and Electronics',1),(52,'Electrical and Electronics',2),(53,'Personality Profile',NULL),(54,'Electrical and Electronics',3),(55,'Urban Agriculture',1),(56,'Numerical Reasoning',1),(57,'Urban Agriculture',0),(58,'Urban Agriculture',1),(59,'Situational Judgment',1),(60,'Urban Agriculture',1),(61,'Urban Agriculture',1),(62,'Verbal Reasoning',0),(63,'Construction Technology and Wood Work',2),(64,'Construction Technology and Wood Work',0),(65,'Logical Reasoning',1),(66,'Construction Technology and Wood Work',1),(67,'Construction Technology and Wood Work',1),(68,'Personality Profile',NULL),(69,'Construction Technology and Wood Work',1),(70,'Metal Technology',1),(71,'Numerical Reasoning',2),(72,'Metal Technology',2),(73,'Metal Technology',1),(74,'Situational Judgment',1),(75,'Metal Technology',2),(76,'Metal Technology',1),(77,'Verbal Reasoning',0),(78,'Logical Reasoning',0),(79,'Numerical Reasoning',1),(80,'Situational Judgment',1);

DROP POLICY IF EXISTS "Users can insert their own test results" ON public.psychometric_results;

CREATE OR REPLACE FUNCTION public.submit_psychometric_exam(_answers jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid(); sc jsonb; overall int; rec text;
 cat_order text[] := ARRAY['Aesthetics','ICT','Garment and Textile','Hotel and Tourism','Automotive Technology','Business and Finance','Electrical and Electronics','Urban Agriculture','Construction Technology','Wood Work and Metal Technology'];
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF jsonb_typeof(_answers) IS DISTINCT FROM 'object' OR octet_length(_answers::text) > 20000 THEN RAISE EXCEPTION 'Invalid answers'; END IF;
 IF EXISTS (SELECT 1 FROM jsonb_each(_answers) e WHERE e.key !~ '^[0-9]{1,3}$' OR NOT EXISTS (SELECT 1 FROM psych_answer_key k WHERE k.n = e.key::int) OR jsonb_typeof(e.value) <> 'number') THEN RAISE EXCEPTION 'Invalid answers'; END IF;
 WITH g AS (SELECT k.cat, count(*) t, count(*) FILTER (WHERE (_answers->>k.n::text)::numeric = k.answer) c FROM psych_answer_key k WHERE k.answer IS NOT NULL GROUP BY k.cat)
 SELECT jsonb_object_agg(cat, round(c * 100.0 / t)), round(sum(c) * 100.0 / sum(t)) INTO sc, overall FROM g;
 SELECT d INTO rec FROM (
   SELECT CASE e.key WHEN 'Construction Technology and Wood Work' THEN 'Construction Technology' WHEN 'Metal Technology' THEN 'Wood Work and Metal Technology' ELSE e.key END d, (e.value)::numeric v FROM jsonb_each(sc) e) x
 WHERE d = ANY(cat_order) ORDER BY v DESC, array_position(cat_order, d) LIMIT 1;
 INSERT INTO public.psychometric_results(user_id, answers, scores, recommended_departments)
 VALUES (uid, _answers, sc || jsonb_build_object('Overall', overall), CASE WHEN rec IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(rec) END);
END $$;
REVOKE ALL ON FUNCTION public.submit_psychometric_exam(jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.submit_psychometric_exam(jsonb) TO authenticated;