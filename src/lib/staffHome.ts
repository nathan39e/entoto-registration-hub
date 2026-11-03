import { supabase } from "@/integrations/supabase/client";

/** Returns the staff home path for admins, sub admins and department heads, or null for students. */
export const staffHome = async (uid: string): Promise<string | null> => {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
  const roles = (data ?? []).map((r) => r.role);
  if (roles.includes("admin")) return "/admin-dashboard";
  if (roles.includes("sub_admin")) return "/staff";
  if (roles.includes("department_head")) return "/department-head";
  if (roles.includes("viewer")) return "/viewer";
  return null;
};
