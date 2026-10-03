import { supabase } from "@/integrations/supabase/client";

export async function newsImageUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from("news-images").createSignedUrl(path, 3600);
  return error ? null : data.signedUrl;
}