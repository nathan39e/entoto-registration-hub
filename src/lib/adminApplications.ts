import type { Database } from "@/integrations/supabase/types";
import { fetchAll } from "@/lib/fetchAll";

type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];
export type AdminApplication = Pick<ApplicationRow, "id" | "user_id" | "first_choice" | "second_choice" | "third_choice" | "first_department" | "program" | "status" | "submitted_at" | "result_doc_path"> & {
  grade_12_results: { score: number | null; personal_info: { gender: string | null } };
};

type ScanSummary = Omit<AdminApplication, "grade_12_results"> & { score: number | null; gender: string | null };

export function applicationSummary({ score, gender, ...application }: ScanSummary): AdminApplication {
  return { ...application, grade_12_results: { score, personal_info: { gender } } };
}

// Full personal forms, subject marks and document maps are fetched only when opened/exported.
export async function fetchAdminApplications() {
  const { supabase } = await import("@/integrations/supabase/client");
  // Keep the JSON-path projection from recursively expanding generated client types.
  const fields: string = "id,user_id,first_choice,second_choice,third_choice,first_department,program,status,submitted_at,result_doc_path,score:grade_12_results->score,gender:grade_12_results->personal_info->gender";
  const response = await fetchAll<ScanSummary>(() => supabase.from("applications")
    .select(fields)
    .order("submitted_at", { ascending: false }).order("id"));
  return { ...response, data: response.data.map(applicationSummary) };
}