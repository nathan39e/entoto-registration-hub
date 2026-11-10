import { supabase } from "@/integrations/supabase/client";

/**
 * Downloads a private student document with the viewer's own session and returns a
 * local blob URL. No shareable bearer link is created, so access ends as soon as
 * the viewer's permissions are removed.
 */
export async function privateDocUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from("result-docs").download(path);
  if (error || !data) throw new Error(error?.message ?? "Could not open document");
  return URL.createObjectURL(data);
}
